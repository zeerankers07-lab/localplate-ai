"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/LanguageProvider";

type WeeklySavedPlan = {
  id: number;
  mealPlan: string;
  foodType: string;
  budget: string;
  mealType: string;
  diet: string;
  time: string;
  goal?: string;
  servings?: string;
  city?: string;
  spiceLevel?: string;
  allergies?: string;
  dislikes?: string;
  pantry?: string;
  extraPreferences?: string;
  smartSubstitutions?: boolean;
  useLeftovers?: boolean;
  leftovers?: string;
  createdAt: string;
  favorite: boolean;
  planType?: "weekly" | "single";
};

type DayMeal = {
  name: string;
  cost: number | null;
  prepTime: number | null;
  quickSteps: string[];
};

type DayPlan = {
  day: string;
  breakfast: DayMeal;
  lunch: DayMeal;
  dinner: DayMeal;
};

type SmartSubstitution = {
  original: string;
  substitute: string;
  reason: string;
};

type LeftoverIdea = {
  source: string;
  result: string;
  note: string;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const EMPTY_MEAL: DayMeal = {
  name: "",
  cost: null,
  prepTime: null,
  quickSteps: [],
};

const EMPTY_DAY = (day: string): DayPlan => ({
  day,
  breakfast: { ...EMPTY_MEAL },
  lunch: { ...EMPTY_MEAL },
  dinner: { ...EMPTY_MEAL },
});

export default function WeeklyPlanPage() {
  const { t, label, lang } = useI18n();
  const router = useRouter();

  // =========================
  // Preferences
  // =========================

  const [budget, setBudget] = useState("7000");
  const [diet, setDiet] = useState("Normal");
  const [goal, setGoal] = useState("Healthy Eating");
  const [foodType, setFoodType] = useState("Pakistani");
  const [servings, setServings] = useState("2");
  const [city, setCity] = useState("");
  const [pantry, setPantry] = useState("");
  const [preferences, setPreferences] = useState("");

  // New smart kitchen preferences
  const [smartSubstitutions, setSmartSubstitutions] = useState(true);
  const [useLeftovers, setUseLeftovers] = useState(true);
  const [leftovers, setLeftovers] = useState("");
  const [plannedLeftovers, setPlannedLeftovers] = useState<
    Record<string, boolean>
  >({});
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        "localplate_planned_leftovers"
      );

      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const valid: Record<string, boolean> = {};
          Object.entries(parsed).forEach(([key, value]) => {
            if (typeof value === "boolean") valid[key] = value;
          });
          setPlannedLeftovers(valid);
        }
      }
    } catch (error) {
      console.error("Failed to load leftover tracker:", error);
    }
  }, []);

  // =========================
  // AI Result
  // =========================

  const [weeklyPlan, setWeeklyPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [whatsappShared, setWhatsappShared] = useState(false);
  const [savedPlanCount, setSavedPlanCount] = useState(0);

  // =========================
  // UI State
  // =========================

  const [expandedDays, setExpandedDays] = useState<
    Record<string, boolean>
  >(() =>
    DAYS.reduce(
      (result, day) => {
        result[day] = true;
        return result;
      },
      {} as Record<string, boolean>
    )
  );

  // =========================
  // Saved Plans Integration
  // =========================

  useEffect(() => {
    try {
      const stored = localStorage.getItem("localplate_saved_plans");
      const plans = stored ? JSON.parse(stored) : [];
      setSavedPlanCount(Array.isArray(plans) ? plans.length : 0);
    } catch (error) {
      console.error("Failed to load saved plan count:", error);
      setSavedPlanCount(0);
    }
  }, []);

  // =========================
  // Load Existing / Reuse Data
  // =========================

  useEffect(() => {
    const savedPlan = localStorage.getItem("localplate_weekly_plan");

    if (savedPlan) {
      setWeeklyPlan(savedPlan);
    }

    const reusePreferences = localStorage.getItem(
      "localplate_reuse_weekly_preferences"
    );

    if (!reusePreferences) return;

    try {
      const preferencesData = JSON.parse(reusePreferences);

      if (preferencesData.budget) {
        setBudget(String(preferencesData.budget));
      }

      if (preferencesData.foodType) {
        setFoodType(preferencesData.foodType);
      }

      if (preferencesData.diet) {
        setDiet(preferencesData.diet);
      }

      if (preferencesData.goal) {
        setGoal(preferencesData.goal);
      }

      if (preferencesData.servings) {
        setServings(String(preferencesData.servings));
      }

      if (preferencesData.city !== undefined) {
        setCity(preferencesData.city);
      }

      if (preferencesData.pantry !== undefined) {
        setPantry(preferencesData.pantry);
      }

      if (preferencesData.preferences !== undefined) {
        setPreferences(preferencesData.preferences);
      }

      if (preferencesData.smartSubstitutions !== undefined) {
        setSmartSubstitutions(
          Boolean(preferencesData.smartSubstitutions)
        );
      }

      if (preferencesData.useLeftovers !== undefined) {
        setUseLeftovers(Boolean(preferencesData.useLeftovers));
      }

      if (preferencesData.leftovers !== undefined) {
        setLeftovers(preferencesData.leftovers);
      }

      localStorage.removeItem(
        "localplate_reuse_weekly_preferences"
      );
    } catch (error) {
      console.error(
        "Failed to load weekly reuse preferences:",
        error
      );

      localStorage.removeItem(
        "localplate_reuse_weekly_preferences"
      );
    }
  }, []);

  // =========================
  // Prepare Shopping List
  // =========================

  const prepareShoppingList = (plan: string) => {
    if (!plan) return "";

    try {
      const shoppingSectionMatch = plan.match(
        /(?:^|\n)#{1,6}\s*🛒\s*Weekly\s+Shopping\s+List\s*[\r\n]+([\s\S]*?)(?=\n#{1,6}\s*💰\s*Weekly\s+Cost\s+Summary|\n#{1,6}\s+\S|$)/i
      );

      if (!shoppingSectionMatch) {
        console.warn(
          "Weekly shopping list section was not found in AI response."
        );

        return "";
      }

      const shoppingContent = shoppingSectionMatch[1].trim();

      if (!shoppingContent) return "";

      const lines = shoppingContent
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const ingredientLines = lines.filter((line) =>
        /^[-*•]\s+/.test(line)
      );

      if (ingredientLines.length === 0) {
        console.warn(
          "No ingredient lines were found in weekly shopping section."
        );

        return "";
      }

      return [
        "## 🛒 Ingredients",
        "",
        ...ingredientLines,
      ].join("\n");
    } catch (error) {
      console.error(
        "Failed to prepare weekly shopping list:",
        error
      );

      return "";
    }
  };

  // =========================
  // Parse Money
  // =========================

  const parseCost = (value: string): number | null => {
    if (!value) return null;

    const cleaned = value.replace(/,/g, "");

    const match = cleaned.match(
      /(?:Rs\.?|PKR)?\s*(\d+(?:\.\d+)?)/i
    );

    if (!match) return null;

    const number = Number(match[1]);

    return Number.isFinite(number) ? number : null;
  };

  // =========================
  // Parse Prep Time
  // =========================

  const parsePrepTime = (value: string): number | null => {
    if (!value) return null;

    const match = value.match(
      /(\d+)\s*(?:minutes?|mins?)/i
    );

    if (!match) return null;

    const minutes = Number(match[1]);

    return Number.isFinite(minutes) ? minutes : null;
  };

  // =========================
  // Parse Quick Steps
  // =========================

  const parseQuickSteps = (mealContent: string) => {
    if (!mealContent) return [];

    const quickStepsMatch = mealContent.match(
      /Quick\s+Steps\s*:\s*([\s\S]*?)(?=\n\s*(?:🔄|♻️|###|##|#|$))/i
    );

    if (!quickStepsMatch) return [];

    const section = quickStepsMatch[1];

    const numberedSteps = section
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^\d+[.)]\s+/.test(line))
      .map((line) =>
        line.replace(/^\d+[.)]\s+/, "").trim()
      )
      .filter(Boolean);

    if (numberedSteps.length > 0) {
      return numberedSteps.slice(0, 3);
    }

    const bulletSteps = section
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^[-*•]\s+/.test(line))
      .map((line) =>
        line.replace(/^[-*•]\s+/, "").trim()
      )
      .filter(Boolean);

    return bulletSteps.slice(0, 3);
  };

  // =========================
  // Parse Weekly Cost
  // =========================

  const estimatedWeeklyCost = useMemo(() => {
    if (!weeklyPlan) return null;

    const totalPatterns = [
      /Estimated\s+total\s*:\s*(?:Rs\.?|PKR)?\s*([\d,]+)/i,
      /Total\s*:\s*(?:Rs\.?|PKR)?\s*([\d,]+)/i,
      /Estimated\s+total\s+weekly\s+cost\s*:\s*(?:Rs\.?|PKR)?\s*([\d,]+)/i,
      /Weekly\s+total\s*:\s*(?:Rs\.?|PKR)?\s*([\d,]+)/i,
    ];

    for (const pattern of totalPatterns) {
      const match = weeklyPlan.match(pattern);

      if (match) {
        const cost = parseCost(match[1]);

        if (cost !== null) {
          return cost;
        }
      }
    }

    const costs = Array.from(
      weeklyPlan.matchAll(
        /Estimated\s+Cost\s*:\s*(?:Rs\.?|PKR)?\s*([\d,]+)/gi
      )
    )
      .map((match) => parseCost(match[1]))
      .filter((value): value is number => value !== null);

    if (costs.length >= 3) {
      return costs.reduce(
        (total, cost) => total + cost,
        0
      );
    }

    return null;
  }, [weeklyPlan]);

  // =========================
  // Budget Calculations
  // =========================

  const budgetNumber = useMemo(() => {
    const value = Number(String(budget).replace(/,/g, ""));

    return Number.isFinite(value) && value > 0
      ? value
      : 0;
  }, [budget]);

  const remainingBudget = useMemo(() => {
    if (estimatedWeeklyCost === null) return null;

    return budgetNumber - estimatedWeeklyCost;
  }, [budgetNumber, estimatedWeeklyCost]);

  const budgetPercentage = useMemo(() => {
    if (!budgetNumber || estimatedWeeklyCost === null) {
      return 0;
    }

    return Math.round(
      (estimatedWeeklyCost / budgetNumber) * 100
    );
  }, [budgetNumber, estimatedWeeklyCost]);

  const isOverBudget =
    remainingBudget !== null && remainingBudget < 0;

  // =========================
  // Parse Daily Meals
  // =========================

  const parsedDays = useMemo<DayPlan[]>(() => {
    if (!weeklyPlan) {
      return DAYS.map((day) => EMPTY_DAY(day));
    }

    return DAYS.map((day) => {
      const dayPlan = EMPTY_DAY(day);

      const dayRegex = new RegExp(
        `##\\s*${day}\\s*([\\s\\S]*?)(?=##\\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)|#{1,6}\\s*🛒\\s*Weekly\\s+Shopping\\s+List|#{1,6}\\s*💰\\s*Weekly\\s+Cost\\s+Summary|$)`,
        "i"
      );

      const dayMatch = weeklyPlan.match(dayRegex);

      if (!dayMatch) {
        return dayPlan;
      }

      const dayContent = dayMatch[1];

      const mealPatterns = [
        {
          key: "breakfast" as const,
          pattern:
            /###\s*🍳\s*Breakfast([\s\S]*?)(?=###\s*🍛\s*Lunch|###\s*🍽️\s*Dinner|$)/i,
        },
        {
          key: "lunch" as const,
          pattern:
            /###\s*🍛\s*Lunch([\s\S]*?)(?=###\s*🍽️\s*Dinner|$)/i,
        },
        {
          key: "dinner" as const,
          pattern:
            /###\s*🍽️\s*Dinner([\s\S]*?)$/i,
        },
      ];

      for (const mealPattern of mealPatterns) {
        const mealMatch = dayContent.match(
          mealPattern.pattern
        );

        if (!mealMatch) continue;

        const mealContent = mealMatch[1].trim();

        const mealNameMatch =
          mealContent.match(
            /(?:^|\n)\s*(?:Meal|Dish)\s*:\s*(.+)/i
          ) ||
          mealContent.match(
            /(?:^|\n)\s*[-*•]\s*(.+)/
          );

        const costMatch =
          mealContent.match(
            /Estimated\s+Cost\s*:\s*(.+)/i
          ) ||
          mealContent.match(
            /Cost\s*:\s*(.+)/i
          );

        const prepTimeMatch =
          mealContent.match(
            /Prep\s+Time\s*:\s*(.+)/i
          );

        dayPlan[mealPattern.key] = {
          name: mealNameMatch
            ? mealNameMatch[1].trim()
            : "",

          cost: costMatch
            ? parseCost(costMatch[1])
            : null,

          prepTime: prepTimeMatch
            ? parsePrepTime(prepTimeMatch[1])
            : null,

          quickSteps: parseQuickSteps(mealContent),
        };
      }

      return dayPlan;
    });
  }, [weeklyPlan]);

  // =========================
  // Structured Weekly Highlights
  // =========================

  const prepStats = useMemo(() => {
    const meals = parsedDays.flatMap((day) => [
      { day: day.day, meal: t("opt.Breakfast"), data: day.breakfast },
      { day: day.day, meal: t("opt.Lunch"), data: day.lunch },
      { day: day.day, meal: t("opt.Dinner"), data: day.dinner },
    ]).filter((item) => item.data.name);

    const timedMeals = meals.filter(
      (item) => item.data.prepTime !== null
    );

    const totalMinutes = timedMeals.reduce(
      (total, item) => total + (item.data.prepTime || 0),
      0
    );

    const averageMinutes = timedMeals.length
      ? Math.round(totalMinutes / timedMeals.length)
      : null;

    const fastestMeal = timedMeals.length
      ? timedMeals.reduce((fastest, item) =>
          (item.data.prepTime || Infinity) <
          (fastest.data.prepTime || Infinity)
            ? item
            : fastest
        )
      : null;

    const longestMeal = timedMeals.length
      ? timedMeals.reduce((longest, item) =>
          (item.data.prepTime || 0) >
          (longest.data.prepTime || 0)
            ? item
            : longest
        )
      : null;

    const mealsWithSteps = meals.filter(
      (item) => item.data.quickSteps.length > 0
    ).length;

    return {
      mealsCount: meals.length,
      timedMealsCount: timedMeals.length,
      totalMinutes,
      averageMinutes,
      fastestMeal,
      longestMeal,
      mealsWithSteps,
    };
  }, [parsedDays]);

  const parsedSubstitutions = useMemo<SmartSubstitution[]>(() => {
    if (!weeklyPlan || !smartSubstitutions) return [];

    const results: SmartSubstitution[] = [];

    const sectionMatch = weeklyPlan.match(
      /(?:🔄\s*)?(?:Smart\s+Substitution|Smart\s+Substitutions)[\s\S]*?(?=\n#{1,6}\s|$)/i
    );

    if (!sectionMatch) return [];

    const section = sectionMatch[0];

    const patterns = [
      /If\s+(.+?)\s+is\s+(?:unavailable|expensive)[,;]?\s*(?:use|try)\s+(.+?)(?:\.|\n|$)/gi,
      /(?:[-*•]\s*)?(.+?)\s*→\s*(.+?)(?:\s*[—-]\s*(.+?))?(?:\n|$)/g,
    ];

    for (const pattern of patterns) {
      for (const match of section.matchAll(pattern)) {
        const original = (match[1] || "").trim().replace(/[.]+$/, "");
        const substitute = (match[2] || "").trim().replace(/[.]+$/, "");
        const reason =
          (match[3] || "Practical alternative").trim().replace(/[.]+$/, "");

        if (
          original &&
          substitute &&
          original.length < 100 &&
          substitute.length < 120 &&
          original.toLowerCase() !== substitute.toLowerCase()
        ) {
          results.push({ original, substitute, reason });
        }
      }
    }

    const unique = new Map<string, SmartSubstitution>();

    results.forEach((item) => {
      const key =
        `${item.original.toLowerCase()}::${item.substitute.toLowerCase()}`;

      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });

    return Array.from(unique.values()).slice(0, 8);
  }, [weeklyPlan, smartSubstitutions]);

  const parsedLeftoverIdeas = useMemo<LeftoverIdea[]>(() => {
    if (!weeklyPlan || !useLeftovers) return [];

    const results: LeftoverIdea[] = [];

    const sectionMatch = weeklyPlan.match(
      /(?:^|\n)#{1,6}\s*(?:♻️\s*)?(?:Leftover\s+Repurposing|Leftover\s+Ideas?|Leftover\s+Idea)[^\n]*[\r\n]+([\s\S]*?)(?=\n#{1,6}\s|$)/i
    );

    let section = sectionMatch ? sectionMatch[1] : "";

    if (!sectionMatch) {
      const fallback = weeklyPlan.match(
        /(?:♻️\s*)?(?:Leftover\s+Idea|Leftover\s+Ideas)[\s\S]*?(?=\n#{1,6}\s|$)/i
      );

      if (!fallback) return [];
      section = fallback[0];
    }

    section
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const cleaned = line
          .replace(/^[-*•]\s*/, "")
          .replace(/^\d+[.)]\s*/, "")
          .replace(/^♻️\s*(?:Leftover\s+(?:Idea|Repurposing)\s*:\s*)?/i, "")
          .trim();

        if (!cleaned || cleaned.length < 8) return;

        const arrowMatch = cleaned.match(
          /^(.+?)\s*(?:→|->|=>)\s*(.+?)(?:\s*[—-]\s*(.+))?$/
        );

        if (arrowMatch) {
          results.push({
            source: arrowMatch[1].trim(),
            result: arrowMatch[2].trim(),
            note: (arrowMatch[3] || "Practical leftover reuse").trim(),
          });
          return;
        }

        const useMatch = cleaned.match(
          /(?:use|turn|reuse)\s+(.+?)\s+(?:to make|into)\s+(.+?)(?:\.|$)/i
        );

        if (useMatch) {
          results.push({
            source: useMatch[1].trim(),
            result: useMatch[2].trim(),
            note: "Simple way to reduce food waste",
          });
        } else {
          results.push({
            source: "Leftover",
            result: cleaned.replace(/[.]+$/, ""),
            note: "Practical reuse idea",
          });
        }
      });

    const unique = new Map<string, LeftoverIdea>();

    results.forEach((item) => {
      const key = `${item.source.toLowerCase()}::${item.result.toLowerCase()}`;
      if (!unique.has(key)) unique.set(key, item);
    });

    return Array.from(unique.values()).slice(0, 8);
  }, [weeklyPlan, useLeftovers]);

  const togglePlannedLeftover = (key: string) => {
    setPlannedLeftovers((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem(
        "localplate_planned_leftovers",
        JSON.stringify(next)
      );
      return next;
    });
  };

  const copyLeftoverIdeas = async () => {
    if (parsedLeftoverIdeas.length === 0) return;

    const text = [
      "♻️ LocalPlate AI — Leftover Repurposing",
      "",
      ...parsedLeftoverIdeas.map(
        (idea, index) =>
          `${index + 1}. ${idea.source} → ${idea.result} — ${idea.note}`
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy leftover ideas:", error);
    }
  };

  const parsedShoppingItems = useMemo(() => {
    if (!weeklyPlan) return [];

    const shoppingList = prepareShoppingList(weeklyPlan);

    if (!shoppingList) return [];

    return shoppingList
      .split(/\r?\n/)
      .map((line) =>
        line
          .replace(/^[-*•]\s*/, "")
          .trim()
      )
      .filter(Boolean)
      .slice(0, 24);
  }, [weeklyPlan]);

  // =========================
  // Day Cost
  // =========================

  const getDayCost = (day: DayPlan) => {
    const costs = [
      day.breakfast.cost,
      day.lunch.cost,
      day.dinner.cost,
    ].filter(
      (value): value is number => value !== null
    );

    if (costs.length === 0) return null;

    return costs.reduce(
      (total, cost) => total + cost,
      0
    );
  };

  // =========================
  // Toggle Day
  // =========================

  const toggleDay = (day: string) => {
    setExpandedDays((current) => ({
      ...current,
      [day]: !current[day],
    }));
  };

  // =========================
  // Expand / Collapse All
  // =========================

  const expandAllDays = () => {
    setExpandedDays(
      DAYS.reduce(
        (result, day) => {
          result[day] = true;
          return result;
        },
        {} as Record<string, boolean>
      )
    );
  };

  const collapseAllDays = () => {
    setExpandedDays(
      DAYS.reduce(
        (result, day) => {
          result[day] = false;
          return result;
        },
        {} as Record<string, boolean>
      )
    );
  };

  // =========================
  // WhatsApp Share
  // =========================

  const shareOnWhatsApp = (text: string) => {
    if (!text.trim()) return;

    const whatsappUrl =
      `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const shareWeeklyMenu = () => {
    if (!weeklyPlan) return;

    const text = [
      "🍽️ LocalPlate AI",
      "",
      "🗓️ My Weekly Meal Plan",
      "",
      weeklyPlan,
    ].join("\n");

    shareOnWhatsApp(text);

    setWhatsappShared(true);

    window.setTimeout(() => {
      setWhatsappShared(false);
    }, 2000);
  };

  const shareShoppingListOnWhatsApp = () => {
    if (!weeklyPlan) return;

    const shoppingList =
      prepareShoppingList(weeklyPlan);

    if (!shoppingList) {
      alert(
        t("wk.noShop")
      );

      return;
    }

    const text = [
      "🛒 LocalPlate AI",
      "",
      "Weekly Shopping List",
      "",
      shoppingList.replace(
        /^##\s*🛒\s*Ingredients\s*/i,
        ""
      ),
    ].join("\n");

    shareOnWhatsApp(text);
  };

  // =========================
  // Save Weekly Plan
  // =========================

  const saveWeeklyPlan = async () => {
    if (!weeklyPlan || savingPlan) return;

    setSavingPlan(true);

    try {
      const storedPlans = localStorage.getItem(
        "localplate_saved_plans"
      );

      let existingPlans: WeeklySavedPlan[] = [];

      if (storedPlans) {
        const parsedPlans = JSON.parse(storedPlans);

        if (Array.isArray(parsedPlans)) {
          existingPlans = parsedPlans;
        }
      }

      const alreadySaved = existingPlans.some(
        (plan) =>
          plan.mealPlan === weeklyPlan &&
          (plan.planType === "weekly" ||
            plan.mealType === "Weekly Plan")
      );

      if (!alreadySaved) {
        const newPlan: WeeklySavedPlan = {
          id: Date.now(),
          mealPlan: weeklyPlan,
          foodType,
          budget,
          mealType: "Weekly Plan",
          diet,
          time: t("wk.days7"),
          goal,
          servings,
          city,
          pantry,
          extraPreferences: preferences,
          smartSubstitutions,
          useLeftovers,
          leftovers,
          createdAt: new Date().toLocaleString(),
          favorite: false,
          planType: "weekly",
        };

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { error } = await supabase.from("saved_plans").insert({
            user_id: user.id,
            meal_plan: weeklyPlan,
            food_type: foodType,
            budget,
            meal_type: "Weekly Plan",
            diet,
            time: t("wk.days7"),
            goal,
            servings,
            city,
            pantry,
            extra_preferences: preferences,
            favorite: false,
            plan_type: "weekly",
            smart_substitutions: smartSubstitutions,
            use_leftovers: useLeftovers,
            leftovers,
          });

          if (error) {
            console.error("Supabase weekly save error:", error);
            throw error;
          }
        }

        localStorage.setItem(
          "localplate_saved_plans",
          JSON.stringify([
            newPlan,
            ...existingPlans,
          ])
        );
      }

      localStorage.setItem(
        "localplate_weekly_plan",
        weeklyPlan
      );

      const shoppingList =
        prepareShoppingList(weeklyPlan);

      if (shoppingList) {
        localStorage.setItem(
          "localplate_shopping_list",
          shoppingList
        );
      }

      const refreshedPlans = JSON.parse(
        localStorage.getItem("localplate_saved_plans") || "[]"
      );

      setSavedPlanCount(
        Array.isArray(refreshedPlans) ? refreshedPlans.length : 0
      );
      setSaved(true);
      setErrorMessage("");
    } catch (error) {
      console.error(
        "Failed to save weekly plan:",
        error
      );

      alert(
        t("wk.saveFail")
      );
    } finally {
      setSavingPlan(false);
    }
  };

  // =========================
  // Open Saved Plans
  // =========================

  const openSavedPlans = () => {
    router.push("/saved-plans");
  };

  // =========================
  // Copy Weekly Plan
  // =========================

  const copyWeeklyPlan = async () => {
    if (!weeklyPlan || copied) return;

    try {
      await navigator.clipboard.writeText(
        weeklyPlan
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy weekly plan:",
        error
      );

      alert(
        t("wk.copyFail")
      );
    }
  };

  // =========================
  // Generate Weekly Plan
  // =========================

  const generateWeeklyPlan = async () => {
    if (loading) return;

    if (!budget.trim()) {
      setErrorMessage(
        t("wk.tBudget")
      );

      return;
    }

    setLoading(true);
    setSaved(false);
    setCopied(false);
    setWhatsappShared(false);
    setErrorMessage("");
    setWeeklyPlan("");

    try {
      const prompt = `
You are LocalPlate AI, an expert Pakistani food and weekly meal-planning assistant.

Create a complete, practical and personalized 7-day meal plan.

=========================
USER PREFERENCES
=========================

Food type:
${foodType}

Weekly budget:
PKR ${budget}

Diet:
${diet}

Goal:
${goal}

Servings:
${servings} people

City / Area:
${city || "Not specified"}

Pantry ingredients:
${pantry || "None specified"}

Additional preferences:
${preferences || "None specified"}

Smart substitutions:
${smartSubstitutions ? "Enabled" : "Disabled"}

Use leftover repurposing:
${useLeftovers ? "Enabled" : "Disabled"}

Current leftovers:
${useLeftovers && leftovers.trim() ? leftovers : "None specified"}

=========================
CORE REQUIREMENTS
=========================

1. Create exactly 7 days:

Monday, Tuesday, Wednesday, Thursday, Friday, Saturday and Sunday.

2. Every day MUST contain:

- Breakfast
- Lunch
- Dinner

3. Give one meal per slot.

4. Keep the complete estimated weekly cost within PKR ${budget}.

5. Use realistic approximate Pakistani Rupee prices. Never estimate any single ingredient below Rs. 50 (the smallest note is Rs. 10) and round every price to the nearest Rs. 10.

6. Never claim prices are exact live store prices.

7. If a city is provided, use it only as approximate local pricing context.

8. Prefer Pakistani and South Asian meals when suitable.

9. Prefer ingredients commonly available in Pakistan.

10. Reuse ingredients intelligently across multiple meals to reduce:
- cost
- food waste
- unnecessary shopping

11. Use pantry ingredients whenever practical.

12. Respect:
- diet
- goal
- servings
- city/local context
- additional preferences

13. Never recommend an ingredient that conflicts with the user's diet or stated restrictions.

14. Do not make medical claims.

15. Do not recommend extreme diets.

16. Keep meals practical for a normal Pakistani household.

17. Avoid unnecessary expensive ingredients.

18. If pantry ingredients are provided, prioritize them before suggesting additional purchases.

19. Keep variety across the week.

20. Do not repeat the exact same meal unnecessarily.
21. Write meal names, ingredient names, quick steps, substitutions and leftover ideas in ${lang === "ur" ? "Urdu (اردو), in Urdu script, not Roman Urdu" : lang === "hi" ? "Hindi (हिन्दी), in Devanagari script" : "English"}. Keep these exactly in English: the day names (Monday to Sunday), Breakfast, Lunch, Dinner, the labels "Meal:", "Estimated Cost:", "Prep Time:", "Quick Steps:", "🔄 Smart Substitution:", every "#" section heading, and the words PKR and minutes. Use Latin digits (0-9) and write units such as g, kg, ml in English letters.

=========================
SMART SUBSTITUTIONS
=========================

${
  smartSubstitutions
    ? `
Smart substitutions are ENABLED.

For every meal where a useful substitution exists, include:

🔄 Smart Substitution:
If [ingredient] is unavailable or expensive, use [substitute].

Prefer practical Pakistani alternatives.

Examples:
- chicken → daal, chickpeas, paneer or potatoes when suitable
- fresh coriander → dried coriander when practical
- tomato → another suitable acidic ingredient when appropriate
- expensive vegetables → commonly available seasonal vegetables

Never suggest substitutions that violate:
- diet
- allergies
- dislikes
`
    : `
Smart substitutions are DISABLED.

Do not add Smart Substitution sections.
`
}

=========================
LEFTOVER REPURPOSING
=========================

${
  useLeftovers
    ? `
Leftover repurposing is ENABLED.

${
  leftovers.trim()
    ? `The user currently has these leftovers:
${leftovers}`
    : "The user has not specified a particular leftover."
}

When practical, reuse leftovers in another meal.

Create a dedicated section exactly like this:

## ♻️ Leftover Repurposing
- [leftover/meal] → [new meal] — [short practical reason]
- [leftover/meal] → [new meal] — [short practical reason]
- [leftover/meal] → [new meal] — [short practical reason]

Give 3 to 6 useful ideas when enough information exists. If the user supplied specific leftovers, prioritize those first. Otherwise suggest realistic leftovers created by the weekly plan.

Examples:
- leftover chicken curry → chicken wrap — easy next-day lunch
- leftover daal → daal paratha — uses the same cooked daal
- leftover rice → vegetable fried rice — quick second meal
- leftover chana → chana chaat — fresh, low-effort reuse

Do not force leftover reuse when it would be impractical or unsafe.
`
    : `
Leftover repurposing is DISABLED.

Do not add Leftover Idea sections.
`
}

=========================
MEAL DETAIL REQUIREMENTS
=========================

For EVERY breakfast, lunch and dinner provide:

Meal: [meal name]

Estimated Cost: PKR [amount]

Prep Time: [number] minutes

Quick Steps:
1. [short step]
2. [short step]
3. [short step]

Keep quick steps short and practical.
Prep Time must be a realistic active kitchen estimate for the selected servings, not a vague range.
Always provide exactly 3 numbered Quick Steps for every meal.
Do not combine multiple cooking actions into one very long step.

=========================
SHOPPING LIST REQUIREMENTS
=========================

At the end provide ONE combined weekly shopping list.

Every shopping item MUST:

- start with "- "
- contain ingredient name
- contain approximate quantity
- contain estimated cost

Do not use a table.

Do not put the shopping list inside a code block.

Use this exact heading:

# 🛒 Weekly Shopping List

=========================
COST REQUIREMENTS
=========================

After the shopping list provide:

# 💰 Weekly Cost Summary

Estimated total: PKR XXXX

Remaining budget: PKR XXXX

The estimated total should remain within PKR ${budget} whenever realistically possible.

=========================
EXACT RESPONSE STRUCTURE
=========================

# 🗓️ Weekly Meal Plan

## Monday

### 🍳 Breakfast

Meal: [meal name]

Estimated Cost: PKR [amount]

Prep Time: [number] minutes

Quick Steps:
1. [step]
2. [step]
3. [step]

### 🍛 Lunch

Meal: [meal name]

Estimated Cost: PKR [amount]

Prep Time: [number] minutes

Quick Steps:
1. [step]
2. [step]
3. [step]

### 🍽️ Dinner

Meal: [meal name]

Estimated Cost: PKR [amount]

Prep Time: [number] minutes

Quick Steps:
1. [step]
2. [step]
3. [step]

Repeat the same structure for:

## Tuesday
## Wednesday
## Thursday
## Friday
## Saturday
## Sunday

Each day MUST contain Breakfast, Lunch and Dinner.

# 🛒 Weekly Shopping List

- Ingredient — Quantity — Estimated Cost
- Ingredient — Quantity — Estimated Cost
- Ingredient — Quantity — Estimated Cost

# 💰 Weekly Cost Summary

Estimated total: PKR XXXX

Remaining budget: PKR XXXX

IMPORTANT:

Return the complete weekly plan.

Do not omit any day.

Do not omit any meal.

Do not use a code block.

Do not return an explanation before the weekly plan.
`;

      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            t("wk.genFail")
        );
      }

      if (
        !data?.reply ||
        typeof data.reply !== "string"
      ) {
        throw new Error(
          t("wk.noReply")
        );
      }

      const generatedPlan =
        data.reply.trim();

      setWeeklyPlan(generatedPlan);

      localStorage.setItem(
        "localplate_weekly_plan",
        generatedPlan
      );

      const shoppingList =
        prepareShoppingList(generatedPlan);

      if (shoppingList) {
        localStorage.setItem(
          "localplate_shopping_list",
          shoppingList
        );
      } else {
        localStorage.removeItem(
          "localplate_shopping_list"
        );
      }

      setExpandedDays(
        DAYS.reduce(
          (result, day) => {
            result[day] = true;
            return result;
          },
          {} as Record<string, boolean>
        )
      );

      window.setTimeout(() => {
        document
          .getElementById("weekly-result")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);
    } catch (error) {
      console.error(
        "Weekly Plan Error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : t("wk.wrongGen");

      setErrorMessage(message);
      setWeeklyPlan("");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // Send to Shopping List
  // =========================

  const sendToShoppingList = () => {
    if (!weeklyPlan) return;

    const shoppingList =
      prepareShoppingList(weeklyPlan);

    if (!shoppingList) {
      alert(
        t("wk.noShop")
      );

      return;
    }

    localStorage.setItem(
      "localplate_shopping_list",
      shoppingList
    );

    router.push("/shopping-list");
  };

  // =========================
  // Use Preferences Again
  // =========================

  const usePreferencesAgain = () => {
    localStorage.setItem(
      "localplate_reuse_weekly_preferences",
      JSON.stringify({
        budget,
        foodType,
        diet,
        goal,
        servings,
        city,
        pantry,
        preferences,
        smartSubstitutions,
        useLeftovers,
        leftovers,
      })
    );

    router.push("/weekly-plan");
  };

  // =========================
  // Render Meal Card
  // =========================

  const renderMeal = (
    label: string,
    icon: string,
    meal: DayMeal
  ) => {
    return (
      <div className="rounded-2xl border border-zinc-100 bg-[#fffaf5] p-4 transition hover:border-orange-200 hover:shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm ring-1 ring-zinc-100">
              {icon}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {label}
              </p>

              <p className="mt-1 break-words font-semibold text-zinc-900">
                {meal.name ||
                  "Meal details in plan"}
              </p>
            </div>
          </div>

          {meal.cost !== null && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                {t("wk.cost")}
              </p>

              <p className="text-sm font-bold text-zinc-900">
                Rs. {meal.cost.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 border-t border-zinc-100 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {meal.prepTime !== null ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                ⏱️ {meal.prepTime} min prep
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-500">
                {t("wk.noPrep")}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
              👨‍🍳 {meal.quickSteps.length || 0}/3 quick steps
            </span>
          </div>

          <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-zinc-100">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                {t("wk.quickRecipe")}
              </p>
              <span className="text-[10px] font-semibold text-zinc-400">
                {t("wk.fastMode")}
              </span>
            </div>

            {meal.quickSteps.length > 0 ? (
              <ol className="mt-3 space-y-2">
                {meal.quickSteps.slice(0, 3).map((step, index) => (
                  <li
                    key={`${meal.name}-${index}`}
                    className="flex gap-2 text-xs leading-5 text-zinc-600"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-xs leading-5 text-zinc-400">
                {t("wk.noSteps")}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =========================
  // UI
  // =========================

  return (
    <main className="min-h-screen bg-[#fffaf5] px-5 py-10 text-zinc-900 md:px-10">
      <style jsx global>{`
        @keyframes localplateFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="mx-auto max-w-6xl">
        {/* Header */}

        <section>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("home.weekly")}
          </h1>
        </section>

        {/* Error */}

        {errorMessage && (
          <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>

              <div>
                <p className="font-bold">
                  {t("wk.failed")}
                </p>

                <p className="mt-1">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}

        <section className="mt-12 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 md:p-8">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
              {t("wk.prefs")}
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {t("wk.build")}
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {t("wk.buildText")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Budget */}

            <div>
              <label className="text-sm font-semibold text-zinc-800">
                {t("wk.budget")}
              </label>

              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-400">
                  PKR
                </span>

                <input
                  type="number"
                  min="1"
                  value={budget}
                  onChange={(e) =>
                    setBudget(e.target.value)
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-14 pr-4 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  placeholder="7000"
                />
              </div>
            </div>

            {/* Food Type */}

            <div>
              <label className="text-sm font-semibold text-zinc-800">
                {t("wk.foodType")}
              </label>

              <select
                value={foodType}
                onChange={(e) =>
                  setFoodType(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="Pakistani">{label("opt", "Pakistani")}</option>
                <option value="South Asian">{label("opt", "South Asian")}</option>
                <option value="Mixed">{label("opt", "Mixed")}</option>
                <option value="Vegetarian">{label("opt", "Vegetarian")}</option>
              </select>
            </div>

            {/* Diet */}

            <div>
              <label className="text-sm font-semibold text-zinc-800">
                {t("cook.diet")}
              </label>

              <select
                value={diet}
                onChange={(e) =>
                  setDiet(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="Normal">{label("opt", "Normal")}</option>
                <option value="Vegetarian">{label("opt", "Vegetarian")}</option>
                <option value="Vegan">{label("opt", "Vegan")}</option>
                <option value="High Protein">{label("opt", "High Protein")}</option>
                <option value="Low Carb">{label("opt", "Low Carb")}</option>
              </select>
            </div>

            {/* Goal */}

            <div>
              <label className="text-sm font-semibold text-zinc-800">
                {t("cook.goal")}
              </label>

              <select
                value={goal}
                onChange={(e) =>
                  setGoal(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="Healthy Eating">{label("opt", "Healthy Eating")}</option>
                <option value="Weight Management">{label("opt", "Weight Management")}</option>
                <option value="Muscle Building">{label("opt", "Muscle Building")}</option>
                <option value="Budget Saving">{label("opt", "Budget Saving")}</option>
                <option value="Family Meals">{label("opt", "Family Meals")}</option>
              </select>
            </div>

            {/* Servings */}

            <div>
              <label className="text-sm font-semibold text-zinc-800">
                {t("wk.people")}
              </label>

              <select
                value={servings}
                onChange={(e) =>
                  setServings(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="1">
                  {t("wk.person", { n: 1 })}
                </option>
                <option value="2">
                  {t("pl.people", { n: 2 })}
                </option>
                <option value="3">
                  {t("pl.people", { n: 3 })}
                </option>
                <option value="4">
                  {t("pl.people", { n: 4 })}
                </option>
                <option value="5">
                  {t("pl.people", { n: 5 })}
                </option>
                <option value="6">
                  {t("pl.people", { n: 6 })}
                </option>
              </select>
            </div>

            {/* City */}

            <div>
              <label className="text-sm font-semibold text-zinc-800">
                {t("wk.city")}
              </label>

              <input
                type="text"
                value={city}
                onChange={(e) =>
                  setCity(e.target.value)
                }
                placeholder={t("wk.phCity")}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />

              <p className="mt-2 text-xs text-zinc-400">
                {t("wk.cityHint")}
              </p>
            </div>

            {/* Pantry */}

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-zinc-800">
                {t("wk.pantry")}
              </label>

              <textarea
                value={pantry}
                onChange={(e) =>
                  setPantry(e.target.value)
                }
                rows={3}
                placeholder={t("wk.phPantry")}
                className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />

              <p className="mt-2 text-xs text-zinc-400">
                {t("wk.pantryHint")}
              </p>
            </div>

            {/* Smart Kitchen */}

            <div className="md:col-span-2">
              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    {t("wk.smartKitchen")}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {t("wk.smartKitchenText")}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {/* Substitutions */}

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-zinc-100 transition hover:ring-orange-200">
                    <input
                      type="checkbox"
                      checked={smartSubstitutions}
                      onChange={(e) =>
                        setSmartSubstitutions(
                          e.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 accent-orange-600"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-zinc-900">
                        {t("wk.subs")}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-zinc-500">
                        {t("wk.subsText")}
                      </span>
                    </span>
                  </label>

                  {/* Leftovers */}

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-zinc-100 transition hover:ring-orange-200">
                    <input
                      type="checkbox"
                      checked={useLeftovers}
                      onChange={(e) =>
                        setUseLeftovers(
                          e.target.checked
                        )
                      }
                      className="mt-1 h-4 w-4 accent-orange-600"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-zinc-900">
                        {t("wk.leftovers")}
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-zinc-500">
                        {t("wk.leftoversText")}
                      </span>
                    </span>
                  </label>
                </div>

                {useLeftovers && (
                  <div className="mt-4">
                    <label className="text-sm font-semibold text-zinc-800">
                      {t("wk.leftoversQ")}
                    </label>

                    <input
                      type="text"
                      value={leftovers}
                      onChange={(e) =>
                        setLeftovers(e.target.value)
                      }
                      placeholder={t("wk.phLeft")}
                      className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />

                    <p className="mt-2 text-xs text-zinc-400">
                      {t("wk.leftoversHint")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences */}

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-zinc-800">
                {t("wk.extra")}
              </label>

              <textarea
                value={preferences}
                onChange={(e) =>
                  setPreferences(e.target.value)
                }
                rows={3}
                placeholder={t("wk.phExtra")}
                className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>

          {/* Preference Preview */}

          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
              🍛 {foodType}
            </span>

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              🥗 {diet}
            </span>

            <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
              🎯 {goal}
            </span>

            <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              👥 {servings} people
            </span>

            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700">
              💰 Rs. {budget}
            </span>

            {city.trim() && (
              <span className="rounded-full bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700">
                📍 {city}
              </span>
            )}

            {smartSubstitutions && (
              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                {t("wk.tagSwaps")}
              </span>
            )}

            {useLeftovers && (
              <span className="rounded-full bg-lime-50 px-3 py-1.5 text-xs font-semibold text-lime-700">
                {t("wk.tagReuse")}
              </span>
            )}
          </div>

          {/* Generate */}

          <button
            type="button"
            onClick={generateWeeklyPlan}
            disabled={
              loading || !budget.trim()
            }
            className="mt-8 w-full rounded-full bg-orange-600 px-6 py-4 font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "⏳ Creating Your Smart Weekly Plan..."
              : weeklyPlan
                ? "✨ Generate New Weekly Plan"
                : "✨ Generate 7-Day Meal Plan"}
          </button>

          <p className="mt-3 text-center text-xs text-zinc-400">
            {t("wk.tagline")}
          </p>
        </section>

        {/* Result */}

        {weeklyPlan && (
          <section
            id="weekly-result"
            className="mt-10"
          >
            {/* Dashboard */}

            <div className="rounded-3xl bg-zinc-950 p-6 text-white shadow-xl md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
                    {t("wk.yourWeek")}
                  </p>

                  <h2 className="mt-2 text-3xl font-bold md:text-4xl">
                    {t("wk.weeklyPlanTitle")}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {t("wk.builtAround")}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">
                    {t("wk.horizon")}
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {t("wk.days7")}
                  </p>
                </div>
              </div>

              {/* Stats */}

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-zinc-400">
                    {t("wk.budget")}
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    Rs.{" "}
                    {budgetNumber.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-zinc-400">
                    {t("cook.estCost")}
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {estimatedWeeklyCost !== null
                      ? `Rs. ${estimatedWeeklyCost.toLocaleString()}`
                      : "Calculating..."}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-zinc-400">
                    {t("sh.remaining")}
                  </p>

                  <p
                    className={`mt-1 text-xl font-bold ${
                      isOverBudget
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {remainingBudget !== null
                      ? `Rs. ${Math.abs(
                          remainingBudget
                        ).toLocaleString()}`
                      : "—"}
                  </p>

                  {isOverBudget && (
                    <p className="mt-1 text-xs text-red-300">
                      {t("wk.over")}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs text-zinc-400">
                    {t("card.servings")}
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {servings} people
                  </p>
                </div>
              </div>

              {/* Budget Progress */}

              <div className="mt-7 rounded-2xl bg-white/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {t("wk.usage")}
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                      {estimatedWeeklyCost !== null
                        ? `${budgetPercentage}% of your weekly budget`
                        : "Based on AI estimated costs"}
                    </p>
                  </div>

                  <p
                    className={`text-sm font-bold ${
                      isOverBudget
                        ? "text-red-400"
                        : "text-orange-400"
                    }`}
                  >
                    {estimatedWeeklyCost !== null
                      ? `${budgetPercentage}%`
                      : "—"}
                  </p>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isOverBudget
                        ? "bg-red-500"
                        : "bg-orange-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        budgetPercentage,
                        100
                      )}%`,
                    }}
                  />
                </div>

                {isOverBudget && (
                  <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {t("wk.exceed")}
                  </div>
                )}
              </div>
            </div>

            {/* Personalization */}

            <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 md:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-xl">
                  🧠
                </div>

                <div>
                  <h3 className="font-bold text-zinc-900">
                    {t("wk.personalized")}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {t("wk.basedOn")}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
                  🍛 {foodType}
                </span>

                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  🥗 {diet}
                </span>

                <span className="rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700">
                  🎯 {goal}
                </span>

                <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                  👥 {servings} people
                </span>

                {city.trim() && (
                  <span className="rounded-full bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700">
                    📍 {city}
                  </span>
                )}

                {pantry.trim() && (
                  <span className="rounded-full bg-pink-50 px-4 py-2 text-sm font-medium text-pink-700">
                    {t("wk.pantryAware")}
                  </span>
                )}

                {smartSubstitutions && (
                  <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
                    {t("wk.subs")}
                  </span>
                )}

                {useLeftovers && (
                  <span className="rounded-full bg-lime-50 px-4 py-2 text-sm font-medium text-lime-700">
                    {t("wk.tagReuse")}
                  </span>
                )}
              </div>

              {/* Smart info */}

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {pantry.trim() && (
                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-800">
                    <span className="font-bold">
                      {t("wk.pantryIncluded")}
                    </span>

                    <p className="mt-1 text-green-700">
                      {t("wk.pantryAsked")}
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                  <span className="font-bold">
                    {t("wk.budgetAware")}
                  </span>

                  <p className="mt-1 text-blue-700">
                    {t("wk.budgetAwareText")}
                  </p>
                </div>

                {city.trim() && (
                  <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 text-sm text-yellow-800">
                    <span className="font-bold">
                      {t("wk.localPrice")}
                    </span>

                    <p className="mt-1 text-yellow-700">
                      {city} is being used as approximate
                      pricing context. Prices are not live
                      store prices.
                    </p>
                  </div>
                )}

                {useLeftovers && leftovers.trim() && (
                  <div className="rounded-2xl border border-lime-100 bg-lime-50 p-4 text-sm text-lime-800">
                    <span className="font-bold">
                      {t("wk.leftoversIncl")}
                    </span>

                    <p className="mt-1 text-lime-700">
                      AI will try to repurpose:
                      {" "}
                      {leftovers}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Day Controls */}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  {t("wk.schedule")}
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  {t("wk.openDay")}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={expandAllDays}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                  {t("sh.expand")}
                </button>

                <button
                  type="button"
                  onClick={collapseAllDays}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                  {t("sh.collapse")}
                </button>
              </div>
            </div>

            {/* Day Cards */}

            <div className="mt-4 space-y-4">
              {parsedDays.map((day) => {
                const dayCost =
                  getDayCost(day);

                const hasParsedMeals =
                  Boolean(
                    day.breakfast.name ||
                      day.lunch.name ||
                      day.dinner.name
                  );

                return (
                  <article
                    key={label("dayfull", day.day)}
                    className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-100"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleDay(day.day)
                      }
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-zinc-50 md:px-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 font-bold text-orange-700">
                          {day.day.slice(0, 2)}
                        </div>

                        <div>
                          <h4 className="font-bold text-zinc-900">
                            {label("dayfull", day.day)}
                          </h4>

                          <p className="mt-0.5 text-xs text-zinc-400">
                            {hasParsedMeals
                              ? "Breakfast • Lunch • Dinner"
                              : "Full details available below"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {dayCost !== null && (
                          <span className="hidden rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700 sm:inline-flex">
                            Rs.{" "}
                            {dayCost.toLocaleString()}
                          </span>
                        )}

                        <span className="text-zinc-400">
                          {expandedDays[day.day]
                            ? "⌃"
                            : "⌄"}
                        </span>
                      </div>
                    </button>

                    {expandedDays[day.day] && (
                      <div className="border-t border-zinc-100 p-5 md:p-6">
                        {hasParsedMeals ? (
                          <div className="grid gap-3 md:grid-cols-3">
                            {renderMeal(
                              t("opt.Breakfast"),
                              "🍳",
                              day.breakfast
                            )}

                            {renderMeal(
                              t("opt.Lunch"),
                              "🍛",
                              day.lunch
                            )}

                            {renderMeal(
                              t("opt.Dinner"),
                              "🍽️",
                              day.dinner
                            )}
                          </div>
                        ) : (
                          <p className="text-sm leading-7 text-zinc-500">
                            {t("wk.noRead")}
                          </p>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Allergy / Preference Warning */}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {isOverBudget ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="font-bold text-red-800">
                    {t("wk.budgetWarn")}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-700">
                    {t("wk.budgetWarnText")}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <p className="font-bold text-green-800">
                    {t("wk.budgetOk")}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-green-700">
                    {t("wk.budgetOkText")}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <p className="font-bold text-orange-800">
                  {t("wk.tip")}
                </p>

                <p className="mt-1 text-sm leading-6 text-orange-700">
                  {t("wk.tipText")}
                </p>
              </div>
            </div>

            {/* Structured Plan Overview */}

            <section className="mt-8" aria-labelledby="plan-overview-heading">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                    {t("wk.overview")}
                  </p>
                  <h3 id="plan-overview-heading" className="mt-1 text-2xl font-bold text-zinc-900">
                    {t("wk.glance")}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {t("wk.glanceText")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                    {parsedDays.filter((day) =>
                      day.breakfast.name || day.lunch.name || day.dinner.name
                    ).length}/7 days
                  </span>
                  {estimatedWeeklyCost !== null && (
                    <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                      Rs. {estimatedWeeklyCost.toLocaleString()}
                    </span>
                  )}
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    {servings} servings
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <article className="group rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                      🍽️
                    </div>
                    <span className="text-xs font-bold text-orange-600">{t("wk.days7u")}</span>
                  </div>
                  <h4 className="mt-4 font-bold text-zinc-900">Complete meal schedule</h4>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {t("wk.organized")}
                  </p>
                </article>

                <article className="group rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                      💰
                    </div>
                    <span className="text-xs font-bold text-green-600">
                      {isOverBudget ? "OVER" : "ON TRACK"}
                    </span>
                  </div>
                  <h4 className="mt-4 font-bold text-zinc-900">Budget snapshot</h4>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {estimatedWeeklyCost !== null
                      ? `Estimated Rs. ${estimatedWeeklyCost.toLocaleString()} from your Rs. ${budgetNumber.toLocaleString()} target.`
                      : "AI cost estimate is included in the plan."}
                  </p>
                </article>

                <article className="group rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                      📍
                    </div>
                    <span className="text-xs font-bold text-blue-600">
                      {city.trim() ? city : "LOCAL"}
                    </span>
                  </div>
                  <h4 className="mt-4 font-bold text-zinc-900">Planning context</h4>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    {city.trim()
                      ? `Meals use ${city} as approximate local pricing context.`
                      : "Meals are planned around commonly available Pakistani ingredients."}
                  </p>
                </article>
              </div>
            </section>

            {/* Prep Time + Quick Steps Overview */}

            <section className="mt-8" aria-labelledby="prep-overview-heading">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                    {t("wk.kitchen")}
                  </p>
                  <h3 id="prep-overview-heading" className="mt-1 text-2xl font-bold text-zinc-900">
                    {t("wk.prepSteps")}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                    {t("wk.prepStepsText")}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  {prepStats.mealsWithSteps}/{prepStats.mealsCount} meals with steps
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <article className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md" style={{ animation: "localplateFadeUp 0.45s ease-out both" }}>
                  <div className="text-2xl">⏱️</div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-blue-600">{t("wk.totalPrep")}</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900">
                    {prepStats.timedMealsCount ? `${prepStats.totalMinutes} min` : "—"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{t("wk.sumPrep")}</p>
                </article>

                <article className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md" style={{ animation: "localplateFadeUp 0.45s ease-out 60ms both" }}>
                  <div className="text-2xl">⚡</div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-orange-600">{t("wk.avgMeal")}</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900">
                    {prepStats.averageMinutes !== null ? `${prepStats.averageMinutes} min` : "—"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{t("wk.acrossMeals")}</p>
                </article>

                <article className="rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md" style={{ animation: "localplateFadeUp 0.45s ease-out 120ms both" }}>
                  <div className="text-2xl">🏃</div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-green-600">{t("wk.fastest")}</p>
                  <p className="mt-1 truncate text-base font-bold text-zinc-900">
                    {prepStats.fastestMeal?.data.name || "—"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {prepStats.fastestMeal?.data.prepTime != null ? `${prepStats.fastestMeal.data.prepTime} min • ${prepStats.fastestMeal.meal}` : "No timing available"}
                  </p>
                </article>

                <article className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md" style={{ animation: "localplateFadeUp 0.45s ease-out 180ms both" }}>
                  <div className="text-2xl">🧑‍🍳</div>
                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-purple-600">{t("wk.longest")}</p>
                  <p className="mt-1 truncate text-base font-bold text-zinc-900">
                    {prepStats.longestMeal?.data.name || "—"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {prepStats.longestMeal?.data.prepTime != null ? `${prepStats.longestMeal.data.prepTime} min • plan ahead` : "No timing available"}
                  </p>
                </article>
              </div>
            </section>

            {/* Smart Substitutions Cards */}

            {smartSubstitutions && (
              <section className="mt-8" aria-labelledby="substitutions-heading">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                      {t("wk.tagSwaps")}
                    </p>
                    <h3 id="substitutions-heading" className="mt-1 text-2xl font-bold text-zinc-900">
                      {t("wk.altTitle")}
                    </h3>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    {parsedSubstitutions.length} suggestions
                  </span>
                </div>

                {parsedSubstitutions.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {parsedSubstitutions.map((item, index) => (
                      <article
                        key={`${item.original}-${item.substitute}-${index}`}
                        className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                        style={{ animation: "localplateFadeUp 0.45s ease-out both", animationDelay: `${index * 60}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">
                            {item.original}
                          </span>
                          <span className="text-zinc-300">→</span>
                          <span className="rounded-xl bg-green-50 px-3 py-2 text-sm font-bold text-green-700">
                            {item.substitute}
                          </span>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-zinc-500">
                          {item.reason}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-5 text-sm text-blue-700">
                    {t("wk.noSwap")}
                  </div>
                )}
              </section>
            )}

            {/* Leftover Repurposing Cards */}

            {useLeftovers && (
              <section className="mt-8" aria-labelledby="leftovers-heading">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-lime-700">
                      {t("wk.lessWaste")}
                    </p>
                    <h3 id="leftovers-heading" className="mt-1 text-2xl font-bold text-zinc-900">
                      {t("wk.turnLeft")}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                      {t("wk.keepFood")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-lime-50 px-3 py-1.5 text-xs font-bold text-lime-700">
                      {parsedLeftoverIdeas.length} ideas
                    </span>
                    {parsedLeftoverIdeas.length > 0 && (
                      <button
                        type="button"
                        onClick={copyLeftoverIdeas}
                        className="rounded-full border border-lime-200 bg-white px-3 py-1.5 text-xs font-bold text-lime-700 transition hover:bg-lime-50"
                      >
                        {t("wk.copyIdeas")}
                      </button>
                    )}
                  </div>
                </div>

                {parsedLeftoverIdeas.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {parsedLeftoverIdeas.map((idea, index) => {
                      const key = `${idea.source.toLowerCase()}::${idea.result.toLowerCase()}`;
                      const planned = Boolean(plannedLeftovers[key]);

                      return (
                        <article
                          key={`${key}-${index}`}
                          className={`group rounded-3xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md ${
                            planned
                              ? "border-lime-300 bg-lime-50"
                              : "border-zinc-100 bg-white hover:border-lime-200"
                          }`}
                          style={{
                            animation: "localplateFadeUp 0.45s ease-out both",
                            animationDelay: `${index * 70}ms`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-100 text-xl">
                                ♻️
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-lime-700">
                                  Idea {index + 1}
                                </p>
                                <p className="mt-0.5 text-sm font-semibold text-zinc-500">
                                  {t("wk.smartReuse")}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => togglePlannedLeftover(key)}
                              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                                planned
                                  ? "bg-lime-600 text-white"
                                  : "border border-lime-200 bg-white text-lime-700 hover:bg-lime-50"
                              }`}
                            >
                              {planned ? "✓ Planned" : "＋ Plan this"}
                            </button>
                          </div>

                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex-1 rounded-2xl bg-white px-4 py-3 ring-1 ring-lime-100">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                                {t("wk.use")}
                              </p>
                              <p className="mt-1 font-bold text-zinc-900">{idea.source}</p>
                            </div>
                            <span className="text-center text-xl text-lime-500">→</span>
                            <div className="flex-1 rounded-2xl bg-white px-4 py-3 ring-1 ring-lime-100">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                                {t("wk.make")}
                              </p>
                              <p className="mt-1 font-bold text-zinc-900">{idea.result}</p>
                            </div>
                          </div>

                          <p className="mt-4 text-sm leading-6 text-lime-900">
                            💡 {idea.note}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-lime-200 bg-lime-50/60 p-6">
                    <p className="font-bold text-lime-900">
                      {t("wk.noLeft")}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-lime-800">
                      {t("wk.regenLeft")}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Shopping List Preview Cards */}

            {parsedShoppingItems.length > 0 && (
              <section className="mt-8" aria-labelledby="shopping-preview-heading">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                      {t("wk.grocery")}
                    </p>
                    <h3 id="shopping-preview-heading" className="mt-1 text-2xl font-bold text-zinc-900">
                      {t("wk.thisWeekShop")}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={sendToShoppingList}
                    className="group inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-white px-5 py-3.5 text-sm font-bold text-emerald-700 shadow-sm shadow-emerald-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md hover:shadow-emerald-900/10 active:translate-y-0 sm:w-auto"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-base transition-all duration-300 group-hover:bg-emerald-600 group-hover:text-white">
                      🛒
                    </span>
                    <span>{t("wk.openShop")}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-lg leading-none transition-all duration-300 group-hover:translate-x-1 group-hover:bg-emerald-600 group-hover:text-white">
                      →
                    </span>
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {parsedShoppingItems.slice(0, 9).map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm">
                          🛒
                        </span>
                        <p className="text-sm font-semibold leading-6 text-zinc-800">
                          {item}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {parsedShoppingItems.length > 9 && (
                  <p className="mt-3 text-center text-xs text-zinc-400">
                    + {parsedShoppingItems.length - 9} more items in your full Shopping List.
                  </p>
                )}
              </section>
            )}

            {/* Original AI Response — kept safely behind an accordion */}

            <details className="mt-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
              <summary className="cursor-pointer list-none px-5 py-5 transition hover:bg-zinc-50 md:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                      {t("wk.advanced")}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-zinc-900">
                      {t("wk.viewFull")}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      {t("wk.completeKept")}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
                    {t("wk.expand1")}
                  </span>
                </div>
              </summary>

              <div className="border-t border-zinc-100 bg-[#fffaf5] p-5 md:p-7">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-5 mt-2 text-3xl font-bold text-orange-700">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-8 text-2xl font-bold text-orange-600">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 mt-6 text-xl font-bold text-zinc-800">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-base leading-8 text-zinc-700">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-5 list-disc space-y-2 pl-6 text-zinc-700">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-5 list-decimal space-y-3 pl-6 text-zinc-700">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="pl-1 leading-7">
                        {children}
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-zinc-900">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {weeklyPlan}
                </ReactMarkdown>
              </div>
            </details>

            {/* Saved Plans Integration */}

            <div className="mt-6 overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-orange-50 p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                    {t("wk.collection")}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-zinc-900">
                    {savedPlanCount > 0
                      ? `${savedPlanCount} saved plan${savedPlanCount === 1 ? "" : "s"} ready to reuse`
                      : "Build your saved meal collection"}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {t("wk.collectionText")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openSavedPlans}
                  className="shrink-0 rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  {t("wk.openSaved")}
                </button>
              </div>
            </div>

            {/* Actions */}

            <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 md:p-6">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">
                  {t("wk.quick")}
                </p>

                <h3 className="mt-1 text-xl font-bold">
                  {t("wk.next")}
                </h3>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {/* Save */}

                <button
                  type="button"
                  onClick={saveWeeklyPlan}
                  disabled={saved || savingPlan}
                  className="rounded-full bg-orange-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-400"
                >
                  {savingPlan
                    ? "Saving..."
                    : saved
                      ? "✓ Saved to Saved Plans"
                      : "💾 Save Weekly Plan"}
                </button>

                {/* Saved Plans */}

                <button
                  type="button"
                  onClick={openSavedPlans}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-6 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  💾 Saved Plans{savedPlanCount > 0 ? ` (${savedPlanCount})` : ""}
                </button>

                {/* Copy */}

                <button
                  type="button"
                  onClick={copyWeeklyPlan}
                  disabled={copied}
                  className="rounded-full border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:bg-zinc-100"
                >
                  {copied
                    ? "✓ Copied"
                    : "📋 Copy Plan"}
                </button>

                {/* WhatsApp Menu */}

                <button
                  type="button"
                  onClick={shareWeeklyMenu}
                  className="rounded-full border border-green-200 bg-green-50 px-6 py-3 font-semibold text-green-700 transition hover:bg-green-100"
                >
                  {whatsappShared
                    ? "✓ Opening WhatsApp"
                    : "📱 Share Menu on WhatsApp"}
                </button>

                {/* Regenerate */}

                <button
                  type="button"
                  onClick={generateWeeklyPlan}
                  disabled={loading}
                  className="rounded-full border border-orange-200 bg-orange-50 px-6 py-3 font-semibold text-orange-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "⏳ Regenerating..."
                    : "🔄 Regenerate Plan"}
                </button>

                {/* Shopping */}

                <button
                  type="button"
                  onClick={sendToShoppingList}
                  className="rounded-full border border-green-200 bg-green-50 px-6 py-3 font-semibold text-green-700 transition hover:bg-green-100"
                >
                  {t("pl.shop")}
                </button>

                {/* WhatsApp Shopping */}

                <button
                  type="button"
                  onClick={
                    shareShoppingListOnWhatsApp
                  }
                  className="rounded-full border border-green-200 bg-white px-6 py-3 font-semibold text-green-700 transition hover:bg-green-50"
                >
                  {t("wk.sendWa")}
                </button>

                {/* Use Preferences */}

                <button
                  type="button"
                  onClick={usePreferencesAgain}
                  className="rounded-full border border-blue-200 bg-blue-50 px-6 py-3 font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  {t("wk.editPrefs")}
                </button>

                {/* Single Planner */}

                <button
                  type="button"
                  onClick={() =>
                    router.push("/planner")
                  }
                  className="rounded-full border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  🍽️ Single Meal Planner
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}

        {!weeklyPlan && !loading && (
          <section className="mt-10 rounded-3xl bg-orange-600 p-8 text-center text-white md:p-12">
            <div className="text-4xl">
              🥘
            </div>

            <h2 className="mt-4 text-3xl font-bold">
              {t("wk.oneWeek")}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-orange-100">
              {t("wk.oneWeekText")}
            </p>
          </section>
        )}

        {/* Loading State */}

        {loading && (
          <section className="mx-auto mt-8 max-w-4xl rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-2xl">
              ✨
            </div>

            <h3 className="mt-4 text-xl font-bold">
              {t("wk.building")}
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
              {t("wk.balancing")}
            </p>

            <div className="mx-auto mt-6 h-2 max-w-md overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-orange-500" />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}