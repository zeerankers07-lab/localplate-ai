"use client";

import { useEffect, useMemo, useState } from "react";
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

                if (data) {
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

            return (
                matchesSearch &&
                matchesFilter &&
                matchesCategory
            );
        });
    }, [
        ingredientItems,
        checkedItems,
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
            alert("Please valid price enter karein.");
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
            alert("Shopping list copy nahi ho saki.");
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

    const clearFilters = () => {
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
        <main className="min-h-screen bg-[#fffaf5] px-4 py-8 text-zinc-900 md:px-8 md:py-10">
            <div className="mx-auto max-w-7xl">
                <nav className="mb-6 w-full sm:mb-8">
                    <div className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:items-center sm:justify-between sm:gap-3">
                        <a
                            href="/planner"
                            className="group col-span-2 inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-bold text-orange-700 shadow-sm shadow-orange-100/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md active:translate-y-0 sm:col-span-1 sm:w-auto sm:justify-start"
                        >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-50 text-lg transition-transform duration-200 group-hover:-translate-x-0.5">
                                ←
                            </span>
                            <span>Back to Planner</span>
                        </a>

                        <div className="col-span-2 grid grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:gap-2.5">
                            <a
                                href="/weekly-plan"
                                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-white px-3 py-3 text-sm font-bold text-indigo-700 shadow-sm shadow-indigo-100/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md active:translate-y-0 sm:px-4"
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm transition-transform duration-200 group-hover:scale-105">
                                    📅
                                </span>
                                <span className="truncate">Weekly Plan</span>
                            </a>

                            <a
                                href="/saved-plans"
                                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm font-bold text-zinc-800 shadow-sm shadow-zinc-100/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 hover:shadow-md active:translate-y-0 sm:px-4"
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-sm transition-colors duration-200 group-hover:bg-orange-100">
                                    💾
                                </span>
                                <span className="truncate">Saved Plans</span>
                            </a>
                        </div>
                    </div>
                </nav>

                <section className="rounded-[2rem] bg-zinc-950 px-6 py-10 text-white shadow-xl md:px-10 md:py-14">
                    <div className="max-w-4xl">
                        <span className="inline-flex rounded-full bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-300 ring-1 ring-orange-400/20">
                            🛒 Smart Shopping Workspace
                        </span>

                        <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
                            Shop
                            <span className="text-orange-500">
                                {" "}smarter.
                            </span>
                        </h1>

                        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 md:text-lg">
                            Search, organize, check off, edit and share
                            your LocalPlate AI ingredients from one place.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
                                {totalItems} items
                            </span>
                            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
                                {categoriesUsed} categories
                            </span>
                            <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
                                {progress}% complete
                            </span>
                        </div>
                    </div>
                </section>

                <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                        ["Total", totalItems.toString(), "🛒"],
                        ["Purchased", purchasedItems.toString(), "✅"],
                        ["Remaining", remainingItems.toString(), "📌"],
                        [
                            "Remaining Cost",
                            `Rs. ${remainingCost.toLocaleString()}`,
                            "💰",
                        ],
                        ["Progress", `${progress}%`, "📊"],
                    ].map(([label, value, icon]) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-zinc-500">
                                    {label}
                                </p>
                                <span>{icon}</span>
                            </div>
                            <p className="mt-2 text-xl font-bold">
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
                        </div>
                    </section>
                )}

                {ingredientItems.length > 0 ? (
                    <section className="mt-5 overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-lg">
                        <div className="flex flex-col gap-2 border-b border-zinc-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
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
                                    {visibleItems.length} shown
                                </p>
                                <p className="mt-1 font-semibold text-green-600">
                                    Rs.{" "}
                                    {remainingCost.toLocaleString()}{" "}
                                    remaining
                                </p>
                            </div>
                        </div>

                        {visibleItems.length > 0 ? (
                            <div>
                                {groupedVisibleItems.map(
                                    ({ category, items }) => (
                                        <div key={category}>
                                            <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-5 py-3 md:px-6">
                                                <span className="text-lg">
                                                    {
                                                        CATEGORY_ICONS[
                                                        category
                                                        ]
                                                    }
                                                </span>
                                                <h3 className="font-bold">
                                                    {category}
                                                </h3>
                                                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-zinc-500">
                                                    {items.length}
                                                </span>
                                            </div>

                                            {items.map((item) => {
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
                                                        className={`flex gap-3 border-b border-zinc-100 px-4 py-4 transition last:border-b-0 md:px-6 ${isChecked
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
                                                            className="mt-1 h-5 w-5 shrink-0 accent-orange-600"
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

                                                        <div className="flex shrink-0 items-start gap-2">
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

                                                            <div className="min-w-[150px] text-right">
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
                    <section className="mt-5 grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                            <p className="text-sm text-zinc-500">
                                Estimated total
                            </p>
                            <p className="mt-1 text-xl font-bold">
                                Rs. {totalCost.toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">
                                AI estimate + your manual prices
                            </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                            <p className="text-sm text-zinc-500">
                                Purchased value
                            </p>
                            <p className="mt-1 text-xl font-bold text-orange-600">
                                Rs. {purchasedCost.toLocaleString()}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
                            <p className="text-sm text-zinc-500">
                                Still to buy
                            </p>
                            <p className="mt-1 text-xl font-bold text-green-600">
                                Rs. {remainingCost.toLocaleString()}
                            </p>
                        </div>
                    </section>
                )}

                {ingredientItems.length > 0 && (
                    <section className="mt-8 rounded-3xl bg-zinc-950 px-6 py-10 text-center text-white shadow-xl md:px-10">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
                            LocalPlate AI
                        </p>
                        <h2 className="mt-3 text-3xl font-bold">
                            Your shopping is organized.
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                            Share the remaining list with family, finish
                            your shopping, then create another personalized
                            meal plan whenever you need one.
                        </p>

                        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={sendToWhatsApp}
                                className="rounded-full bg-green-600 px-6 py-3 font-bold text-white hover:bg-green-700"
                            >
                                📱 Share Remaining List
                            </button>
                            <a
                                href="/planner"
                                className="rounded-full bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700"
                            >
                                Create New Meal →
                            </a>
                            <a
                                href="/saved-plans"
                                className="rounded-full border border-zinc-700 bg-zinc-900 px-6 py-3 font-bold text-white hover:bg-zinc-800"
                            >
                                View Saved Plans
                            </a>
                        </div>

                        <p className="mt-5 text-xs text-zinc-500">
                            Prices shown in the list are approximate and
                            may vary by city, shop and season.
                        </p>
                    </section>
                )}
            </div>
        </main>
    );
}
