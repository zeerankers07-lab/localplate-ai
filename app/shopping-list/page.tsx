"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FilterMode = "all" | "remaining" | "purchased";

type Category =
    | "Vegetables"
    | "Meat"
    | "Dairy"
    | "Pantry"
    | "Spices"
    | "Other";

type ShoppingItem = {
    id: string;
    name: string;
    quantity: string;
    cost: number | null;
};

type Toast = {
    id: number;
    message: string;
    tone: "success" | "error";
    action?: { label: string; run: () => void };
};

type ListSnapshot = {
    shoppingList: string;
    checkedItems: string[];
    favoriteItems: string[];
    customItems: ShoppingItem[];
    manualPrices: Record<string, number>;
};

const CATEGORY_ORDER: Category[] = [
    "Vegetables",
    "Meat",
    "Dairy",
    "Pantry",
    "Spices",
    "Other",
];

const CATEGORY_ICONS: Record<Category, string> = {
    Vegetables: "🥬",
    Meat: "🥩",
    Dairy: "🥛",
    Pantry: "🫘",
    Spices: "🌶️",
    Other: "🛒",
};

function normalize(value: string) {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getCategory(name: string): Category {
    const value = normalize(name);

    const vegetables = [
        "onion", "tomato", "potato", "carrot", "cucumber", "spinach",
        "palak", "capsicum", "pepper", "peas", "pea", "cauliflower",
        "gobi", "cabbage", "okra", "bhindi", "brinjal", "eggplant",
        "garlic", "ginger", "lemon", "lime", "coriander", "dhaniya",
        "mint", "podina", "lettuce", "broccoli", "vegetable",
    ];

    const meat = [
        "chicken", "beef", "mutton", "lamb", "meat", "fish", "prawn",
        "shrimp", "keema", "mince", "turkey", "goat", "boneless",
    ];

    const dairy = [
        "milk", "yogurt", "yoghurt", "dahi", "cheese", "butter",
        "cream", "paneer", "ghee", "lassi",
    ];

    const spices = [
        "salt", "namak", "pepper", "mirch", "chilli", "chili",
        "cumin", "zeera", "turmeric", "haldi", "coriander powder",
        "garam masala", "masala", "paprika", "cinnamon", "dalchini",
        "cardamom", "elaichi", "clove", "laung", "fenugreek", "methi",
        "spice", "spices",
    ];

    const pantry = [
        "rice", "flour", "atta", "maida", "sugar", "cheeni", "oil",
        "cooking oil", "olive oil", "dal", "lentil", "chickpea",
        "chana", "bean", "beans", "pasta", "noodle", "noodles",
        "bread", "roti", "oats", "cereal", "sauce", "ketchup",
        "vinegar", "stock", "broth", "honey", "peanut", "dry fruit",
        "nuts", "almond", "cashew",
    ];

    if (vegetables.some((word) => value.includes(word))) return "Vegetables";
    if (meat.some((word) => value.includes(word))) return "Meat";
    if (dairy.some((word) => value.includes(word))) return "Dairy";
    if (spices.some((word) => value.includes(word))) return "Spices";
    if (pantry.some((word) => value.includes(word))) return "Pantry";

    return "Other";
}

function parseCost(value: string): number | null {
    const match = value.match(
        /(?:Rs\.?|PKR|₨)\s*([\d,]+(?:\.\d+)?)/i
    );

    if (!match) return null;

    const parsed = Number(match[1].replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
}

function extractSection(text: string) {
    const weekly = text.match(
        /#{1,6}\s*🛒\s*Weekly\s+Shopping\s+List\s*[\r\n]+([\s\S]*?)(?=\n#{1,6}\s*💰\s*Weekly\s+Cost\s+Summary|\n#{1,6}\s+\S|$)/i
    );

    if (weekly?.[1]?.trim()) return weekly[1];

    const single = text.match(
        /#{1,6}\s*🛒\s*Ingredients\s*[\r\n]+([\s\S]*?)(?=\n#{1,6}\s*(?:👨‍🍳\s*Cooking\s+Instructions|💰\s*Estimated\s+Cost)|\n#{1,6}\s+\S|$)/i
    );

    if (single?.[1]?.trim()) return single[1];

    const fallback = text.match(
        /#{1,6}\s*[🛒]?\s*(?:Shopping\s+List|Ingredients)\s*[\r\n]+([\s\S]*?)(?=\n#{1,6}\s+\S|$)/i
    );

    return fallback?.[1] || "";
}

function parseShoppingItems(text: string): ShoppingItem[] {
    const section = extractSection(text);
    if (!section.trim()) return [];

    const items: ShoppingItem[] = [];
    const seen = new Set<string>();

    section.split(/\r?\n/).forEach((line, index) => {
        let clean = line.trim();

        if (!clean) return;

        const bulletMatch = clean.match(/^(?:[-*•]|\d+[.)])\s+/);
        if (!bulletMatch) return;

        clean = clean
            .replace(/^(?:[-*•]|\d+[.)])\s+/, "")
            .replace(/\*\*/g, "")
            .trim();

        if (!clean) return;

        let parts: string[];

        if (clean.includes("—")) {
            parts = clean.split("—").map((part) => part.trim());
        } else if (clean.includes("|")) {
            parts = clean.split("|").map((part) => part.trim());
        } else {
            parts = clean.split(/\s+-\s+/).map((part) => part.trim());
        }

        const name = parts[0] || clean;
        const cost = parseCost(clean);

        let quantity = parts[1] || "";

        if (quantity && /(?:Rs\.?|PKR|₨)\s*[\d,]/i.test(quantity)) {
            quantity = "";
        }

        const key = `${normalize(name)}|${normalize(quantity)}|${cost ?? ""}`;

        if (seen.has(key)) return;
        seen.add(key);

        items.push({
            id: `${index}-${key}`,
            name,
            quantity,
            cost,
        });
    });

    return items;
}

function itemText(
    item: ShoppingItem,
    purchased: boolean,
    includeStatus = true,
    effectiveCost: number | null = item.cost
) {
    const quantity = item.quantity ? ` — ${item.quantity}` : "";
    const cost =
        effectiveCost !== null
            ? ` — Rs. ${effectiveCost.toLocaleString()}`
            : "";
    const status = includeStatus && purchased ? " ✓" : "";

    return `- ${item.name}${quantity}${cost}${status}`;
}

export default function ShoppingListPage() {
    const router = useRouter();
    const [shoppingList, setShoppingList] = useState("");
    const [checkedItems, setCheckedItems] = useState<string[]>([]);
    const [favoriteItems, setFavoriteItems] = useState<string[]>([]);
    const [customItems, setCustomItems] = useState<ShoppingItem[]>([]);
    const [manualPrices, setManualPrices] = useState<Record<string, number>>({});
    const [loaded, setLoaded] = useState(false);
    const [dbLoaded, setDbLoaded] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterMode, setFilterMode] = useState<FilterMode>("all");
    const [categoryFilter, setCategoryFilter] = useState<Category | "All">(
        "All"
    );

    const [copied, setCopied] = useState(false);
    const [whatsappOpened, setWhatsappOpened] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [clearError, setClearError] = useState("");
    const [collapsedCategories, setCollapsedCategories] = useState<
        Category[]
    >([]);
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [toast, setToast] = useState<Toast | null>(null);
    const toastTimer = useRef<number | null>(null);

    const showToast = (
        message: string,
        tone: "success" | "error" = "success",
        action?: { label: string; run: () => void },
        duration = 3000
    ) => {
        if (toastTimer.current) window.clearTimeout(toastTimer.current);

        setToast({ id: Date.now(), message, tone, action });

        toastTimer.current = window.setTimeout(
            () => setToast(null),
            duration
        );
    };

    useEffect(() => {
        return () => {
            if (toastTimer.current) window.clearTimeout(toastTimer.current);
        };
    }, []);

    // Clear dialog: Escape closes it, page does not scroll behind it.
    useEffect(() => {
        if (!showClearConfirm) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !clearing) {
                setShowClearConfirm(false);
            }
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [showClearConfirm, clearing]);

    const [newItemName, setNewItemName] = useState("");
    const [newItemQuantity, setNewItemQuantity] = useState("");
    const [newItemCost, setNewItemCost] = useState("");

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingQuantity, setEditingQuantity] = useState("");
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [editingPrice, setEditingPrice] = useState("");

    useEffect(() => {
        const savedList = localStorage.getItem(
            "localplate_shopping_list"
        );

        if (savedList) setShoppingList(savedList);

        try {
            const savedChecked = JSON.parse(
                localStorage.getItem("localplate_checked_items") || "[]"
            );

            const savedFavorites = JSON.parse(
                localStorage.getItem("localplate_favorite_items") || "[]"
            );

            const savedCustom = JSON.parse(
                localStorage.getItem("localplate_custom_items") || "[]"
            );

            const savedManualPrices = JSON.parse(
                localStorage.getItem("localplate_manual_prices") || "{}"
            );

            setCheckedItems(
                Array.isArray(savedChecked)
                    ? savedChecked.filter(
                        (item): item is string =>
                            typeof item === "string"
                    )
                    : []
            );

            setFavoriteItems(
                Array.isArray(savedFavorites)
                    ? savedFavorites.filter(
                        (item): item is string =>
                            typeof item === "string"
                    )
                    : []
            );

            setCustomItems(
                Array.isArray(savedCustom)
                    ? savedCustom.filter(
                        (item): item is ShoppingItem =>
                            item &&
                            typeof item.id === "string" &&
                            typeof item.name === "string" &&
                            typeof item.quantity === "string" &&
                            (typeof item.cost === "number" ||
                                item.cost === null)
                    )
                    : []
            );

            const validManualPrices: Record<string, number> = {};

            if (
                savedManualPrices &&
                typeof savedManualPrices === "object" &&
                !Array.isArray(savedManualPrices)
            ) {
                Object.entries(savedManualPrices).forEach(([key, value]) => {
                    if (
                        typeof value === "number" &&
                        Number.isFinite(value) &&
                        value >= 0
                    ) {
                        validManualPrices[key] = value;
                    }
                });
            }

            setManualPrices(validManualPrices);
        } catch (error) {
            console.error("Failed to load shopping list state:", error);
        }

        setLoaded(true);
    }, []);

    // Load the signed-in user's shopping list from Supabase.
    // Local storage is loaded first so the existing offline experience stays intact.
    useEffect(() => {
        if (!loaded) return;

        let cancelled = false;

        const loadFromDatabase = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user || cancelled) {
                    if (!cancelled) setDbLoaded(true);
                    return;
                }

                const { data, error } = await supabase
                    .from("shopping_lists")
                    .select(
                        "shopping_list, checked_items, favorite_items, custom_items, manual_prices"
                    )
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (error) throw error;
                if (cancelled) return;

                const localList =
                    localStorage.getItem("localplate_shopping_list") || "";
                const lastSynced = localStorage.getItem(
                    "localplate_synced_list"
                );
                const dbList =
                    typeof data?.shopping_list === "string"
                        ? data.shopping_list
                        : "";

                // A new plan was written locally (planner / weekly plan)
                // and the database has not seen it yet.
                const localIsNewer =
                    !!data &&
                    localList.trim() !== "" &&
                    localList !== lastSynced &&
                    localList !== dbList;

                if (data && !localIsNewer) {
                    const dbShoppingList =
                        typeof data.shopping_list === "string"
                            ? data.shopping_list
                            : "";

                    const dbChecked = Array.isArray(data.checked_items)
                        ? data.checked_items.filter(
                            (item): item is string =>
                                typeof item === "string"
                        )
                        : [];

                    const dbFavorites = Array.isArray(data.favorite_items)
                        ? data.favorite_items.filter(
                            (item): item is string =>
                                typeof item === "string"
                        )
                        : [];

                    const dbCustom = Array.isArray(data.custom_items)
                        ? data.custom_items.filter(
                            (item): item is ShoppingItem =>
                                item &&
                                typeof item.id === "string" &&
                                typeof item.name === "string" &&
                                typeof item.quantity === "string" &&
                                (typeof item.cost === "number" ||
                                    item.cost === null)
                        )
                        : [];

                    const dbPrices: Record<string, number> = {};
                    if (
                        data.manual_prices &&
                        typeof data.manual_prices === "object" &&
                        !Array.isArray(data.manual_prices)
                    ) {
                        Object.entries(data.manual_prices as Record<string, unknown>).forEach(
                            ([key, value]) => {
                                if (
                                    typeof value === "number" &&
                                    Number.isFinite(value) &&
                                    value >= 0
                                ) {
                                    dbPrices[key] = value;
                                }
                            }
                        );
                    }

                    setShoppingList(dbShoppingList);
                    setCheckedItems(dbChecked);
                    setFavoriteItems(dbFavorites);
                    setCustomItems(dbCustom);
                    setManualPrices(dbPrices);

                    localStorage.setItem(
                        "localplate_shopping_list",
                        dbShoppingList
                    );
                    localStorage.setItem(
                        "localplate_checked_items",
                        JSON.stringify(dbChecked)
                    );
                    localStorage.setItem(
                        "localplate_favorite_items",
                        JSON.stringify(dbFavorites)
                    );
                    localStorage.setItem(
                        "localplate_custom_items",
                        JSON.stringify(dbCustom)
                    );
                    localStorage.setItem(
                        "localplate_manual_prices",
                        JSON.stringify(dbPrices)
                    );
                    localStorage.setItem(
                        "localplate_synced_list",
                        dbShoppingList
                    );
                } else if (localIsNewer) {
                    // New list: keep it, reset progress of the old list.
                    setCheckedItems([]);
                    setFavoriteItems([]);
                    setManualPrices({});
                    localStorage.removeItem("localplate_checked_items");
                    localStorage.removeItem("localplate_favorite_items");
                    localStorage.removeItem("localplate_manual_prices");
                } else {
                    // First login: migrate the existing local list into the user's account.

                    const { error: migrationError } = await supabase
                        .from("shopping_lists")
                        .upsert(
                            {
                                user_id: user.id,
                                shopping_list:
                                    localStorage.getItem(
                                        "localplate_shopping_list"
                                    ) || "",
                                checked_items: JSON.parse(
                                    localStorage.getItem(
                                        "localplate_checked_items"
                                    ) || "[]"
                                ),
                                favorite_items: JSON.parse(
                                    localStorage.getItem(
                                        "localplate_favorite_items"
                                    ) || "[]"
                                ),
                                custom_items: JSON.parse(
                                    localStorage.getItem(
                                        "localplate_custom_items"
                                    ) || "[]"
                                ),
                                manual_prices: JSON.parse(
                                    localStorage.getItem(
                                        "localplate_manual_prices"
                                    ) || "{}"
                                ),
                                updated_at: new Date().toISOString(),
                            },
                            { onConflict: "user_id" }
                        );

                    if (migrationError) {
                        console.error(
                            "Shopping list migration failed:",
                            migrationError
                        );
                        throw migrationError;
                    }

                    localStorage.setItem("localplate_synced_list", localList);
                }
            } catch (error) {
                console.error(
                    "Failed to load shopping list from Supabase:",
                    error
                );
            } finally {
                if (!cancelled) {
                    setDbLoaded(true);
                }
            }
        };

        loadFromDatabase();

        return () => {
            cancelled = true;
        };
    }, [loaded]);

    // Keep the signed-in user's list synchronized with Supabase.
    // A short debounce prevents excessive database writes while editing.
    useEffect(() => {
        if (!loaded || !dbLoaded) return;

        const timer = window.setTimeout(async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                setSyncing(true);

                const { error } = await supabase.from("shopping_lists").upsert(
                    {
                        user_id: user.id,
                        shopping_list: shoppingList,
                        checked_items: checkedItems,
                        favorite_items: favoriteItems,
                        custom_items: customItems,
                        manual_prices: manualPrices,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id" }
                );

                if (error) throw error;

                localStorage.setItem("localplate_synced_list", shoppingList);
            } catch (error) {
                console.error("Failed to sync shopping list:", error);
            } finally {
                setSyncing(false);
            }
        }, 700);

        return () => window.clearTimeout(timer);
    }, [
        loaded,
        dbLoaded,
        shoppingList,
        checkedItems,
        favoriteItems,
        customItems,
        manualPrices,
    ]);

    const parsedItems = useMemo(
        () => parseShoppingItems(shoppingList),
        [shoppingList]
    );

    const ingredientItems = useMemo(() => {
        const merged = [...parsedItems, ...customItems];
        const seen = new Set<string>();

        return merged.filter((item) => {
            const key = `${normalize(item.name)}|${normalize(
                item.quantity
            )}|${item.cost ?? ""}`;

            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [parsedItems, customItems]);

    const getEffectiveCost = (item: ShoppingItem) => {
        return Object.prototype.hasOwnProperty.call(manualPrices, item.id)
            ? manualPrices[item.id]
            : item.cost;
    };

    const persistManualPrices = (prices: Record<string, number>) => {
        localStorage.setItem("localplate_manual_prices", JSON.stringify(prices));
    };

    useEffect(() => {
        if (!loaded) return;

        const validIds = new Set(ingredientItems.map((item) => item.id));

        setCheckedItems((current) => {
            const cleaned = current.filter((id) => validIds.has(id));

            if (cleaned.length !== current.length) {
                localStorage.setItem(
                    "localplate_checked_items",
                    JSON.stringify(cleaned)
                );
            }

            return cleaned;
        });

        setManualPrices((current) => {
            const cleaned: Record<string, number> = Object.fromEntries(
                Object.entries(current).filter(([id]) => validIds.has(id))
            ) as Record<string, number>;
            if (Object.keys(cleaned).length !== Object.keys(current).length) {
                persistManualPrices(cleaned);
            }
            return cleaned;
        });

        setFavoriteItems((current) => {
            const cleaned = current.filter((id) => validIds.has(id));

            if (cleaned.length !== current.length) {
                localStorage.setItem(
                    "localplate_favorite_items",
                    JSON.stringify(cleaned)
                );
            }

            return cleaned;
        });
    }, [ingredientItems, loaded]);

    const visibleItems = useMemo(() => {
        const search = normalize(searchTerm);

        return ingredientItems.filter((item) => {
            const matchesSearch =
                !search ||
                normalize(item.name).includes(search) ||
                normalize(item.quantity).includes(search);

            const purchased = checkedItems.includes(item.id);

            const matchesFilter =
                filterMode === "all"
                    ? true
                    : filterMode === "purchased"
                        ? purchased
                        : !purchased;

            const matchesCategory =
                categoryFilter === "All" ||
                getCategory(item.name) === categoryFilter;

            const matchesFavorites =
                !favoritesOnly || favoriteItems.includes(item.id);

            return (
                matchesSearch &&
                matchesFilter &&
                matchesCategory &&
                matchesFavorites
            );
        });
    }, [
        ingredientItems,
        checkedItems,
        favoriteItems,
        favoritesOnly,
        searchTerm,
        filterMode,
        categoryFilter,
    ]);

    const groupedVisibleItems = useMemo(() => {
        const groups: Record<Category, ShoppingItem[]> = {
            Vegetables: [],
            Meat: [],
            Dairy: [],
            Pantry: [],
            Spices: [],
            Other: [],
        };

        visibleItems.forEach((item) => {
            groups[getCategory(item.name)].push(item);
        });

        return CATEGORY_ORDER.filter(
            (category) => groups[category].length > 0
        ).map((category) => ({
            category,
            items: groups[category],
        }));
    }, [visibleItems]);

    const totalItems = ingredientItems.length;

    const purchasedItems = ingredientItems.filter((item) =>
        checkedItems.includes(item.id)
    ).length;

    const remainingItems = Math.max(
        totalItems - purchasedItems,
        0
    );

    const totalCost = ingredientItems.reduce(
        (total, item) => total + (getEffectiveCost(item) ?? 0),
        0
    );

    const purchasedCost = ingredientItems
        .filter((item) => checkedItems.includes(item.id))
        .reduce((total, item) => total + (getEffectiveCost(item) ?? 0), 0);

    const remainingCost = ingredientItems
        .filter((item) => !checkedItems.includes(item.id))
        .reduce((total, item) => total + (getEffectiveCost(item) ?? 0), 0);

    const progress =
        totalItems > 0
            ? Math.round((purchasedItems / totalItems) * 100)
            : 0;

    const categoriesUsed = new Set(
        ingredientItems.map((item) => getCategory(item.name))
    ).size;

    const persistChecked = (items: string[]) => {
        localStorage.setItem(
            "localplate_checked_items",
            JSON.stringify(items)
        );
    };

    const persistFavorites = (items: string[]) => {
        localStorage.setItem(
            "localplate_favorite_items",
            JSON.stringify(items)
        );
    };

    const toggleItem = (id: string) => {
        setCheckedItems((current) => {
            const updated = current.includes(id)
                ? current.filter((itemId) => itemId !== id)
                : [...current, id];

            persistChecked(updated);
            return updated;
        });
    };

    const toggleFavorite = (id: string) => {
        setFavoriteItems((current) => {
            const updated = current.includes(id)
                ? current.filter((itemId) => itemId !== id)
                : [...current, id];

            persistFavorites(updated);
            return updated;
        });
    };

    const toggleAllItems = () => {
        if (totalItems === 0) return;

        const allIds = ingredientItems.map((item) => item.id);

        const updated =
            purchasedItems === totalItems ? [] : allIds;

        setCheckedItems(updated);
        persistChecked(updated);
    };

    const clearCheckedItems = () => {
        setCheckedItems([]);
        persistChecked([]);
    };

    const removeCustomItem = (id: string) => {
        setCustomItems((current) => {
            const updated = current.filter((item) => item.id !== id);
            localStorage.setItem(
                "localplate_custom_items",
                JSON.stringify(updated)
            );
            return updated;
        });

        setCheckedItems((current) => {
            const updated = current.filter((itemId) => itemId !== id);
            persistChecked(updated);
            return updated;
        });

        setFavoriteItems((current) => {
            const updated = current.filter((itemId) => itemId !== id);
            persistFavorites(updated);
            return updated;
        });
    };

    const addCustomItem = () => {
        const name = newItemName.trim();
        if (!name) return;

        const numericCost = Number(
            newItemCost.replace(/,/g, "").trim()
        );

        const item: ShoppingItem = {
            id: `custom-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,
            name,
            quantity: newItemQuantity.trim(),
            cost:
                newItemCost.trim() && Number.isFinite(numericCost)
                    ? numericCost
                    : null,
        };

        setCustomItems((current) => {
            const updated = [...current, item];
            localStorage.setItem(
                "localplate_custom_items",
                JSON.stringify(updated)
            );
            return updated;
        });

        setNewItemName("");
        setNewItemQuantity("");
        setNewItemCost("");
        showToast(`"${name}" added to your list`);
    };

    const startEditQuantity = (item: ShoppingItem) => {
        setEditingId(item.id);
        setEditingQuantity(item.quantity);
    };

    const saveQuantity = (id: string) => {
        const custom = customItems.find((item) => item.id === id);

        if (!custom) {
            setEditingId(null);
            return;
        }

        setCustomItems((current) => {
            const updated = current.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        quantity: editingQuantity.trim(),
                    }
                    : item
            );

            localStorage.setItem(
                "localplate_custom_items",
                JSON.stringify(updated)
            );

            return updated;
        });

        setEditingId(null);
    };

    const startEditPrice = (item: ShoppingItem) => {
        const currentPrice = getEffectiveCost(item);
        setEditingPriceId(item.id);
        setEditingPrice(
            currentPrice !== null ? String(currentPrice) : ""
        );
    };

    const savePrice = (id: string) => {
        const value = editingPrice.replace(/,/g, "").trim();
        if (!value) {
            const updated = { ...manualPrices };
            delete updated[id];
            setManualPrices(updated);
            persistManualPrices(updated);
            setEditingPriceId(null);
            return;
        }

        const numericPrice = Number(value);
        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            showToast("Please enter a valid price.", "error");
            return;
        }

        const updated = { ...manualPrices, [id]: numericPrice };
        setManualPrices(updated);
        persistManualPrices(updated);
        setEditingPriceId(null);
        setEditingPrice("");
    };

    const resetPrice = (id: string) => {
        const updated = { ...manualPrices };
        delete updated[id];
        setManualPrices(updated);
        persistManualPrices(updated);
        setEditingPriceId(null);
        setEditingPrice("");
    };

    const buildShareText = (remainingOnly = false) => {
        const source = remainingOnly
            ? ingredientItems.filter(
                (item) => !checkedItems.includes(item.id)
            )
            : ingredientItems;

        const lines = source.map((item) =>
            itemText(
                item,
                checkedItems.includes(item.id),
                !remainingOnly,
                getEffectiveCost(item)
            )
        );

        return [
            "🛒 LocalPlate AI - Shopping List",
            "",
            lines.length ? lines.join("\n") : "All items purchased ✓",
            "",
            `Total Items: ${totalItems}`,
            `Purchased: ${purchasedItems}`,
            `Remaining: ${remainingItems}`,
            `Estimated Total: Rs. ${totalCost.toLocaleString()}`,
            `Estimated Remaining: Rs. ${remainingCost.toLocaleString()}`,
            "",
            "Note: Prices are approximate estimates.",
        ].join("\n");
    };

    const copyShoppingList = async () => {
        if (!ingredientItems.length) return;

        try {
            await navigator.clipboard.writeText(
                buildShareText(false)
            );

            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Shopping list copy failed:", error);
            showToast("Could not copy the list.", "error");
        }
    };

    const sendToWhatsApp = () => {
        if (!ingredientItems.length) return;

        const text = buildShareText(true);

        window.open(
            `https://wa.me/?text=${encodeURIComponent(text)}`,
            "_blank",
            "noopener,noreferrer"
        );

        setWhatsappOpened(true);
        window.setTimeout(() => setWhatsappOpened(false), 2000);
    };

    const downloadShoppingList = () => {
        if (!ingredientItems.length) return;

        const text = buildShareText(false);
        const blob = new Blob([text], {
            type: "text/plain;charset=utf-8",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "localplate-shopping-list.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        setDownloaded(true);
        window.setTimeout(() => setDownloaded(false), 2000);
    };

    const restoreSnapshot = (snapshot: ListSnapshot) => {
        setShoppingList(snapshot.shoppingList);
        setCheckedItems(snapshot.checkedItems);
        setFavoriteItems(snapshot.favoriteItems);
        setCustomItems(snapshot.customItems);
        setManualPrices(snapshot.manualPrices);

        localStorage.setItem(
            "localplate_shopping_list",
            snapshot.shoppingList
        );
        localStorage.setItem(
            "localplate_checked_items",
            JSON.stringify(snapshot.checkedItems)
        );
        localStorage.setItem(
            "localplate_favorite_items",
            JSON.stringify(snapshot.favoriteItems)
        );
        localStorage.setItem(
            "localplate_custom_items",
            JSON.stringify(snapshot.customItems)
        );
        localStorage.setItem(
            "localplate_manual_prices",
            JSON.stringify(snapshot.manualPrices)
        );

        showToast("Shopping list restored");
    };

    const clearShoppingList = async () => {
        const snapshot: ListSnapshot = {
            shoppingList,
            checkedItems,
            favoriteItems,
            customItems,
            manualPrices,
        };

        setClearing(true);
        setClearError("");

        setShoppingList("");
        setCheckedItems([]);
        setFavoriteItems([]);
        setCustomItems([]);
        setManualPrices({});
        setSearchTerm("");
        setFilterMode("all");
        setCategoryFilter("All");

        [
            "localplate_shopping_list",
            "localplate_checked_items",
            "localplate_favorite_items",
            "localplate_custom_items",
            "localplate_manual_prices",
        ].forEach((key) => localStorage.removeItem(key));

        localStorage.setItem("localplate_synced_list", "");

        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { error } = await supabase
                    .from("shopping_lists")
                    .upsert(
                        {
                            user_id: user.id,
                            shopping_list: "",
                            checked_items: [],
                            favorite_items: [],
                            custom_items: [],
                            manual_prices: {},
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: "user_id" }
                    );

                if (error) throw error;
            }
        } catch (error) {
            console.error("Failed to clear shopping list:", error);
            setClearError(
                "List yahan se clear ho gayi, lekin database se clear nahi ho saki. Refresh par wapas aa sakti hai. " +
                    (error instanceof Error
                        ? error.message
                        : JSON.stringify(error))
            );
            setClearing(false);
            return;
        }

        setClearing(false);
        setShowClearConfirm(false);

        showToast(
            "Shopping list cleared",
            "success",
            { label: "Undo", run: () => restoreSnapshot(snapshot) },
            7000
        );
    };

    const toggleCategory = (category: Category) => {
        setCollapsedCategories((current) =>
            current.includes(category)
                ? current.filter((item) => item !== category)
                : [...current, category]
        );
    };

    const categoryCounts = ingredientItems.reduce(
        (counts, item) => {
            counts[getCategory(item.name)] += 1;
            return counts;
        },
        {
            Vegetables: 0,
            Meat: 0,
            Dairy: 0,
            Pantry: 0,
            Spices: 0,
            Other: 0,
        } as Record<Category, number>
    );

    const hasActiveFilters =
        searchTerm.trim() !== "" ||
        filterMode !== "all" ||
        categoryFilter !== "All" ||
        favoritesOnly;

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push("/planner");
        }
    };

    const favoriteCount = ingredientItems.filter((item) =>
        favoriteItems.includes(item.id)
    ).length;

    const clearFilters = () => {
        setFavoritesOnly(false);
        setSearchTerm("");
        setFilterMode("all");
        setCategoryFilter("All");
    };

    if (!loaded) {
        return (
            <main className="min-h-screen bg-[#fffaf5]" />
        );
    }

    return (
        <main className="min-h-screen bg-[#fffaf5] px-4 pb-28 pt-8 text-zinc-900 md:px-8 md:pb-10 md:pt-10">
            <div className="mx-auto max-w-7xl">
                <header className="sticky top-0 z-30 -mx-4 -mt-8 mb-5 border-b border-orange-100 bg-[#fffaf5]/90 px-4 py-3 backdrop-blur md:-mx-8 md:-mt-10 md:px-8">
                    <div className="mx-auto flex max-w-7xl items-center gap-2.5 sm:gap-3">
                        <button
                            type="button"
                            onClick={handleBack}
                            aria-label="Go back"
                            className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-orange-200 bg-white pl-3 pr-4 text-sm font-bold text-orange-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 active:scale-95"
                        >
                            <span
                                aria-hidden="true"
                                className="text-lg leading-none transition-transform duration-200 group-hover:-translate-x-0.5"
                            >
                                ←
                            </span>
                            <span>Back</span>
                        </button>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-zinc-900">
                                Shopping List
                            </p>
                            <p className="truncate text-xs text-zinc-500">
                                {totalItems} items · {progress}% done
                            </p>
                        </div>

                        <a
                            href="/weekly-plan"
                            aria-label="Weekly Plan"
                            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-indigo-200 bg-white px-3.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 sm:px-4"
                        >
                            <span aria-hidden="true">📅</span>
                            <span className="hidden sm:inline">Weekly Plan</span>
                        </a>

                        <a
                            href="/saved-plans"
                            aria-label="Saved Plans"
                            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 active:scale-95 sm:px-4"
                        >
                            <span aria-hidden="true">💾</span>
                            <span className="hidden sm:inline">Saved Plans</span>
                        </a>
                    </div>
                </header>

                <section className="rounded-[2rem] bg-zinc-950 px-6 py-8 text-white shadow-xl md:px-10 md:py-10">
                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <span className="inline-flex rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-300 ring-1 ring-orange-400/20">
                                🛒 Smart Shopping Workspace
                            </span>

                            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
                                Shop
                                <span className="text-orange-500">
                                    {" "}smarter.
                                </span>
                            </h1>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
                                {totalItems} items
                            </span>
                            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
                                {categoriesUsed} categories
                            </span>
                            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
                                {syncing ? "☁️ Syncing..." : "☁️ Saved"}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {[
                        ["Total", totalItems.toString(), "🛒"],
                        ["Purchased", purchasedItems.toString(), "✅"],
                        ["Remaining", remainingItems.toString(), "📌"],
                        [
                            "Remaining Cost",
                            `Rs. ${remainingCost.toLocaleString()}`,
                            "💰",
                        ],
                    ].map(([label, value, icon]) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-zinc-500">
                                    {label}
                                </p>
                                <span>{icon}</span>
                            </div>
                            <p className="mt-2 truncate text-lg font-bold sm:text-xl">
                                {value}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="mt-5 rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm md:p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-bold">
                                Shopping progress
                            </p>
                            <p className="mt-1 text-sm text-zinc-500">
                                {purchasedItems} of {totalItems} items
                                purchased
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-2xl font-bold text-orange-600">
                                {progress}%
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100">
                        <div
                            className="h-full rounded-full bg-orange-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {progress === 100 && totalItems > 0 && (
                        <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                            🎉 Shopping complete! You have checked
                            everything off.
                        </div>
                    )}
                </section>

                {totalItems > 0 && (
                    <section className="mt-5 rounded-3xl border border-zinc-100 bg-white p-3 shadow-sm sm:p-4">
                        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3">
                            <button
                                type="button"
                                onClick={toggleAllItems}
                                disabled={!totalItems}
                                className="col-span-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1 sm:w-auto sm:rounded-full sm:px-5"
                            >
                                <span aria-hidden="true">☑</span>
                                <span>
                                    {purchasedItems === totalItems && totalItems > 0
                                        ? "Unselect All"
                                        : "Select All"}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={copyShoppingList}
                                disabled={!totalItems}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:rounded-full sm:px-5"
                            >
                                <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
                                <span>{copied ? "Copied" : "Copy List"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={downloadShoppingList}
                                disabled={!totalItems}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:rounded-full sm:px-5"
                            >
                                <span aria-hidden="true">{downloaded ? "✓" : "↓"}</span>
                                <span>{downloaded ? "Downloaded" : "Download"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={sendToWhatsApp}
                                disabled={!totalItems}
                                className="col-span-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1 sm:w-auto sm:rounded-full sm:px-5"
                            >
                                <span aria-hidden="true">{whatsappOpened ? "✓" : "↗"}</span>
                                <span>{whatsappOpened ? "WhatsApp Opened" : "Share on WhatsApp"}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setClearError("");
                                    setShowClearConfirm(true);
                                }}
                                className="col-span-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-100 active:scale-[0.98] sm:col-span-1 sm:w-auto sm:rounded-full sm:px-5"
                            >
                                <span aria-hidden="true">🗑️</span>
                                <span>Clear List</span>
                            </button>
                        </div>
                    </section>
                )}

                <section className="mt-5 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                        Add item
                    </p>

                    <div className="mt-3 grid gap-2.5 sm:grid-cols-[2fr_1fr_1fr_auto]">
                        <input
                            value={newItemName}
                            onChange={(event) =>
                                setNewItemName(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") addCustomItem();
                            }}
                            placeholder="Item name (e.g. Milk)"
                            className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />

                        <input
                            value={newItemQuantity}
                            onChange={(event) =>
                                setNewItemQuantity(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") addCustomItem();
                            }}
                            placeholder="Quantity (1 kg)"
                            className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />

                        <input
                            value={newItemCost}
                            inputMode="decimal"
                            onChange={(event) =>
                                setNewItemCost(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") addCustomItem();
                            }}
                            placeholder="Price (Rs.)"
                            className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />

                        <button
                            type="button"
                            onClick={addCustomItem}
                            disabled={!newItemName.trim()}
                            className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            + Add
                        </button>
                    </div>
                </section>

                {totalItems > 0 && (
                    <section className="mt-5 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative w-full lg:max-w-sm">
                                <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm"
                                >
                                    🔎
                                </span>

                                <input
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(event.target.value)
                                    }
                                    placeholder="Search ingredients..."
                                    className="w-full rounded-xl border border-zinc-200 py-2.5 pl-10 pr-9 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                />

                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm("")}
                                        aria-label="Clear search"
                                        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div
                                role="group"
                                aria-label="Filter by status"
                                className="inline-flex w-full rounded-xl bg-zinc-100 p-1 lg:w-auto"
                            >
                                {(
                                    [
                                        ["all", "All", totalItems],
                                        ["remaining", "Remaining", remainingItems],
                                        ["purchased", "Purchased", purchasedItems],
                                    ] as [FilterMode, string, number][]
                                ).map(([mode, label, count]) => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setFilterMode(mode)}
                                        aria-pressed={filterMode === mode}
                                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition lg:flex-none ${filterMode === mode
                                                ? "bg-orange-600 text-white shadow-sm"
                                                : "text-zinc-600 hover:bg-white"
                                            }`}
                                    >
                                        {label}
                                        <span
                                            className={`rounded-full px-1.5 py-0.5 text-[10px] ${filterMode === mode
                                                    ? "bg-white/25 text-white"
                                                    : "bg-white text-zinc-500"
                                                }`}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="-mx-1 mt-3 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                            <button
                                type="button"
                                onClick={() => setFavoritesOnly((value) => !value)}
                                aria-pressed={favoritesOnly}
                                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${favoritesOnly
                                        ? "border-yellow-400 bg-yellow-400 text-zinc-900"
                                        : "border-zinc-200 bg-white text-zinc-600 hover:border-yellow-300 hover:bg-yellow-50"
                                    }`}
                            >
                                <span aria-hidden="true">★</span>
                                Favorites
                                <span className="opacity-70">{favoriteCount}</span>
                            </button>

                            {(
                                [
                                    "All",
                                    ...CATEGORY_ORDER.filter(
                                        (category) =>
                                            categoryCounts[category] > 0
                                    ),
                                ] as (Category | "All")[]
                            ).map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setCategoryFilter(category)}
                                    aria-pressed={categoryFilter === category}
                                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${categoryFilter === category
                                            ? "border-orange-600 bg-orange-600 text-white"
                                            : "border-zinc-200 bg-white text-zinc-600 hover:border-orange-300 hover:bg-orange-50"
                                        }`}
                                >
                                    <span aria-hidden="true">
                                        {category === "All"
                                            ? "🧺"
                                            : CATEGORY_ICONS[category]}
                                    </span>
                                    {category}
                                    <span className="opacity-70">
                                        {category === "All"
                                            ? totalItems
                                            : categoryCounts[category]}
                                    </span>
                                </button>
                            ))}

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="ml-1 shrink-0 text-xs font-bold text-orange-600 hover:text-orange-700"
                                >
                                    Reset filters
                                </button>
                            )}
                        </div>
                    </section>
                )}

                {ingredientItems.length > 0 ? (
                    <section className="mt-5 overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-lg">
                        <div className="flex flex-col gap-2 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
                                    Smart ingredients
                                </p>
                                <h2 className="mt-1 text-2xl font-bold">
                                    What you need to buy
                                </h2>
                            </div>

                            <div className="text-sm text-zinc-500 sm:text-right">
                                <p>
                                    {visibleItems.length} of {totalItems} shown
                                </p>
                                <p className="mt-1 font-semibold text-green-600">
                                    Rs. {remainingCost.toLocaleString()}{" "}
                                    <span className="font-medium text-zinc-400">
                                        remaining of Rs.{" "}
                                        {totalCost.toLocaleString()}
                                    </span>
                                </p>
                                {groupedVisibleItems.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCollapsedCategories(
                                                collapsedCategories.length > 0
                                                    ? []
                                                    : groupedVisibleItems.map(
                                                        (group) => group.category
                                                    )
                                            )
                                        }
                                        className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700"
                                    >
                                        {collapsedCategories.length > 0
                                            ? "Expand all"
                                            : "Collapse all"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {visibleItems.length > 0 ? (
                            <div>
                                {groupedVisibleItems.map(
                                    ({ category, items }) => (
                                        <div key={category}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleCategory(category)
                                                }
                                                aria-expanded={
                                                    !collapsedCategories.includes(
                                                        category
                                                    )
                                                }
                                                className="flex w-full items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-5 py-3 text-left transition hover:bg-orange-50/60 md:px-6"
                                            >
                                                <span className="text-lg">
                                                    {CATEGORY_ICONS[category]}
                                                </span>
                                                <h3 className="font-bold">
                                                    {category}
                                                </h3>
                                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-zinc-500">
                                                    {items.length}
                                                </span>
                                                <span className="ml-auto text-xs font-semibold text-zinc-500">
                                                    Rs.{" "}
                                                    {items
                                                        .reduce(
                                                            (sum, entry) =>
                                                                sum +
                                                                (getEffectiveCost(
                                                                    entry
                                                                ) ?? 0),
                                                            0
                                                        )
                                                        .toLocaleString()}
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className={`text-zinc-400 transition-transform duration-200 ${collapsedCategories.includes(category)
                                                            ? "-rotate-90"
                                                            : ""
                                                        }`}
                                                >
                                                    ▾
                                                </span>
                                            </button>

                                            {!collapsedCategories.includes(category) &&
                                                items.map((item) => {
                                                const isChecked =
                                                    checkedItems.includes(
                                                        item.id
                                                    );
                                                const isFavorite =
                                                    favoriteItems.includes(
                                                        item.id
                                                    );
                                                const category =
                                                    getCategory(
                                                        item.name
                                                    );
                                                const isCustom =
                                                    customItems.some(
                                                        (custom) =>
                                                            custom.id ===
                                                            item.id
                                                    );

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`flex flex-wrap items-start gap-x-3 gap-y-3 border-b border-zinc-100 px-4 py-4 transition last:border-b-0 md:px-6 ${isChecked
                                                                ? "bg-zinc-50"
                                                                : "hover:bg-orange-50/40"
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                isChecked
                                                            }
                                                            onChange={() =>
                                                                toggleItem(
                                                                    item.id
                                                                )
                                                            }
                                                            className="mt-0.5 h-6 w-6 shrink-0 accent-orange-600 sm:mt-1 sm:h-5 sm:w-5"
                                                            aria-label={`Mark ${item.name} as purchased`}
                                                        />

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p
                                                                    className={`font-semibold ${isChecked
                                                                            ? "text-zinc-400 line-through"
                                                                            : "text-zinc-900"
                                                                        }`}
                                                                >
                                                                    {
                                                                        item.name
                                                                    }
                                                                </p>

                                                                <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-500">
                                                                    {
                                                                        category
                                                                    }
                                                                </span>

                                                                {isCustom && (
                                                                    <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-700">
                                                                        Custom
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {editingId ===
                                                                item.id ? (
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    <input
                                                                        autoFocus
                                                                        value={
                                                                            editingQuantity
                                                                        }
                                                                        onChange={(
                                                                            event
                                                                        ) =>
                                                                            setEditingQuantity(
                                                                                event
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        onKeyDown={(
                                                                            event
                                                                        ) => {
                                                                            if (
                                                                                event.key ===
                                                                                "Enter"
                                                                            )
                                                                                saveQuantity(
                                                                                    item.id
                                                                                );
                                                                            if (
                                                                                event.key ===
                                                                                "Escape"
                                                                            )
                                                                                setEditingId(
                                                                                    null
                                                                                );
                                                                        }}
                                                                        className="rounded-lg border border-orange-300 px-3 py-2 text-sm outline-none"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            saveQuantity(
                                                                                item.id
                                                                            )
                                                                        }
                                                                        className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            setEditingId(
                                                                                null
                                                                            )
                                                                        }
                                                                        className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-600"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                    <p className="text-sm text-zinc-500">
                                                                        {item.quantity
                                                                            ? `Quantity: ${item.quantity}`
                                                                            : "Quantity not specified"}
                                                                    </p>

                                                                    {isCustom && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                startEditQuantity(
                                                                                    item
                                                                                )
                                                                            }
                                                                            className="text-xs font-bold text-orange-600 hover:text-orange-700"
                                                                        >
                                                                            Edit quantity
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex w-full items-start justify-between gap-2 pl-9 sm:w-auto sm:shrink-0 sm:justify-start sm:pl-0">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleFavorite(
                                                                        item.id
                                                                    )
                                                                }
                                                                className={`rounded-lg px-2 py-1 text-lg transition ${isFavorite
                                                                        ? "bg-yellow-50 text-yellow-500"
                                                                        : "bg-zinc-50 text-zinc-300 hover:text-yellow-500"
                                                                    }`}
                                                                aria-label={
                                                                    isFavorite
                                                                        ? `Remove ${item.name} from favorites`
                                                                        : `Favorite ${item.name}`
                                                                }
                                                            >
                                                                {isFavorite
                                                                    ? "★"
                                                                    : "☆"}
                                                            </button>

                                                            <div className="min-w-0 flex-1 text-right sm:min-w-[150px] sm:flex-none">
                                                                {editingPriceId === item.id ? (
                                                                    <div className="flex flex-col items-end gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-semibold text-zinc-400">Rs.</span>
                                                                            <input
                                                                                autoFocus
                                                                                inputMode="decimal"
                                                                                value={editingPrice}
                                                                                onChange={(event) =>
                                                                                    setEditingPrice(event.target.value)
                                                                                }
                                                                                onKeyDown={(event) => {
                                                                                    if (event.key === "Enter") savePrice(item.id);
                                                                                    if (event.key === "Escape") setEditingPriceId(null);
                                                                                }}
                                                                                placeholder="0"
                                                                                className="w-24 rounded-lg border border-orange-300 px-2.5 py-2 text-right text-sm font-bold outline-none focus:ring-2 focus:ring-orange-200"
                                                                            />
                                                                        </div>
                                                                        <div className="flex gap-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => savePrice(item.id)}
                                                                                className="rounded-lg bg-orange-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-orange-700"
                                                                            >
                                                                                Save
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => resetPrice(item.id)}
                                                                                className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-[11px] font-bold text-zinc-600 hover:bg-zinc-200"
                                                                            >
                                                                                Reset
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        {getEffectiveCost(item) !== null ? (
                                                                            <p
                                                                                className={`pt-1 font-bold ${isChecked
                                                                                        ? "text-zinc-400"
                                                                                        : "text-green-600"
                                                                                    }`}
                                                                            >
                                                                                Rs. {getEffectiveCost(item)?.toLocaleString()}
                                                                            </p>
                                                                        ) : (
                                                                            <p className="pt-1 text-xs text-zinc-400">
                                                                                No price
                                                                            </p>
                                                                        )}

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => startEditPrice(item)}
                                                                            className="mt-1 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[11px] font-bold text-orange-700 hover:bg-orange-100"
                                                                        >
                                                                            ✏️ {manualPrices[item.id] !== undefined ? "My Price" : "Add Price"}
                                                                        </button>
                                                                        {manualPrices[item.id] !== undefined && (
                                                                            <p className="mt-1 text-[10px] font-medium text-orange-600">
                                                                                Your price
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>

                                                            {isCustom && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeCustomItem(
                                                                            item.id
                                                                        )
                                                                    }
                                                                    className="rounded-lg bg-red-50 px-2 py-1 text-sm text-red-600 hover:bg-red-100"
                                                                    aria-label={`Delete ${item.name}`}
                                                                >
                                                                    🗑️
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="px-6 py-14 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl">
                                    🔎
                                </div>
                                <h3 className="mt-4 text-xl font-bold">
                                    No matching ingredients
                                </h3>
                                <p className="mt-2 text-sm text-zinc-500">
                                    Search ya filters change karke
                                    dobara try karein.
                                </p>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-5 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-bold text-white"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="mt-5 rounded-3xl border border-zinc-100 bg-white p-10 text-center shadow-lg">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                            🛒
                        </div>
                        <h2 className="mt-5 text-2xl font-bold">
                            No shopping list yet
                        </h2>
                        <p className="mx-auto mt-2 max-w-md text-zinc-500">
                            Pehle meal plan generate karein. LocalPlate
                            AI ingredients ko yahan automatically
                            organize karega.
                        </p>

                        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                            <a
                                href="/planner"
                                className="rounded-full bg-orange-600 px-6 py-3 font-bold text-white shadow-md hover:bg-orange-700"
                            >
                                Create Meal Plan →
                            </a>
                            <a
                                href="/weekly-plan"
                                className="rounded-full border border-indigo-200 bg-white px-6 py-3 font-bold text-indigo-600 hover:bg-indigo-50"
                            >
                                📅 Create Weekly Plan
                            </a>
                        </div>
                    </section>
                )}

                {ingredientItems.length > 0 && (
                    <p className="mt-5 text-center text-xs text-zinc-400">
                        Prices are approximate and may vary by city, shop and
                        season. Tap &quot;Add Price&quot; on any item to use
                        your own price.
                    </p>
                )}

            </div>

            {/* Mobile quick bar */}
            {totalItems > 0 && (
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-orange-100 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur md:hidden">
                    <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-bold text-zinc-800">
                                    {purchasedItems}/{totalItems} done
                                </span>
                                <span className="truncate font-semibold text-green-600">
                                    Rs. {remainingCost.toLocaleString()} left
                                </span>
                            </div>

                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                                <div
                                    className="h-full rounded-full bg-orange-600 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={sendToWhatsApp}
                            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-green-600 px-4 text-sm font-bold text-white shadow-sm transition active:scale-95"
                        >
                            <span aria-hidden="true">↗</span>
                            Share
                        </button>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 md:bottom-6"
                >
                    <div
                        key={toast.id}
                        className={`sl-sheet pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${toast.tone === "error"
                                ? "bg-red-600"
                                : "bg-zinc-900"
                            }`}
                    >
                        <span aria-hidden="true">
                            {toast.tone === "error" ? "⚠️" : "✓"}
                        </span>
                        <span className="min-w-0 flex-1">{toast.message}</span>

                        {toast.action && (
                            <button
                                type="button"
                                onClick={() => {
                                    toast.action?.run();
                                }}
                                className="shrink-0 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold transition hover:bg-white/25"
                            >
                                {toast.action.label}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Clear list dialog (bottom sheet on mobile) */}
            {showClearConfirm && (
                <div
                    className="sl-fade fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={() => {
                        if (!clearing) setShowClearConfirm(false);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="clear-list-title"
                        aria-describedby="clear-list-desc"
                        className="sl-sheet w-full max-w-md rounded-t-[2rem] bg-white px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-3xl sm:pb-6 sm:pt-6"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-200 sm:hidden" />

                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-2xl">
                                🗑️
                            </div>

                            <div className="min-w-0">
                                <h3
                                    id="clear-list-title"
                                    className="text-xl font-bold text-zinc-900"
                                >
                                    Clear shopping list?
                                </h3>
                                <p
                                    id="clear-list-desc"
                                    className="mt-1 text-sm leading-6 text-zinc-500"
                                >
                                    Ye list aapke saare devices se hat jayegi.
                                    Clear karne ke foran baad aap Undo kar
                                    sakte ho.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-3 gap-2">
                            {[
                                ["Items", String(totalItems)],
                                ["Checked", String(purchasedItems)],
                                ["Value", `Rs. ${totalCost.toLocaleString()}`],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-2xl bg-zinc-50 px-3 py-3 text-center"
                                >
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                                        {label}
                                    </p>
                                    <p className="mt-1 truncate text-sm font-bold text-zinc-900">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {clearError && (
                            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-700">
                                {clearError}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setShowClearConfirm(false)}
                                disabled={clearing}
                                className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {clearError ? "Close" : "Cancel"}
                            </button>

                            {!clearError && (
                                <button
                                    type="button"
                                    onClick={clearShoppingList}
                                    disabled={clearing}
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-red-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {clearing ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                            Clearing...
                                        </>
                                    ) : (
                                        "Yes, clear list"
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes sl-fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes sl-sheet-up {
                    from { opacity: 0; transform: translateY(28px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes sl-pop {
                    from { opacity: 0; transform: translateY(10px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .sl-fade { animation: sl-fade-in 0.2s ease-out both; }
                .sl-sheet { animation: sl-sheet-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both; }
                @media (min-width: 640px) { .sl-sheet { animation-name: sl-pop; } }
                @media (prefers-reduced-motion: reduce) {
                    .sl-fade, .sl-sheet { animation: none !important; }
                }
            `}</style>
        </main>
    );
}