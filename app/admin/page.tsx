"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FeatureFlag = {
  feature_name: string;
  enabled: boolean;
  description: string | null;
};

type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  country: string | null;
  region: string | null;
  budget_level: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SavedPlan = {
  id: string;
  user_id: string | null;
  meal_plan_id: string | null;
  saved_at: string;
  allergies: string | null;
  budget: string | null;
  city: string | null;
  created_at: string | null;
  diet: string | null;
  dislikes: string | null;
  meal_plan: string | null;
  food_type: string | null;
  meal_type: string | null;
  time: string | null;
  goal: string | null;
  servings: number | null;
  spice_level: string | null;
  pantry: string | null;
  extra_preferences: string | null;
  favorite: boolean | null;
  plan_type: string | null;
  smart_substitutions: unknown;
  use_leftovers: boolean | null;
  leftovers: string | null;
};

type ShoppingList = {
  id: string;
  user_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
  checked_items: unknown;
  favorite_items: unknown;
  custom_items: unknown;
  manual_prices: unknown;
  shopping_list: string | null;
};

type Stats = {
  users: number;
  savedPlans: number;
  shoppingLists: number;
};

type AuditLog = {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: unknown;
  created_at: string;
  total_count?: number;
};

type DashboardAnalytics = {
  total_users: number;
  total_admins: number;
  total_saved_plans: number;
  total_favorite_plans: number;
  total_shopping_lists: number;
  users_last_7_days: number;
  plans_last_7_days: number;
  lists_last_7_days: number;
};

/*
 * SHARED STYLE TOKENS
 */
const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-400/60 focus:bg-white/10 focus:ring-2 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50";

const searchInputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-400/60 focus:bg-white/10 focus:ring-2 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50";

const ghostButtonClass =
  "rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 transition duration-200 hover:border-violet-400/50 hover:bg-violet-500/15 hover:text-white hover:shadow-[0_0_18px_rgba(139,92,246,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";

const primaryButtonClass =
  "rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] transition duration-200 hover:shadow-[0_0_30px_rgba(167,139,250,0.7)] hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";

const sectionClass =
  "lp-fade-up mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#0f121b]/80 shadow-[0_10px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl";

export default function AdminPage() {
  const supabase = createClient();

  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditTotalCount, setAuditTotalCount] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const auditSearchTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const auditRequestRef = useRef(0);
  const [recentActivity, setRecentActivity] =
    useState<AuditLog[]>([]);
  const [chartMode, setChartMode] =
    useState<"totals" | "week">("totals");
  const [activeSection, setActiveSection] =
    useState("overview");

  const [stats, setStats] = useState<Stats>({
    users: 0,
    savedPlans: 0,
    shoppingLists: 0,
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [analytics, setAnalytics] =
    useState<DashboardAnalytics | null>(null);

  const [analyticsLoading, setAnalyticsLoading] =
    useState(false);
  const [error, setError] = useState("");

  // Users
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] =
    useState<AdminUser | null>(null);
  const [editingUser, setEditingUser] =
    useState<AdminUser | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const [userStats, setUserStats] = useState({
    total: 0,
    admins: 0,
    normalUsers: 0,
  });
  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const searchTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const usersRequestRef = useRef(0);

  // Saved Plans
  const [planSearch, setPlanSearch] = useState("");
  const [planPage, setPlanPage] = useState(1);
  const [planFavoriteFilter, setPlanFavoriteFilter] =
    useState("all");
  const [planTotalCount, setPlanTotalCount] =
    useState(0);
  const [plansLoading, setPlansLoading] =
    useState(false);
  const planSearchTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const plansRequestRef = useRef(0);
  const [selectedPlan, setSelectedPlan] =
    useState<SavedPlan | null>(null);

  // Shopping Lists
  const [shoppingSearch, setShoppingSearch] = useState("");
  const [shoppingPage, setShoppingPage] = useState(1);
  const [shoppingTotalCount, setShoppingTotalCount] =
    useState(0);
  const [shoppingLoading, setShoppingLoading] =
    useState(false);
  const shoppingSearchTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const shoppingRequestRef = useRef(0);
  const [selectedShoppingList, setSelectedShoppingList] =
    useState<ShoppingList | null>(null);

  const pageSize = 10;

  useEffect(() => {
    loadAdminData();
  }, []);

  // Who is the logged-in admin? Used to protect their own role.
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        setCurrentUserId(data.user?.id ?? null);
      })
      .catch(() => {
        setCurrentUserId(null);
      });
  }, []);

  // Clear any pending search timer when leaving the page.
  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }

      if (planSearchTimer.current) {
        clearTimeout(planSearchTimer.current);
      }

      if (shoppingSearchTimer.current) {
        clearTimeout(shoppingSearchTimer.current);
      }

      if (auditSearchTimer.current) {
        clearTimeout(auditSearchTimer.current);
      }
    };
  }, []);

  async function loadUsersPage(
    page = userPage,
    search = userSearch,
    role = userRoleFilter
  ) {
    // Only the newest request is allowed to update the screen.
    const requestId = ++usersRequestRef.current;

    setUsersLoading(true);

    try {
      const {
        data,
        error: usersError,
      } = await supabase.rpc(
        "admin_get_users_paginated",
        {
          p_page: page,
          p_page_size: pageSize,
          p_search: search.trim(),
          p_role: role,
        }
      );

      if (requestId !== usersRequestRef.current) {
        return;
      }

      if (usersError) {
        throw new Error(usersError.message);
      }

      const loadedUsers =
        (data || []) as (AdminUser & {
          total_count: number;
        })[];

      setUsers(
        loadedUsers.map(
          ({
            total_count,
            ...user
          }) => user
        )
      );

      setUserTotalCount(
        loadedUsers.length > 0
          ? Number(
            loadedUsers[0].total_count
          )
          : 0
      );
    } catch (err) {
      if (requestId !== usersRequestRef.current) {
        return;
      }

      setUsers([]);

      setUserTotalCount(0);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load users."
      );
    } finally {
      if (requestId === usersRequestRef.current) {
        setUsersLoading(false);
      }
    }
  }

  // Highlight the quick-nav icon of the section being viewed.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    navSections.forEach((section) => {
      const element = document.getElementById(section.id);

      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  function scrollToSection(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  /*
   * ACTIVITY LOG: server-side search + pagination
   */
  async function loadAuditLogsPage(
    page = auditPage,
    search = auditSearch
  ) {
    // Only the newest request is allowed to update the screen.
    const requestId = ++auditRequestRef.current;

    setAuditLoading(true);

    try {
      const {
        data,
        error: auditError,
      } = await supabase.rpc(
        "admin_get_audit_logs",
        {
          p_page: page,
          p_page_size: 20,
          p_search: search.trim(),
        }
      );

      if (requestId !== auditRequestRef.current) {
        return;
      }

      if (auditError) {
        throw new Error(auditError.message);
      }

      const loadedLogs =
        (data || []) as AuditLog[];

      setAuditLogs(
        loadedLogs.map(
          ({ total_count, ...log }) => log
        )
      );

      setAuditTotalCount(
        loadedLogs.length > 0
          ? Number(
            loadedLogs[0].total_count ?? 0
          )
          : 0
      );
    } catch (err) {
      if (requestId !== auditRequestRef.current) {
        return;
      }

      setAuditLogs([]);
      setAuditTotalCount(0);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load activity logs."
      );
    } finally {
      if (requestId === auditRequestRef.current) {
        setAuditLoading(false);
      }
    }
  }

  /*
   * RECENT ACTIVITY (latest 5 entries for the overview card)
   */
  async function loadRecentActivity() {
    try {
      const {
        data,
        error: recentError,
      } = await supabase.rpc(
        "admin_get_audit_logs",
        {
          p_page: 1,
          p_page_size: 5,
          p_search: "",
        }
      );

      if (recentError) {
        throw new Error(recentError.message);
      }

      const rows = (data || []) as AuditLog[];

      setRecentActivity(
        rows.map(
          ({ total_count, ...log }) => log
        )
      );
    } catch {
      // Non-critical: the overview card just stays empty.
      setRecentActivity([]);
    }
  }

  function handleAuditSearchChange(value: string) {
    setAuditSearch(value);
    setAuditPage(1);

    if (auditSearchTimer.current) {
      clearTimeout(auditSearchTimer.current);
    }

    // Debounce: wait until the admin stops typing.
    auditSearchTimer.current = setTimeout(() => {
      loadAuditLogsPage(1, value);
    }, 400);
  }

  function clearAuditSearch() {
    if (auditSearchTimer.current) {
      clearTimeout(auditSearchTimer.current);
    }

    setAuditSearch("");
    setAuditPage(1);

    loadAuditLogsPage(1, "");
  }

  function handleAuditPageChange(page: number) {
    setAuditPage(page);

    loadAuditLogsPage(page, auditSearch);
  }

  function refreshAuditLogs() {
    if (auditSearchTimer.current) {
      clearTimeout(auditSearchTimer.current);
    }

    loadAuditLogsPage(auditPage, auditSearch);
    loadRecentActivity();
  }

  /*
   * USER STATISTICS
   *
   * Uses the same paginated RPC with page size 1,
   * only to read the database total for each role.
   */
  async function loadUserStats() {
    try {
      const fetchCount = async (role: string) => {
        const {
          data,
          error: statsError,
        } = await supabase.rpc(
          "admin_get_users_paginated",
          {
            p_page: 1,
            p_page_size: 1,
            p_search: "",
            p_role: role,
          }
        );

        if (statsError) {
          throw new Error(statsError.message);
        }

        const rows = (data || []) as {
          total_count: number;
        }[];

        return rows.length > 0
          ? Number(rows[0].total_count)
          : 0;
      };

      const [total, admins, normalUsers] =
        await Promise.all([
          fetchCount("all"),
          fetchCount("admin"),
          fetchCount("user"),
        ]);

      setUserStats({
        total,
        admins,
        normalUsers,
      });
    } catch {
      // Statistics are non-critical; the table still works.
    }
  }

  async function loadAdminData() {
    setLoading(true);
    setError("");

    try {
      /*
       * FEATURE FLAGS
       */
      const {
        data: featureData,
        error: featureError,
      } = await supabase.rpc(
        "admin_get_feature_flags"
      );

      if (featureError) {
        throw new Error(
          featureError.message
        );
      }

      const loadedFeatures =
        (featureData || []) as FeatureFlag[];

      setFeatures(loadedFeatures);

      /*
       * USERS
       *
       * Users are now loaded with
       * server-side pagination.
       */
      const usersFeatureEnabled =
        loadedFeatures.some(
          (feature) =>
            feature.feature_name ===
            "users" &&
            feature.enabled
        );

      let loadedUsersCount = 0;

      if (usersFeatureEnabled) {
        const {
          data: usersData,
          error: usersError,
        } = await supabase.rpc(
          "admin_get_users_paginated",
          {
            p_page: 1,
            p_page_size: pageSize,
            p_search: "",
            p_role: "all",
          }
        );

        if (usersError) {
          throw new Error(
            usersError.message
          );
        }

        const loadedUsers =
          (usersData || []) as (AdminUser & {
            total_count: number;
          })[];

        setUsers(
          loadedUsers.map(
            ({
              total_count,
              ...user
            }) => user
          )
        );

        loadedUsersCount =
          loadedUsers.length > 0
            ? Number(
              loadedUsers[0].total_count
            )
            : 0;

        setUserTotalCount(
          loadedUsersCount
        );

        setUserPage(1);
        setUserSearch("");
        setUserRoleFilter("all");

        loadUserStats();
      } else {
        setUsers([]);
        setUserTotalCount(0);
        setUserStats({
          total: 0,
          admins: 0,
          normalUsers: 0,
        });
      }

      /*
       * SAVED PLANS
       *
       * Saved plans are now loaded with
       * server-side pagination.
       */
      const savedPlansFeatureEnabled =
        loadedFeatures.some(
          (feature) =>
            feature.feature_name ===
            "saved_plans" &&
            feature.enabled
        );

      let loadedPlansCount = 0;

      if (savedPlansFeatureEnabled) {
        const {
          data: plansData,
          error: plansError,
        } = await supabase.rpc(
          "admin_get_saved_plans_paginated",
          {
            p_page: 1,
            p_page_size: pageSize,
            p_search: "",
            p_favorite: "all",
          }
        );

        if (plansError) {
          throw new Error(
            plansError.message
          );
        }

        const loadedPlans =
          (plansData || []) as (SavedPlan & {
            total_count: number;
          })[];

        setSavedPlans(
          loadedPlans.map(
            ({
              total_count,
              ...plan
            }) => plan
          )
        );

        loadedPlansCount =
          loadedPlans.length > 0
            ? Number(
              loadedPlans[0].total_count
            )
            : 0;

        setPlanTotalCount(
          loadedPlansCount
        );

        setPlanPage(1);
        setPlanSearch("");
        setPlanFavoriteFilter("all");
      } else {
        setSavedPlans([]);
        setPlanTotalCount(0);
      }

      /*
       * SHOPPING LISTS
       *
       * Shopping lists are now loaded with
       * server-side pagination. The feature can
       * intentionally be OFF, so a failed or
       * skipped load never breaks the dashboard.
       */
      const shoppingListsFeatureEnabled =
        loadedFeatures.some(
          (feature) =>
            feature.feature_name ===
            "shopping_lists" &&
            feature.enabled
        );

      let loadedShoppingListsCount = 0;

      if (shoppingListsFeatureEnabled) {
        const {
          data: shoppingListsData,
          error: shoppingListsError,
        } = await supabase.rpc(
          "admin_get_shopping_lists_paginated",
          {
            p_page: 1,
            p_page_size: pageSize,
            p_search: "",
          }
        );

        const loadedShoppingLists = shoppingListsError
          ? []
          : ((shoppingListsData || []) as (ShoppingList & {
            total_count: number;
          })[]);

        setShoppingLists(
          loadedShoppingLists.map(
            ({
              total_count,
              ...list
            }) => list
          )
        );

        loadedShoppingListsCount =
          loadedShoppingLists.length > 0
            ? Number(
              loadedShoppingLists[0].total_count
            )
            : 0;

        setShoppingTotalCount(
          loadedShoppingListsCount
        );

        setShoppingPage(1);
        setShoppingSearch("");
      } else {
        setShoppingLists([]);
        setShoppingTotalCount(0);
      }

      /*
       * STATS
       *
       * Users count now comes from
       * the database total count.
       */
      setStats({
        users: loadedUsersCount,
        savedPlans: loadedPlansCount,
        shoppingLists: loadedShoppingListsCount,
      });

      /*
       * DASHBOARD ANALYTICS
       */
      await loadDashboardAnalytics();

      /*
       * ACTIVITY LOG
       */
      setAuditPage(1);
      setAuditSearch("");

      await loadAuditLogsPage(1, "");
      await loadRecentActivity();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * SAVED PLANS: server-side search + favorite filter + pagination
   */
  async function loadSavedPlansPage(
    page = planPage,
    search = planSearch,
    favorite = planFavoriteFilter
  ) {
    // Only the newest request is allowed to update the screen.
    const requestId = ++plansRequestRef.current;

    setPlansLoading(true);

    try {
      const {
        data,
        error: plansError,
      } = await supabase.rpc(
        "admin_get_saved_plans_paginated",
        {
          p_page: page,
          p_page_size: pageSize,
          p_search: search.trim(),
          p_favorite: favorite,
        }
      );

      if (requestId !== plansRequestRef.current) {
        return;
      }

      if (plansError) {
        throw new Error(plansError.message);
      }

      const loadedPlans =
        (data || []) as (SavedPlan & {
          total_count: number;
        })[];

      setSavedPlans(
        loadedPlans.map(
          ({
            total_count,
            ...plan
          }) => plan
        )
      );

      setPlanTotalCount(
        loadedPlans.length > 0
          ? Number(
            loadedPlans[0].total_count
          )
          : 0
      );
    } catch (err) {
      if (requestId !== plansRequestRef.current) {
        return;
      }

      setSavedPlans([]);
      setPlanTotalCount(0);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load saved plans."
      );
    } finally {
      if (requestId === plansRequestRef.current) {
        setPlansLoading(false);
      }
    }
  }

  function handlePlanSearchChange(value: string) {
    setPlanSearch(value);
    setPlanPage(1);

    if (planSearchTimer.current) {
      clearTimeout(planSearchTimer.current);
    }

    // Debounce: wait until the admin stops typing.
    planSearchTimer.current = setTimeout(() => {
      loadSavedPlansPage(
        1,
        value,
        planFavoriteFilter
      );
    }, 400);
  }

  function clearPlanSearch() {
    if (planSearchTimer.current) {
      clearTimeout(planSearchTimer.current);
    }

    setPlanSearch("");
    setPlanPage(1);

    loadSavedPlansPage(
      1,
      "",
      planFavoriteFilter
    );
  }

  function handlePlanFavoriteChange(value: string) {
    if (planSearchTimer.current) {
      clearTimeout(planSearchTimer.current);
    }

    setPlanFavoriteFilter(value);
    setPlanPage(1);

    loadSavedPlansPage(
      1,
      planSearch,
      value
    );
  }

  function clearPlanFilters() {
    if (planSearchTimer.current) {
      clearTimeout(planSearchTimer.current);
    }

    setPlanSearch("");
    setPlanFavoriteFilter("all");
    setPlanPage(1);

    loadSavedPlansPage(1, "", "all");
  }

  function handlePlanPageChange(page: number) {
    setPlanPage(page);

    loadSavedPlansPage(
      page,
      planSearch,
      planFavoriteFilter
    );
  }

  function refreshPlans() {
    if (planSearchTimer.current) {
      clearTimeout(planSearchTimer.current);
    }

    loadSavedPlansPage(
      planPage,
      planSearch,
      planFavoriteFilter
    );
  }

  /*
   * DASHBOARD ANALYTICS
   */
  async function loadDashboardAnalytics() {
    setAnalyticsLoading(true);

    try {
      const {
        data,
        error: analyticsError,
      } = await supabase.rpc(
        "admin_get_dashboard_analytics"
      );

      if (analyticsError) {
        throw new Error(analyticsError.message);
      }

      const row =
        Array.isArray(data) && data.length > 0
          ? data[0]
          : null;

      setAnalytics(
        row as DashboardAnalytics | null
      );
    } catch (err) {
      setAnalytics(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard analytics."
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }

  /*
   * SHOPPING LISTS: server-side search + pagination
   */
  async function loadShoppingListsPage(
    page = shoppingPage,
    search = shoppingSearch
  ) {
    // Only the newest request is allowed to update the screen.
    const requestId = ++shoppingRequestRef.current;

    setShoppingLoading(true);

    try {
      const {
        data,
        error: listsError,
      } = await supabase.rpc(
        "admin_get_shopping_lists_paginated",
        {
          p_page: page,
          p_page_size: pageSize,
          p_search: search.trim(),
        }
      );

      if (requestId !== shoppingRequestRef.current) {
        return;
      }

      if (listsError) {
        throw new Error(listsError.message);
      }

      const loadedLists =
        (data || []) as (ShoppingList & {
          total_count: number;
        })[];

      setShoppingLists(
        loadedLists.map(
          ({
            total_count,
            ...list
          }) => list
        )
      );

      setShoppingTotalCount(
        loadedLists.length > 0
          ? Number(loadedLists[0].total_count)
          : 0
      );
    } catch (err) {
      if (requestId !== shoppingRequestRef.current) {
        return;
      }

      setShoppingLists([]);
      setShoppingTotalCount(0);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load shopping lists."
      );
    } finally {
      if (requestId === shoppingRequestRef.current) {
        setShoppingLoading(false);
      }
    }
  }

  function handleShoppingSearchChange(value: string) {
    setShoppingSearch(value);
    setShoppingPage(1);

    if (shoppingSearchTimer.current) {
      clearTimeout(shoppingSearchTimer.current);
    }

    // Debounce: wait until the admin stops typing.
    shoppingSearchTimer.current = setTimeout(() => {
      loadShoppingListsPage(1, value);
    }, 400);
  }

  function clearShoppingSearch() {
    if (shoppingSearchTimer.current) {
      clearTimeout(shoppingSearchTimer.current);
    }

    setShoppingSearch("");
    setShoppingPage(1);

    loadShoppingListsPage(1, "");
  }

  function handleShoppingPageChange(page: number) {
    setShoppingPage(page);

    loadShoppingListsPage(
      page,
      shoppingSearch
    );
  }

  function refreshShoppingLists() {
    if (shoppingSearchTimer.current) {
      clearTimeout(shoppingSearchTimer.current);
    }

    loadShoppingListsPage(
      shoppingPage,
      shoppingSearch
    );
  }

  /*
   * USERS: SEARCH / FILTER / PAGE / REFRESH HANDLERS
   */
  function handleUserSearchChange(value: string) {
    setUserSearch(value);
    setUserPage(1);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    // Debounce: wait until the admin stops typing.
    searchTimer.current = setTimeout(() => {
      loadUsersPage(1, value, userRoleFilter);
    }, 400);
  }

  function clearUserSearch() {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    setUserSearch("");
    setUserPage(1);

    loadUsersPage(1, "", userRoleFilter);
  }

  function handleRoleFilterChange(role: string) {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    setUserRoleFilter(role);
    setUserPage(1);

    loadUsersPage(1, userSearch, role);
  }

  function clearUserFilters() {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    setUserSearch("");
    setUserRoleFilter("all");
    setUserPage(1);

    loadUsersPage(1, "", "all");
  }

  function handleUserPageChange(page: number) {
    setUserPage(page);

    loadUsersPage(
      page,
      userSearch,
      userRoleFilter
    );
  }

  function refreshUsers() {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    loadUsersPage(
      userPage,
      userSearch,
      userRoleFilter
    );

    loadUserStats();
  }

  /*
   * FEATURE TOGGLE
   */
  async function toggleFeature(feature: FeatureFlag) {
    setUpdating(feature.feature_name);
    setError("");

    try {
      const {
        data,
        error: updateError,
      } = await supabase.rpc(
        "admin_update_feature_flag",
        {
          p_feature_name: feature.feature_name,
          p_enabled: !feature.enabled,
        }
      );

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!data) {
        throw new Error(
          "Feature flag was not updated."
        );
      }

      setFeatures((current) =>
        current.map((item) =>
          item.feature_name === feature.feature_name
            ? {
              ...item,
              enabled: data.enabled,
            }
            : item
        )
      );

      // Record the feature toggle in the Activity Log.
      const { error: auditError } = await supabase.rpc(
        "admin_create_audit_log",
        {
          p_action: data.enabled
            ? "feature_enabled"
            : "feature_disabled",
          p_entity_type: "feature_flag",
          p_entity_id: null,
          p_details: {
            feature_name: feature.feature_name,
            enabled: data.enabled,
          },
        }
      );

      if (auditError) {
        console.error(
          "Feature toggle audit log failed:",
          auditError.message
        );
      }

      // loadAdminData also reloads the Activity Log.
      await loadAdminData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update feature flag."
      );
    } finally {
      setUpdating(null);
    }
  }

  /*
   * UPDATE USER PROFILE
   */
  async function saveUserProfile(
    user: AdminUser,
    values: {
      full_name: string;
      country: string;
      region: string;
      budget_level: string;
      role: string;
    }
  ) {
    setSavingUser(true);
    setError("");

    try {
      /*
       * Admin role protection:
       * an admin cannot change their own role.
       */
      const isSelf = user.id === currentUserId;

      const oldRole =
        user.role === "admin"
          ? "admin"
          : "user";

      const newRole =
        values.role === "admin"
          ? "admin"
          : "user";

      const roleChanged =
        newRole !== oldRole;

      if (isSelf && roleChanged) {
        throw new Error(
          "You cannot change your own role."
        );
      }

      /*
       * Update profile information
       */
      const {
        data: profileData,
        error: profileError,
      } = await supabase.rpc(
        "admin_update_user_profile",
        {
          p_user_id: user.id,
          p_full_name:
            values.full_name.trim() || null,
          p_country:
            values.country.trim() || null,
          p_region:
            values.region.trim() || null,
          p_budget_level:
            values.budget_level.trim() || null,
        }
      );

      if (profileError) {
        throw new Error(profileError.message);
      }

      /*
       * Update role separately
       * (skipped for your own account)
       */
      let roleData: { role?: string } | null = null;

      if (!isSelf) {
        const {
          data: roleResult,
          error: roleError,
        } = await supabase.rpc(
          "admin_update_user_role",
          {
            p_user_id: user.id,
            p_role: newRole,
          }
        );

        if (roleError) {
          throw new Error(roleError.message);
        }

        roleData = roleResult;
      }

      const updatedUser: AdminUser = {
        ...user,

        full_name:
          profileData?.full_name ??
          (values.full_name.trim() || null),

        country:
          profileData?.country ??
          (values.country.trim() || null),

        region:
          profileData?.region ??
          (values.region.trim() || null),

        budget_level:
          profileData?.budget_level ??
          (values.budget_level.trim() || null),

        role:
          roleData?.role ??
          newRole,

        updated_at:
          profileData?.updated_at ??
          new Date().toISOString(),
      };

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id
            ? updatedUser
            : item
        )
      );

      setSelectedUser(updatedUser);
      setEditingUser(null);

      /*
       * Create audit log
       *
       * This records that an admin updated
       * this user's profile.
       */
      const { error: auditError } =
        await supabase.rpc(
          "admin_create_audit_log",
          {
            p_action: roleChanged
              ? "user_profile_and_role_updated"
              : "user_profile_updated",

            p_entity_type: "user",

            p_entity_id: user.id,

            p_details: {
              user_id: user.id,
              old_role: oldRole,
              new_role: newRole,
              role_changed: roleChanged,
              full_name:
                updatedUser.full_name,
              country:
                updatedUser.country,
              region:
                updatedUser.region,
              budget_level:
                updatedUser.budget_level,
            },
          }
        );

      /*
       * Do not fail the user update if
       * audit logging has a problem.
       */
      if (auditError) {
        console.error(
          "Audit log failed:",
          auditError.message
        );
      }

      /*
       * Refresh users and statistics.
       */
      loadUsersPage(
        userPage,
        userSearch,
        userRoleFilter
      );

      loadUserStats();

      /*
       * Refresh Activity Log immediately
       * (newest entries are on page 1).
       */
      setAuditPage(1);

      loadAuditLogsPage(1, auditSearch);
      loadRecentActivity();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user."
      );
    } finally {
      setSavingUser(false);
    }
  }

  /*
   * USERS (server-side search + pagination)
   *
   * `users` already arrives filtered and paginated
   * from the database, so no client-side filtering.
   */
  const filteredUsers = users;

  const currentUserPage = userPage;

  const userTotalPages = Math.max(
    1,
    Math.ceil(
      userTotalCount / pageSize
    )
  );

  const paginatedUsers = users;

  const hasActiveUserFilters =
    userSearch.trim() !== "" ||
    userRoleFilter !== "all";

  /*
   * SAVED PLANS (server-side search + pagination)
   *
   * `savedPlans` already arrives filtered and paginated
   * from the database, so no client-side filtering.
   */
  const filteredPlans = savedPlans;

  const currentPlanPage = planPage;

  const planTotalPages = Math.max(
    1,
    Math.ceil(
      planTotalCount / pageSize
    )
  );

  const paginatedPlans = savedPlans;

  const hasActivePlanFilters =
    planSearch.trim() !== "" ||
    planFavoriteFilter !== "all";

  /*
   * SHOPPING LISTS (server-side search + pagination)
   *
   * `shoppingLists` already arrives filtered and paginated
   * from the database, so no client-side filtering.
   */
  const filteredShoppingLists = shoppingLists;

  const currentShoppingPage = shoppingPage;

  const shoppingTotalPages = Math.max(
    1,
    Math.ceil(
      shoppingTotalCount / pageSize
    )
  );

  const paginatedShoppingLists = shoppingLists;

  const hasActiveShoppingSearch =
    shoppingSearch.trim() !== "";

  /*
   * FEATURE ORDER
   */
  const featureOrder = [
    "users",
    "saved_plans",
    "shopping_lists",
  ];

  const sortedFeatures = [...features].sort(
    (a, b) =>
      featureOrder.indexOf(
        a.feature_name
      ) -
      featureOrder.indexOf(
        b.feature_name
      )
  );

  /*
   * CHECK USERS FEATURE
   */
  const usersFeatureEnabled =
    features.find(
      (feature) =>
        feature.feature_name === "users"
    )?.enabled ?? false;

  /*
   * CHECK SAVED PLANS FEATURE
   */
  const savedPlansEnabled =
    features.find(
      (feature) =>
        feature.feature_name === "saved_plans"
    )?.enabled ?? false;

  /*
   * CHECK SHOPPING LISTS FEATURE
   */
  const shoppingListsEnabled =
    features.find(
      (feature) =>
        feature.feature_name === "shopping_lists"
    )?.enabled ?? false;

  return (
    <main className="relative min-h-screen bg-[#090b12] p-4 text-slate-200 sm:p-6">
      <AdminStyles />

      {/* BACKGROUND GLOW */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 overflow-hidden"
      >
        <div className="lp-float absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/25 blur-[120px]" />
        <div className="lp-float-slow absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-[130px]" />
        <div className="lp-float absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="lp-fade-up mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="lp-pulse-glow flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 text-xl shadow-lg">
                🍽️
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  Admin Dashboard
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Manage LocalPlate features and monitor application data.
                </p>
              </div>

            </div>

            <div className="flex flex-wrap items-center gap-3">

              <button
                onClick={loadAdminData}
                disabled={loading}
                className={`${primaryButtonClass} group inline-flex items-center justify-center gap-2`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 ${loading ? "lp-spin" : "transition-transform duration-500 group-hover:rotate-180"}`}
                >
                  <path d="M21 12a9 9 0 1 1-3-6.7" />
                  <path d="M21 3v6h-6" />
                </svg>
                {loading
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

            </div>

          </div>
        </div>

        {/* QUICK NAV */}
        <div className="sticky top-24 z-30 mb-6 flex justify-center">
          <QuickNav
            active={activeSection}
            onNavigate={scrollToSection}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="lp-shake mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-[0_0_24px_rgba(239,68,68,0.15)]">
            <span aria-hidden>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* OVERVIEW */}
        <section id="overview" className="scroll-mt-28">

          {/* KPI CARDS */}
          {analyticsLoading && !analytics ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="lp-shimmer h-44 rounded-3xl"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <KpiCard
                title="Total Users"
                icon="users"
                value={
                  analytics
                    ? Number(analytics.total_users)
                    : stats.users
                }
                pill={{
                  text: `+${Number(analytics?.users_last_7_days ?? 0)} this week`,
                  tone:
                    Number(analytics?.users_last_7_days ?? 0) > 0
                      ? "up"
                      : "flat",
                }}
                hint={
                  analytics
                    ? `${Number(analytics.total_admins)} admins · ${Math.max(0, Number(analytics.total_users) - Number(analytics.total_admins))} normal users`
                    : "Users available to the admin system"
                }
                delay={0}
              />

              <KpiCard
                title="Saved Plans"
                icon="clipboard"
                value={
                  analytics
                    ? Number(analytics.total_saved_plans)
                    : stats.savedPlans
                }
                pill={{
                  text: `+${Number(analytics?.plans_last_7_days ?? 0)} this week`,
                  tone:
                    Number(analytics?.plans_last_7_days ?? 0) > 0
                      ? "up"
                      : "flat",
                }}
                hint={
                  analytics
                    ? `${Number(analytics.total_favorite_plans)} marked favorite`
                    : "Saved meal plans"
                }
                delay={70}
              />

              <KpiCard
                title="Favorite Plans"
                icon="star"
                value={
                  analytics
                    ? Number(analytics.total_favorite_plans)
                    : 0
                }
                pill={
                  analytics &&
                    Number(analytics.total_saved_plans) > 0
                    ? {
                      text: `${Math.round(
                        (Number(analytics.total_favorite_plans) /
                          Number(analytics.total_saved_plans)) *
                        100
                      )}% of plans`,
                      tone:
                        Number(analytics.total_favorite_plans) > 0
                          ? "up"
                          : "flat",
                    }
                    : undefined
                }
                hint="Currently marked favorite"
                delay={140}
              />

              <KpiCard
                title="Shopping Lists"
                icon="cart"
                value={
                  analytics
                    ? Number(analytics.total_shopping_lists)
                    : stats.shoppingLists
                }
                pill={{
                  text: `+${Number(analytics?.lists_last_7_days ?? 0)} this week`,
                  tone:
                    Number(analytics?.lists_last_7_days ?? 0) > 0
                      ? "up"
                      : "flat",
                }}
                hint="Total shopping lists"
                delay={210}
              />

            </div>
          )}

          {/* CHART + RECENT ACTIVITY */}
          <div className="mt-5 grid gap-5 lg:grid-cols-3">

            {/* PLATFORM OVERVIEW CHART */}
            <div className="lp-fade-up rounded-3xl border border-white/[0.06] bg-[#11141d] p-6 lg:col-span-2">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <h2 className="text-xl font-semibold text-white">
                    Platform Overview
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Live counts from your database
                  </p>

                </div>

                <div
                  role="group"
                  aria-label="Chart range"
                  className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1"
                >
                  {(
                    [
                      { value: "totals", label: "Totals" },
                      { value: "week", label: "Last 7 days" },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setChartMode(option.value)
                      }
                      aria-pressed={
                        chartMode === option.value
                      }
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition duration-200 ${chartMode === option.value
                        ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

              </div>

              <div className="mt-6">

                {analyticsLoading && !analytics ? (
                  <div className="lp-shimmer h-64 rounded-2xl" />
                ) : analytics ? (
                  <BlockChart
                    key={chartMode}
                    data={
                      chartMode === "totals"
                        ? [
                          {
                            label: "Users",
                            value: Number(analytics.total_users),
                          },
                          {
                            label: "Admins",
                            value: Number(analytics.total_admins),
                          },
                          {
                            label: "Plans",
                            value: Number(analytics.total_saved_plans),
                          },
                          {
                            label: "Favorites",
                            value: Number(analytics.total_favorite_plans),
                          },
                          {
                            label: "Lists",
                            value: Number(analytics.total_shopping_lists),
                          },
                        ]
                        : [
                          {
                            label: "New users",
                            value: Number(analytics.users_last_7_days),
                          },
                          {
                            label: "New plans",
                            value: Number(analytics.plans_last_7_days),
                          },
                          {
                            label: "New lists",
                            value: Number(analytics.lists_last_7_days),
                          },
                        ]
                    }
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 text-sm text-slate-400">
                    Analytics unavailable.
                  </div>
                )}

              </div>

            </div>

            {/* RECENT ACTIVITY */}
            <div className="lp-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-b from-violet-400 via-violet-500 to-violet-700 p-5 text-white shadow-[0_0_60px_rgba(139,92,246,0.35)]">

              <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/20 blur-3xl" />

              <div className="relative flex items-start justify-between gap-3">

                <div>

                  <h2 className="text-xl font-semibold">
                    Recent Activity
                  </h2>

                  <p className="mt-1 text-sm text-white/75">
                    Latest administrative actions
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    scrollToSection("activity")
                  }
                  className="shrink-0 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white transition duration-200 hover:bg-white/25 active:scale-95"
                >
                  View all
                </button>

              </div>

              <div className="relative mt-5 space-y-3">

                {loading &&
                  recentActivity.length === 0 ? (
                  [0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-[68px] animate-pulse rounded-2xl bg-white/15"
                    />
                  ))
                ) : recentActivity.length === 0 ? (
                  <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-8 text-center text-sm text-white/80">
                    No recent activity yet.
                  </div>
                ) : (
                  recentActivity.map(
                    (log, index) => {
                      const meta =
                        recentActivityMeta(log);

                      return (
                        <div
                          key={log.id}
                          className="lp-row flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md transition duration-200 hover:bg-white/20"
                          style={{
                            animationDelay: `${index * 60}ms`,
                          }}
                        >

                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold shadow-lg ${meta.negative
                              ? "bg-orange-600 text-white"
                              : "bg-lime-400 text-[#10200a]"
                              }`}
                          >
                            {meta.negative ? "!" : "✓"}
                          </span>

                          <div className="min-w-0 flex-1">

                            <p className="truncate text-sm font-semibold">
                              {log.action
                                .replace(/_/g, " ")
                                .replace(
                                  /\b\w/g,
                                  (char) =>
                                    char.toUpperCase()
                                )}
                            </p>

                            <p className="mt-0.5 truncate text-xs capitalize text-white/70">
                              {meta.sub}
                            </p>

                          </div>

                          <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90">
                            {formatRelativeTime(
                              log.created_at
                            )}
                          </span>

                        </div>
                      );
                    }
                  )
                )}

              </div>

            </div>

          </div>

        </section>

        {/* FEATURE MANAGEMENT */}
        <section
          id="features"
          className={`${sectionClass} scroll-mt-28`}
        >

          <SectionHeader
            title="Feature Management"
            subtitle="Enable or disable application features from Supabase."
          />

          <div className="divide-y divide-white/5">

            {loading ? (
              <div className="space-y-4 px-6 py-6">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="lp-shimmer h-14 rounded-xl"
                  />
                ))}
              </div>
            ) : sortedFeatures.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-400">
                No feature flags found.
              </div>
            ) : (
              sortedFeatures.map((feature) => (
                <FeatureRow
                  key={feature.feature_name}
                  feature={feature}
                  updating={
                    updating ===
                    feature.feature_name
                  }
                  onToggle={() =>
                    toggleFeature(feature)
                  }
                />
              ))
            )}

          </div>

        </section>

        {/* USERS */}
        <section
          id="users"
          className={`${sectionClass} scroll-mt-28`}
        >

          <SectionHeader
            title="Users"
            subtitle="Manage registered users and their profiles."
            right={
              <button
                type="button"
                onClick={refreshUsers}
                disabled={
                  !usersFeatureEnabled ||
                  usersLoading
                }
                className={`${ghostButtonClass} inline-flex items-center justify-center gap-2 !px-4 !py-2.5 !text-sm`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 ${usersLoading ? "lp-spin" : ""}`}
                >
                  <path d="M21 12a9 9 0 1 1-3-6.7" />
                  <path d="M21 3v6h-6" />
                </svg>
                {usersLoading
                  ? "Refreshing..."
                  : "Refresh Users"}
              </button>
            }
          />

          {!usersFeatureEnabled ? (
            <div className="px-6 py-14 text-center">

              <div className="lp-pulse-glow mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl">
                🔒
              </div>

              <p className="mt-4 font-semibold text-slate-100">
                User Management is disabled
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                Turn on the Users feature above to view and manage registered users.
              </p>

            </div>
          ) : (
            <>
              {/* USER STATISTICS */}
              <div className="grid gap-3 border-b border-white/10 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">

                <UserStatTile
                  label="Total users"
                  value={userStats.total}
                  hint="All registered accounts"
                  tone="indigo"
                />

                <UserStatTile
                  label="Admins"
                  value={userStats.admins}
                  hint="Full dashboard access"
                  tone="violet"
                />

                <UserStatTile
                  label="Normal users"
                  value={userStats.normalUsers}
                  hint="Standard accounts"
                  tone="sky"
                />

                <UserStatTile
                  label="Current results"
                  value={userTotalCount}
                  hint={
                    hasActiveUserFilters
                      ? "Matching your filters"
                      : "No filters applied"
                  }
                  tone="emerald"
                />

              </div>

              {/* SEARCH + ROLE FILTER */}
              <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">

                <div className="relative w-full lg:max-w-md">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>

                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) =>
                      handleUserSearchChange(
                        e.target.value
                      )
                    }
                    placeholder="Search name, email, country, region or ID..."
                    className={searchInputClass}
                  />

                  {userSearch && (
                    <button
                      type="button"
                      onClick={clearUserSearch}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      ✕
                    </button>
                  )}

                </div>

                <RoleFilter
                  value={userRoleFilter}
                  onChange={handleRoleFilterChange}
                  counts={userStats}
                />

              </div>

              {(loading || usersLoading) &&
                users.length === 0 ? (
                <div className="space-y-3 px-6 py-6">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="lp-shimmer h-14 rounded-xl"
                    />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="px-6 py-12 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg">
                    🔎
                  </div>

                  <p className="mt-4 font-medium text-slate-100">
                    {hasActiveUserFilters
                      ? "No users match your search"
                      : "No users found."}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {hasActiveUserFilters
                      ? "Try a different search term or role filter."
                      : "Registered users will appear here."}
                  </p>

                  {hasActiveUserFilters && (
                    <button
                      type="button"
                      onClick={clearUserFilters}
                      className={`${ghostButtonClass} mt-5 !px-4 !py-2.5 !text-sm`}
                    >
                      Clear filters
                    </button>
                  )}

                </div>
              ) : (
                <>
                  <div
                    className={`overflow-x-auto transition-opacity duration-200 ${usersLoading ? "opacity-50" : "opacity-100"}`}
                  >

                    <table className="w-full min-w-[1100px] text-left">

                      <thead className="bg-white/[0.03]">

                        <tr className="border-b border-white/10">

                          <TableHeader text="User" />
                          <TableHeader text="Email" />
                          <TableHeader text="Country / Region" />
                          <TableHeader text="Budget" />
                          <TableHeader text="Role" />
                          <TableHeader text="Created" />
                          <TableHeader text="Action" />

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-white/5">

                        {paginatedUsers.map(
                          (user, index) => (
                            <tr
                              key={user.id}
                              className="lp-row group transition duration-200 hover:bg-violet-500/10"
                              style={{
                                animationDelay: `${index * 40}ms`,
                              }}
                            >

                              <td className="px-5 py-4">

                                <div className="flex max-w-[240px] items-center gap-3">

                                  <Avatar
                                    name={
                                      user.full_name ||
                                      user.email ||
                                      "U"
                                    }
                                  />

                                  <div className="min-w-0">

                                    <p className="flex items-center gap-2 truncate text-sm font-medium text-slate-100">
                                      <span className="truncate">
                                        {user.full_name ||
                                          "Unnamed User"}
                                      </span>

                                      {user.id ===
                                        currentUserId && (
                                          <span className="shrink-0 rounded-full border border-violet-400/30 bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200">
                                            You
                                          </span>
                                        )}
                                    </p>

                                    <p className="mt-1 truncate text-xs text-slate-500">
                                      {user.id}
                                    </p>

                                  </div>

                                </div>

                              </td>

                              <td className="px-5 py-4">

                                <p className="max-w-[220px] truncate text-sm text-slate-300">
                                  {user.email ||
                                    "—"}
                                </p>

                              </td>

                              <td className="px-5 py-4">

                                <p className="text-sm text-slate-300">
                                  {user.country ||
                                    "—"}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                  {user.region ||
                                    "—"}
                                </p>

                              </td>

                              <td className="px-5 py-4 text-sm text-slate-300">
                                {user.budget_level ||
                                  "—"}
                              </td>

                              <td className="px-5 py-4">

                                <RoleBadge
                                  role={
                                    user.role ||
                                    "user"
                                  }
                                />

                              </td>

                              <td className="px-5 py-4 text-sm text-slate-400">
                                {formatDate(
                                  user.created_at
                                )}
                              </td>

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-2">

                                  <button
                                    onClick={() =>
                                      setSelectedUser(
                                        user
                                      )
                                    }
                                    className={ghostButtonClass}
                                  >
                                    View Details
                                  </button>

                                  <button
                                    onClick={() =>
                                      setEditingUser(
                                        user
                                      )
                                    }
                                    className={ghostButtonClass}
                                  >
                                    Edit User
                                  </button>

                                </div>

                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                  <Pagination
                    currentPage={currentUserPage}
                    totalPages={userTotalPages}
                    totalItems={userTotalCount}
                    pageSize={pageSize}
                    onPageChange={
                      handleUserPageChange
                    }
                  />
                </>
              )}
            </>
          )}

        </section>

        {/* SAVED PLANS */}
        <section
          id="plans"
          className={`${sectionClass} scroll-mt-28`}
        >

          <SectionHeader
            title="Saved Plans"
            subtitle="Read-only overview of saved meal plans."
            right={
              <button
                type="button"
                onClick={refreshPlans}
                disabled={
                  !savedPlansEnabled ||
                  plansLoading
                }
                className={`${ghostButtonClass} inline-flex items-center justify-center gap-2 !px-4 !py-2.5 !text-sm`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 ${plansLoading ? "lp-spin" : ""}`}
                >
                  <path d="M21 12a9 9 0 1 1-3-6.7" />
                  <path d="M21 3v6h-6" />
                </svg>
                {plansLoading
                  ? "Refreshing..."
                  : "Refresh Plans"}
              </button>
            }
          />

          {!savedPlansEnabled ? (
            <div className="px-6 py-14 text-center">

              <div className="lp-pulse-glow mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl">
                🔒
              </div>

              <p className="mt-4 font-semibold text-slate-100">
                Saved Plans is disabled
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                Turn on the Saved Plans feature above to view saved meal plans.
              </p>

            </div>
          ) : (
            <>
              {/* SEARCH + FAVORITE FILTER */}
              <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="relative w-full sm:max-w-md">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>

                  <input
                    type="text"
                    value={planSearch}
                    onChange={(e) =>
                      handlePlanSearchChange(
                        e.target.value
                      )
                    }
                    placeholder="Search saved plans..."
                    className={searchInputClass}
                  />

                  {planSearch && (
                    <button
                      type="button"
                      onClick={clearPlanSearch}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      ✕
                    </button>
                  )}

                </div>

                <select
                  value={planFavoriteFilter}
                  onChange={(e) =>
                    handlePlanFavoriteChange(
                      e.target.value
                    )
                  }
                  aria-label="Filter plans by favorite"
                  className={`${inputClass} w-full sm:w-44`}
                >
                  <option
                    value="all"
                    className="bg-[#0e111a] text-slate-100"
                  >
                    All Plans
                  </option>

                  <option
                    value="favorite"
                    className="bg-[#0e111a] text-slate-100"
                  >
                    Favorites
                  </option>

                  <option
                    value="not_favorite"
                    className="bg-[#0e111a] text-slate-100"
                  >
                    Not Favorites
                  </option>
                </select>

              </div>

              {(loading || plansLoading) &&
                savedPlans.length === 0 ? (
                <div className="space-y-3 px-6 py-6">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="lp-shimmer h-14 rounded-xl"
                    />
                  ))}
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="px-6 py-12 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg">
                    🔎
                  </div>

                  <p className="mt-4 font-medium text-slate-100">
                    {hasActivePlanFilters
                      ? "No saved plans match your search"
                      : "No saved plans found."}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {hasActivePlanFilters
                      ? "Try a different search term or filter."
                      : "Saved meal plans will appear here."}
                  </p>

                  {hasActivePlanFilters && (
                    <button
                      type="button"
                      onClick={clearPlanFilters}
                      className={`${ghostButtonClass} mt-5 !px-4 !py-2.5 !text-sm`}
                    >
                      Clear filters
                    </button>
                  )}

                </div>
              ) : (
                <>
                  <div
                    className={`overflow-x-auto transition-opacity duration-200 ${plansLoading ? "opacity-50" : "opacity-100"}`}
                  >

                <table className="w-full min-w-[1100px] text-left">

                  <thead className="bg-white/[0.03]">

                    <tr className="border-b border-white/10">

                      <TableHeader text="Plan" />
                      <TableHeader text="User" />
                      <TableHeader text="City" />
                      <TableHeader text="Diet" />
                      <TableHeader text="Budget" />
                      <TableHeader text="Meal Type" />
                      <TableHeader text="Servings" />
                      <TableHeader text="Created" />
                      <TableHeader text="Action" />

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-white/5">

                    {paginatedPlans.map(
                      (plan, index) => (
                        <tr
                          key={plan.id}
                          className="lp-row transition duration-200 hover:bg-violet-500/10"
                          style={{
                            animationDelay: `${index * 40}ms`,
                          }}
                        >

                          <td className="px-5 py-4">

                            <div className="max-w-[200px]">

                              <p className="truncate text-sm font-medium text-slate-100">
                                {plan.favorite && (
                                  <span className="mr-1 text-amber-300">
                                    ★
                                  </span>
                                )}
                                {plan.plan_type ||
                                  plan.meal_plan ||
                                  "Meal Plan"}
                              </p>

                              <p className="mt-1 truncate text-xs text-slate-500">
                                {plan.id}
                              </p>

                            </div>

                          </td>

                          <td className="px-5 py-4">

                            <p className="max-w-[150px] truncate text-xs text-slate-400">
                              {plan.user_id ||
                                "—"}
                            </p>

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-300">
                            {plan.city || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-300">
                            {plan.diet || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-300">
                            {plan.budget || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-300">
                            {plan.meal_type || "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-300">
                            {plan.servings ?? "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-400">
                            {formatDate(
                              plan.created_at ||
                              plan.saved_at
                            )}
                          </td>

                          <td className="px-5 py-4">

                            <button
                              onClick={() =>
                                setSelectedPlan(
                                  plan
                                )
                              }
                              className={ghostButtonClass}
                            >
                              View Details
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              <Pagination
                currentPage={currentPlanPage}
                totalPages={planTotalPages}
                totalItems={planTotalCount}
                pageSize={pageSize}
                onPageChange={
                  handlePlanPageChange
                }
              />
                </>
              )}
            </>
          )}

        </section>

        {/* SHOPPING LISTS */}
        <section
          id="lists"
          className={`${sectionClass} scroll-mt-28`}
        >

          <SectionHeader
            title="Shopping Lists"
            subtitle="Read-only overview of shopping lists."
            right={
              <button
                type="button"
                onClick={refreshShoppingLists}
                disabled={
                  !shoppingListsEnabled ||
                  shoppingLoading
                }
                className={`${ghostButtonClass} inline-flex items-center justify-center gap-2 !px-4 !py-2.5 !text-sm`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 ${shoppingLoading ? "lp-spin" : ""}`}
                >
                  <path d="M21 12a9 9 0 1 1-3-6.7" />
                  <path d="M21 3v6h-6" />
                </svg>
                {shoppingLoading
                  ? "Refreshing..."
                  : "Refresh Lists"}
              </button>
            }
          />

          {!shoppingListsEnabled ? (
            <div className="px-6 py-14 text-center">

              <div className="lp-pulse-glow mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl">
                🔒
              </div>

              <p className="mt-4 font-semibold text-slate-100">
                Shopping Lists is disabled
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                Turn on the Shopping Lists feature above to view shopping lists.
              </p>

            </div>
          ) : (
            <>
              {/* SEARCH */}
              <div className="border-b border-white/10 px-6 py-4">

                <div className="relative w-full sm:max-w-md">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>

                  <input
                    type="text"
                    value={shoppingSearch}
                    onChange={(e) =>
                      handleShoppingSearchChange(
                        e.target.value
                      )
                    }
                    placeholder="Search shopping lists..."
                    className={searchInputClass}
                  />

                  {shoppingSearch && (
                    <button
                      type="button"
                      onClick={clearShoppingSearch}
                      aria-label="Clear search"
                      className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      ✕
                    </button>
                  )}

                </div>

              </div>

              {(loading || shoppingLoading) &&
                shoppingLists.length === 0 ? (
                <div className="space-y-3 px-6 py-6">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="lp-shimmer h-14 rounded-xl"
                    />
                  ))}
                </div>
              ) : filteredShoppingLists.length === 0 ? (
                <div className="px-6 py-12 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg">
                    🔎
                  </div>

                  <p className="mt-4 font-medium text-slate-100">
                    {hasActiveShoppingSearch
                      ? "No shopping lists match your search"
                      : "No shopping lists found."}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {hasActiveShoppingSearch
                      ? "Try a different search term."
                      : "Shopping lists will appear here."}
                  </p>

                  {hasActiveShoppingSearch && (
                    <button
                      type="button"
                      onClick={clearShoppingSearch}
                      className={`${ghostButtonClass} mt-5 !px-4 !py-2.5 !text-sm`}
                    >
                      Clear search
                    </button>
                  )}

                </div>
              ) : (
                <>
                  <div
                    className={`overflow-x-auto transition-opacity duration-200 ${shoppingLoading ? "opacity-50" : "opacity-100"}`}
                  >

                <table className="w-full min-w-[900px] text-left">

                  <thead className="bg-white/[0.03]">

                    <tr className="border-b border-white/10">

                      <TableHeader text="Name" />
                      <TableHeader text="User" />
                      <TableHeader text="Created" />
                      <TableHeader text="Updated" />
                      <TableHeader text="Action" />

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-white/5">

                    {paginatedShoppingLists.map(
                      (list, index) => (
                        <tr
                          key={list.id}
                          className="lp-row transition duration-200 hover:bg-violet-500/10"
                          style={{
                            animationDelay: `${index * 40}ms`,
                          }}
                        >

                          <td className="px-5 py-4">

                            <p className="font-medium text-slate-100">
                              {list.name ||
                                "Unnamed List"}
                            </p>

                            <p className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                              {list.id}
                            </p>

                          </td>

                          <td className="px-5 py-4">

                            <p className="max-w-[180px] truncate text-xs text-slate-400">
                              {list.user_id ||
                                "—"}
                            </p>

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-400">
                            {formatDate(
                              list.created_at
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-400">
                            {formatDate(
                              list.updated_at
                            )}
                          </td>

                          <td className="px-5 py-4">

                            <button
                              onClick={() =>
                                setSelectedShoppingList(
                                  list
                                )
                              }
                              className={ghostButtonClass}
                            >
                              View Details
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              <Pagination
                currentPage={currentShoppingPage}
                totalPages={shoppingTotalPages}
                totalItems={shoppingTotalCount}
                pageSize={pageSize}
                onPageChange={
                  handleShoppingPageChange
                }
              />
                </>
              )}
            </>
          )}

        </section>

        {/* ACTIVITY LOG */}
        <section
          id="activity"
          className={`${sectionClass} scroll-mt-28`}
        >

          <SectionHeader
            title="Activity Log"
            subtitle="Track administrative actions and changes."
            right={
              <button
                type="button"
                onClick={refreshAuditLogs}
                disabled={auditLoading}
                className={`${ghostButtonClass} inline-flex items-center justify-center gap-2 !px-4 !py-2.5 !text-sm`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 ${auditLoading ? "lp-spin" : ""}`}
                >
                  <path d="M21 12a9 9 0 1 1-3-6.7" />
                  <path d="M21 3v6h-6" />
                </svg>

                {auditLoading
                  ? "Refreshing..."
                  : "Refresh Activity"}
              </button>
            }
          />

          {/* SEARCH + TOTAL */}
          <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="relative w-full sm:max-w-md">

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                type="text"
                value={auditSearch}
                onChange={(e) =>
                  handleAuditSearchChange(
                    e.target.value
                  )
                }
                placeholder="Search activity..."
                className={searchInputClass}
              />

              {auditSearch && (
                <button
                  type="button"
                  onClick={clearAuditSearch}
                  aria-label="Clear activity search"
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              )}

            </div>

            <p className="text-sm text-slate-400">
              <span className="font-semibold text-violet-200">
                {auditTotalCount}
              </span>{" "}
              total activities
            </p>

          </div>

          {auditLoading &&
            auditLogs.length === 0 ? (
            <div className="space-y-3 px-6 py-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="lp-shimmer h-14 rounded-xl"
                />
              ))}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="px-6 py-12 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg">
                📋
              </div>

              <p className="mt-4 font-medium text-slate-100">
                {auditSearch
                  ? "No activity matches your search"
                  : "No activity found."}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {auditSearch
                  ? "Try a different search term."
                  : "Administrative activity will appear here."}
              </p>

              {auditSearch && (
                <button
                  type="button"
                  onClick={clearAuditSearch}
                  className={`${ghostButtonClass} mt-5 !px-4 !py-2.5 !text-sm`}
                >
                  Clear search
                </button>
              )}

            </div>
          ) : (
            <>
              <div
                className={`overflow-x-auto transition-opacity duration-200 ${auditLoading ? "opacity-50" : "opacity-100"}`}
              >

                <table className="w-full min-w-[1000px] text-left">

                  <thead className="bg-white/[0.03]">

                    <tr className="border-b border-white/10">

                      <TableHeader text="Action" />
                      <TableHeader text="Entity" />
                      <TableHeader text="Admin" />
                      <TableHeader text="Details" />
                      <TableHeader text="Time" />

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-white/5">

                    {auditLogs.map(
                      (log, index) => (
                        <tr
                          key={log.id}
                          className="lp-row transition duration-200 hover:bg-violet-500/10"
                          style={{
                            animationDelay: `${index * 40}ms`,
                          }}
                        >

                          {/* ACTION */}
                          <td className="px-5 py-4">

                            <AuditActionBadge
                              action={log.action}
                            />

                          </td>

                          {/* ENTITY */}
                          <td className="px-5 py-4">

                            <p className="flex items-center gap-2 text-sm capitalize text-slate-200">
                              <span aria-hidden>
                                {auditEntityIcon(
                                  log.entity_type
                                )}
                              </span>
                              {(log.entity_type ||
                                "system").replace(
                                  /_/g,
                                  " "
                                )}
                            </p>

                            {log.entity_id && (
                              <p
                                className="mt-1 max-w-[180px] truncate font-mono text-[11px] text-slate-500"
                                title={log.entity_id}
                              >
                                {log.entity_id}
                              </p>
                            )}

                          </td>

                          {/* ADMIN */}
                          <td className="px-5 py-4">

                            {log.admin_id &&
                              log.admin_id ===
                              currentUserId ? (
                              <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 text-[11px] font-semibold text-violet-200">
                                You
                              </span>
                            ) : (
                              <p
                                className="font-mono text-xs text-slate-400"
                                title={
                                  log.admin_id ||
                                  undefined
                                }
                              >
                                {log.admin_id
                                  ? `${log.admin_id.slice(0, 8)}…`
                                  : "—"}
                              </p>
                            )}

                          </td>

                          {/* DETAILS */}
                          <td className="px-5 py-4">

                            <AuditDetails
                              details={log.details}
                            />

                          </td>

                          {/* TIME */}
                          <td className="whitespace-nowrap px-5 py-4">

                            <p className="text-sm text-slate-200">
                              {formatRelativeTime(
                                log.created_at
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {formatDate(
                                log.created_at
                              )}
                            </p>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              <Pagination
                currentPage={auditPage}
                totalPages={Math.max(
                  1,
                  Math.ceil(
                    auditTotalCount / 20
                  )
                )}
                totalItems={auditTotalCount}
                pageSize={20}
                onPageChange={
                  handleAuditPageChange
                }
              />
            </>
          )}

        </section>

        {/* SECURITY */}
        <section className="lp-fade-up mt-8 rounded-3xl border border-white/10 bg-[#0f121b]/80 p-6 shadow-[0_10px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">

          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-base">
              🔐
            </span>
            <h2 className="text-lg font-semibold text-white">
              Security
            </h2>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <SecurityItem text="Admin-only RPC access" />

            <SecurityItem text="Row Level Security enabled" />

            <SecurityItem text="Feature flags protected" />

            <SecurityItem text="Passwords never displayed" />

          </div>

        </section>

      </div>

      {/* USER DETAILS */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() =>
            setSelectedUser(null)
          }
          onEdit={() => {
            setEditingUser(selectedUser);
            setSelectedUser(null);
          }}
        />
      )}

      {/* USER EDIT */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          saving={savingUser}
          isSelf={editingUser.id === currentUserId}
          onClose={() =>
            setEditingUser(null)
          }
          onSave={(values) =>
            saveUserProfile(
              editingUser,
              values
            )
          }
        />
      )}

      {/* SAVED PLAN MODAL */}
      {selectedPlan && (
        <PlanDetailsModal
          plan={selectedPlan}
          onClose={() =>
            setSelectedPlan(null)
          }
        />
      )}

      {/* SHOPPING LIST MODAL */}
      {selectedShoppingList && (
        <ShoppingListDetailsModal
          list={selectedShoppingList}
          onClose={() =>
            setSelectedShoppingList(null)
          }
        />
      )}

    </main>
  );
}

/*
 * GLOBAL ANIMATION STYLES
 */
function AdminStyles() {
  return (
    <style>{`
      @keyframes lp-fade-up {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes lp-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes lp-pop {
        from { opacity: 0; transform: translateY(18px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes lp-row-in {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes lp-float {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(24px, 30px); }
      }
      @keyframes lp-float-slow {
        0%, 100% { transform: translate(0, 0); }
        50% { transform: translate(-30px, 20px); }
      }
      @keyframes lp-pulse-glow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.45); }
        50% { box-shadow: 0 0 26px 4px rgba(99, 102, 241, 0.45); }
      }
      @keyframes lp-shimmer {
        0% { background-position: -400px 0; }
        100% { background-position: 400px 0; }
      }
      @keyframes lp-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes lp-block-in {
        from { opacity: 0; transform: scale(0.55); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes lp-shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
      .lp-fade-up { animation: lp-fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .lp-fade-in { animation: lp-fade-in 0.25s ease-out both; }
      .lp-pop { animation: lp-pop 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .lp-row { animation: lp-row-in 0.4s ease-out both; }
      .lp-float { animation: lp-float 14s ease-in-out infinite; }
      .lp-float-slow { animation: lp-float-slow 20s ease-in-out infinite; }
      .lp-pulse-glow { animation: lp-pulse-glow 3.2s ease-in-out infinite; }
      .lp-spin { animation: lp-spin 0.9s linear infinite; }
      .lp-shake { animation: lp-shake 0.45s ease-in-out both; }
      .lp-block { animation: lp-block-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
      .lp-shimmer {
        background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(167,139,250,0.14) 50%, rgba(255,255,255,0.04) 100%);
        background-size: 800px 100%;
        animation: lp-shimmer 1.4s linear infinite;
      }
      .lp-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
      .lp-scroll::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.35); border-radius: 999px; }
      .lp-scroll::-webkit-scrollbar-track { background: transparent; }
      @media (prefers-reduced-motion: reduce) {
        .lp-fade-up, .lp-fade-in, .lp-pop, .lp-row, .lp-float, .lp-float-slow,
        .lp-pulse-glow, .lp-spin, .lp-shake, .lp-shimmer, .lp-block {
          animation: none !important;
        }
      }
    `}</style>
  );
}

/*
 * ANIMATED NUMBER
 */
function AnimatedNumber({
  value,
}: {
  value: number;
}) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const from = previous.current;
    const to = value;
    const duration = 900;
    const startTime = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(
        1,
        (now - startTime) / duration
      );
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplay(
        Math.round(from + (to - from) * eased)
      );

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        previous.current = to;
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display}</>;
}

/*
 * SECTION HEADER
 */
function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/10 px-6 py-5">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-3">

          <span className="h-8 w-1 rounded-full bg-gradient-to-b from-violet-400 to-violet-500 shadow-[0_0_12px_rgba(167,139,250,0.8)]" />

          <div>

            <h2 className="text-xl font-semibold text-white">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              {subtitle}
            </p>

          </div>

        </div>

        {right}

      </div>

    </div>
  );
}

/*
 * AVATAR
 */
function Avatar({ name }: { name: string }) {
  const letter =
    name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-sm font-bold text-white shadow-[0_0_14px_rgba(139,92,246,0.5)]">
      {letter}
    </div>
  );
}

/*
 * USER STAT TILE
 */
function UserStatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "indigo" | "violet" | "sky" | "emerald";
}) {
  const tones = {
    indigo: "from-violet-500/20 text-violet-200",
    violet: "from-violet-500/20 text-violet-200",
    sky: "from-sky-500/20 text-sky-200",
    emerald: "from-emerald-500/20 text-emerald-200",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition duration-300 hover:border-violet-400/40 hover:bg-white/[0.06]">

      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tones[tone]} to-transparent opacity-60 transition duration-300 group-hover:opacity-100`}
      />

      <p className="relative text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="relative mt-1.5 text-2xl font-bold text-white">
        <AnimatedNumber value={value} />
      </p>

      <p className="relative mt-1 text-xs text-slate-500">
        {hint}
      </p>

    </div>
  );
}

/*
 * ROLE FILTER (All Roles / Users / Admins)
 */
function RoleFilter({
  value,
  onChange,
  counts,
}: {
  value: string;
  onChange: (role: string) => void;
  counts: {
    total: number;
    admins: number;
    normalUsers: number;
  };
}) {
  const options = [
    {
      value: "all",
      label: "All Roles",
      count: counts.total,
    },
    {
      value: "user",
      label: "Users",
      count: counts.normalUsers,
    },
    {
      value: "admin",
      label: "Admins",
      count: counts.admins,
    },
  ];

  return (
    <div
      role="group"
      aria-label="Filter users by role"
      className="inline-flex w-full rounded-xl border border-white/10 bg-white/5 p-1 sm:w-auto"
    >
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() =>
              onChange(option.value)
            }
            aria-pressed={active}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition duration-200 sm:flex-none ${active
                ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
          >
            {option.label}

            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${active
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-slate-400"
                }`}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/*
 * ICONS (line icons for nav and KPI cards)
 */
type NavIconName =
  | "grid"
  | "sliders"
  | "users"
  | "clipboard"
  | "cart"
  | "clock"
  | "star";

function NavIcon({
  name,
  className = "h-5 w-5",
}: {
  name: NavIconName;
  className?: string;
}) {
  const paths: Record<NavIconName, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="10" cy="12" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M17.5 14c2.6.2 4 2 4 5" />
      </>
    ),
    clipboard: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2.5" />
        <path d="M9 4.5h6M9 11h6M9 15h4" />
      </>
    ),
    cart: (
      <>
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
        <path d="M2.5 3.5h3l2.2 11h10.6l2-8H6.3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    star: (
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

/*
 * QUICK NAV (floating icon pill, jumps to a section)
 */
const navSections: {
  id: string;
  label: string;
  icon: NavIconName;
}[] = [
    { id: "overview", label: "Overview", icon: "grid" },
    { id: "features", label: "Features", icon: "sliders" },
    { id: "users", label: "Users", icon: "users" },
    { id: "plans", label: "Saved Plans", icon: "clipboard" },
    { id: "lists", label: "Shopping Lists", icon: "cart" },
    { id: "activity", label: "Activity Log", icon: "clock" },
  ];

function QuickNav({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Dashboard sections"
      className="inline-flex gap-1 rounded-2xl border border-white/10 bg-[#0f121b]/80 p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
    >
      {navSections.map((section) => {
        const isActive = active === section.id;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onNavigate(section.id)}
            title={section.label}
            aria-label={section.label}
            aria-current={isActive ? "true" : undefined}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition duration-200 active:scale-95 sm:w-11 ${isActive
              ? "bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.6)]"
              : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
          >
            <NavIcon name={section.icon} />
          </button>
        );
      })}
    </nav>
  );
}

/*
 * KPI CARD
 */
function KpiCard({
  title,
  value,
  icon,
  pill,
  hint,
  delay,
}: {
  title: string;
  value: number;
  icon: NavIconName;
  pill?: {
    text: string;
    tone: "up" | "down" | "flat";
  };
  hint: string;
  delay: number;
}) {
  const pillTones = {
    up: "bg-lime-400/90 text-[#10200a]",
    down: "bg-orange-600 text-white",
    flat: "bg-white/10 text-slate-300",
  };

  return (
    <div
      className="lp-fade-up group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-[#11141d] p-5 transition duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_0_40px_rgba(139,92,246,0.25)]"
      style={{ animationDelay: `${delay}ms` }}
    >

      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-500/15 blur-3xl transition duration-500 group-hover:bg-violet-400/30" />

      <div className="relative flex items-start justify-between">

        <p className="text-sm font-medium text-slate-200">
          {title}
        </p>

        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition duration-300 group-hover:scale-110 group-hover:bg-violet-500/20 group-hover:text-white">
          <NavIcon name={icon} className="h-[18px] w-[18px]" />
        </span>

      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-3">

        <p className="text-4xl font-semibold tracking-tight text-white">
          <AnimatedNumber value={value} />
        </p>

        {pill && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${pillTones[pill.tone]}`}
          >
            {pill.tone === "up" && <span aria-hidden>↗</span>}
            {pill.tone === "down" && <span aria-hidden>↘</span>}
            {pill.text}
          </span>
        )}

      </div>

      <p className="relative mt-2 text-sm text-slate-500">
        {hint}
      </p>

    </div>
  );
}

/*
 * BLOCK CHART (pixel-block columns, real database counts)
 */
function niceChartMax(max: number) {
  const rawStep = Math.max(max, 1) / 4;
  const magnitude = Math.pow(
    10,
    Math.floor(Math.log10(Math.max(rawStep, 1)))
  );

  const step =
    [1, 2, 5, 10]
      .map((multiplier) => multiplier * magnitude)
      .find((candidate) => candidate >= rawStep) ??
    magnitude * 10;

  return { step, max: Math.max(4, step * 4) };
}

function BlockChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const rows = 12;

  const highest = Math.max(
    0,
    ...data.map((item) => item.value)
  );

  const { step, max } = niceChartMax(highest);

  const ticks = [4, 3, 2, 1, 0].map(
    (i) => step * i
  );

  return (
    <div className="flex gap-3">

      {/* Y AXIS */}
      <div className="flex h-[204px] shrink-0 flex-col justify-between pr-1 text-right text-xs text-slate-500">
        {ticks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>

      {/* COLUMNS */}
      <div
        className="grid min-w-0 flex-1 gap-3"
        style={{
          gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
        }}
      >
        {data.map((item, column) => {
          const filled =
            item.value > 0
              ? Math.min(
                rows,
                Math.max(
                  1,
                  Math.round(
                    (item.value / max) * rows
                  )
                )
              )
              : 0;

          return (
            <div
              key={item.label}
              className="flex min-w-0 flex-col items-center"
              title={`${item.label}: ${item.value}`}
            >

              <div className="flex h-[204px] w-full max-w-[84px] flex-col-reverse gap-[3px]">
                {Array.from({ length: rows }).map(
                  (_, row) => {
                    const isFilled = row < filled;
                    const isTop = row === filled - 1;

                    return (
                      <span
                        key={row}
                        className={`h-[14px] w-full rounded-[4px] ${isFilled
                          ? `lp-block ${isTop
                            ? "bg-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.7)]"
                            : "bg-violet-500"
                          }`
                          : "bg-white/[0.04]"
                          }`}
                        style={
                          isFilled
                            ? {
                              animationDelay: `${column * 70 + row * 28}ms`,
                            }
                            : undefined
                        }
                      />
                    );
                  }
                )}
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {item.label}
              </p>

              <p className="text-sm font-semibold text-white">
                {item.value}
              </p>

            </div>
          );
        })}
      </div>

    </div>
  );
}

/*
 * RECENT ACTIVITY: subtitle + success/alert style
 */
function recentActivityMeta(log: AuditLog) {
  const details =
    log.details &&
      typeof log.details === "object" &&
      !Array.isArray(log.details)
      ? (log.details as Record<string, unknown>)
      : null;

  const sub =
    details &&
      typeof details.feature_name === "string"
      ? details.feature_name.replace(/_/g, " ")
      : details &&
        typeof details.full_name === "string"
        ? details.full_name
        : (log.entity_type || "system").replace(
          /_/g,
          " "
        );

  return {
    negative: log.action === "feature_disabled",
    sub,
  };
}

/*
 * FEATURE ROW
 */
function FeatureRow({
  feature,
  updating,
  onToggle,
}: {
  feature: FeatureFlag;
  updating: boolean;
  onToggle: () => void;
}) {
  const names: Record<string, string> = {
    users: "Users",
    saved_plans: "Saved Plans",
    shopping_lists: "Shopping Lists",
  };

  const displayName =
    names[feature.feature_name] ||
    feature.feature_name;

  return (
    <div className="flex flex-col gap-4 px-6 py-5 transition duration-200 hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">

      <div>

        <div className="flex items-center gap-2">

          <h3 className="font-semibold text-white">
            {displayName}
          </h3>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors duration-300 ${feature.enabled
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-slate-500/15 text-slate-400"
              }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${feature.enabled
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                  : "bg-slate-500"
                }`}
            />
            {feature.enabled ? "On" : "Off"}
          </span>

        </div>

        <p className="mt-1 text-sm text-slate-400">
          {feature.description ||
            "Application feature"}
        </p>

        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          {feature.feature_name}
        </p>

      </div>

      <button
        type="button"
        onClick={onToggle}
        disabled={updating}
        aria-label={`Toggle ${displayName}`}
        aria-pressed={feature.enabled}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-all duration-300 ${feature.enabled
            ? "border-violet-300/40 bg-gradient-to-r from-violet-500 to-purple-600 shadow-[0_0_22px_rgba(139,92,246,0.6)]"
            : "border-white/10 bg-white/10"
          } ${updating
            ? "cursor-wait opacity-60"
            : "cursor-pointer hover:brightness-125"
          }`}
      >

        <span
          className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-md transition-all duration-300 ${feature.enabled
              ? "translate-x-7"
              : "translate-x-1"
            }`}
        >
          {updating && (
            <span className="lp-spin block h-3.5 w-3.5 rounded-full border-2 border-violet-500 border-t-transparent" />
          )}
        </span>

      </button>

    </div>
  );
}

/*
 * ROLE BADGE
 */
function RoleBadge({
  role,
}: {
  role: string;
}) {
  const isAdmin = role === "admin";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${isAdmin
          ? "border-violet-400/30 bg-violet-500/15 text-violet-200 shadow-[0_0_14px_rgba(139,92,246,0.3)]"
          : "border-white/10 bg-white/5 text-slate-300"
        }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isAdmin ? "bg-violet-300" : "bg-slate-400"
          }`}
      />
      {isAdmin ? "Admin" : "User"}
    </span>
  );
}

/*
 * TABLE HEADER
 */
function TableHeader({
  text,
}: {
  text: string;
}) {
  return (
    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {text}
    </th>
  );
}

/*
 * PAGINATION
 */
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start =
    totalItems === 0
      ? 0
      : (currentPage - 1) *
      pageSize +
      1;

  const end = Math.min(
    currentPage * pageSize,
    totalItems
  );

  return (
    <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

      <p className="text-sm text-slate-400">

        Showing{" "}

        <span className="font-medium text-violet-200">
          {start}
        </span>

        {" "}to{" "}

        <span className="font-medium text-violet-200">
          {end}
        </span>

        {" "}of{" "}

        <span className="font-medium text-violet-200">
          {totalItems}
        </span>

      </p>

      <div className="flex items-center gap-2">

        <button
          onClick={() =>
            onPageChange(
              Math.max(
                1,
                currentPage - 1
              )
            )
          }
          disabled={currentPage === 1}
          className={ghostButtonClass}
        >
          Previous
        </button>

        <span className="min-w-20 text-center text-sm text-slate-400">
          Page {currentPage} of{" "}
          {totalPages}
        </span>

        <button
          onClick={() =>
            onPageChange(
              Math.min(
                totalPages,
                currentPage + 1
              )
            )
          }
          disabled={
            currentPage === totalPages
          }
          className={ghostButtonClass}
        >
          Next
        </button>

      </div>

    </div>
  );
}

/*
 * MODAL SHELL
 */
function ModalShell({
  onClose,
  maxWidth,
  children,
}: {
  onClose: () => void;
  maxWidth: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="lp-fade-in fixed inset-0 z-50 flex items-center justify-center bg-[#02040f]/75 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className={`lp-pop lp-scroll max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-3xl border border-white/10 bg-[#0e111a] shadow-[0_0_80px_rgba(109,40,217,0.35)]`}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {children}
      </div>
    </div>
  );
}

/*
 * USER DETAILS MODAL
 */
function UserDetailsModal({
  user,
  onClose,
  onEdit,
}: {
  user: AdminUser;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <ModalShell onClose={onClose} maxWidth="max-w-2xl">

      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0e111a]/95 px-6 py-5 backdrop-blur">

        <div>

          <h2 className="text-xl font-bold text-white">
            User Details
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {user.id}
          </p>

        </div>

        <button
          onClick={onClose}
          className={ghostButtonClass}
        >
          Close
        </button>

      </div>

      <div className="grid gap-5 p-6 sm:grid-cols-2">

        <DetailItem
          label="Full Name"
          value={user.full_name}
        />

        <DetailItem
          label="Email"
          value={user.email}
        />

        <DetailItem
          label="Country"
          value={user.country}
        />

        <DetailItem
          label="Region"
          value={user.region}
        />

        <DetailItem
          label="Budget Level"
          value={user.budget_level}
        />

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Role
          </p>

          <div className="mt-2">
            <RoleBadge
              role={
                user.role || "user"
              }
            />
          </div>

        </div>

        <DetailItem
          label="Created At"
          value={formatDate(
            user.created_at
          )}
        />

        <DetailItem
          label="Updated At"
          value={formatDate(
            user.updated_at
          )}
        />

        <div className="sm:col-span-2">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            User ID
          </p>

          <p className="mt-2 break-all rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs text-violet-200">
            {user.id}
          </p>

        </div>

      </div>

      <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4">

        <button
          onClick={onClose}
          className={`${ghostButtonClass} !px-4 !py-2.5 !text-sm`}
        >
          Close
        </button>

        <button
          onClick={onEdit}
          className={primaryButtonClass}
        >
          Edit User
        </button>

      </div>

    </ModalShell>
  );
}

/*
 * EDIT USER MODAL
 */
function EditUserModal({
  user,
  saving,
  isSelf,
  onClose,
  onSave,
}: {
  user: AdminUser;
  saving: boolean;
  isSelf: boolean;
  onClose: () => void;
  onSave: (values: {
    full_name: string;
    country: string;
    region: string;
    budget_level: string;
    role: string;
  }) => void;
}) {
  const [fullName, setFullName] = useState(
    user.full_name || ""
  );

  const [country, setCountry] = useState(
    user.country || ""
  );

  const [region, setRegion] = useState(
    user.region || ""
  );

  const [budgetLevel, setBudgetLevel] =
    useState(
      user.budget_level || ""
    );

  const [role, setRole] = useState(
    user.role === "admin"
      ? "admin"
      : "user"
  );

  function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    onSave({
      full_name: fullName,
      country,
      region,
      budget_level: budgetLevel,
      role,
    });
  }

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-2xl">

      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">

        <div>

          <h2 className="text-xl font-bold text-white">
            Edit User
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Update profile information and role.
          </p>

        </div>

        <button
          onClick={onClose}
          disabled={saving}
          className={ghostButtonClass}
        >
          Close
        </button>

      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 p-6"
      >

        {/* EMAIL */}
        <div>

          <label className="text-sm font-semibold text-slate-200">
            Email
          </label>

          <input
            type="text"
            value={user.email || ""}
            disabled
            className={`${inputClass} mt-2`}
          />

          <p className="mt-1 text-xs text-slate-500">
            Email is read-only from this dashboard.
          </p>

        </div>

        {/* FULL NAME */}
        <div>

          <label className="text-sm font-semibold text-slate-200">
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(e) =>
              setFullName(
                e.target.value
              )
            }
            className={`${inputClass} mt-2`}
            placeholder="Enter full name"
          />

        </div>

        {/* COUNTRY */}
        <div>

          <label className="text-sm font-semibold text-slate-200">
            Country
          </label>

          <input
            type="text"
            value={country}
            onChange={(e) =>
              setCountry(
                e.target.value
              )
            }
            className={`${inputClass} mt-2`}
            placeholder="Enter country"
          />

        </div>

        {/* REGION */}
        <div>

          <label className="text-sm font-semibold text-slate-200">
            Region
          </label>

          <input
            type="text"
            value={region}
            onChange={(e) =>
              setRegion(
                e.target.value
              )
            }
            className={`${inputClass} mt-2`}
            placeholder="Enter region"
          />

        </div>

        {/* BUDGET */}
        <div>

          <label className="text-sm font-semibold text-slate-200">
            Budget Level
          </label>

          <input
            type="text"
            value={budgetLevel}
            onChange={(e) =>
              setBudgetLevel(
                e.target.value
              )
            }
            className={`${inputClass} mt-2`}
            placeholder="Enter budget level"
          />

        </div>

        {/* ROLE */}
        <div>

          <label className="text-sm font-semibold text-slate-200">
            Role
          </label>

          <select
            value={role}
            onChange={(e) =>
              setRole(
                e.target.value
              )
            }
            disabled={isSelf}
            className={`${inputClass} mt-2`}
          >
            <option
              value="user"
              className="bg-[#0e111a] text-slate-100"
            >
              User
            </option>

            <option
              value="admin"
              className="bg-[#0e111a] text-slate-100"
            >
              Admin
            </option>
          </select>

          {isSelf ? (
            <p className="mt-1 text-xs text-amber-300">
              This is your own account. You cannot change your own role.
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              Only administrators can change roles.
            </p>
          )}

          {!isSelf &&
            role === "admin" &&
            user.role !== "admin" && (
              <div className="lp-fade-in mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                This user will get full admin access to this dashboard.
              </div>
            )}

          {!isSelf &&
            role !== "admin" &&
            user.role === "admin" && (
              <div className="lp-fade-in mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                This user will lose admin access to this dashboard.
              </div>
            )}

        </div>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 border-t border-white/10 pt-5">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={`${ghostButtonClass} !px-4 !py-2.5 !text-sm`}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className={primaryButtonClass}
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </form>

    </ModalShell>
  );
}

/*
 * SAVED PLAN DETAILS MODAL
 */
function PlanDetailsModal({
  plan,
  onClose,
}: {
  plan: SavedPlan;
  onClose: () => void;
}) {
  return (
    <ModalShell onClose={onClose} maxWidth="max-w-3xl">

      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0e111a]/95 px-6 py-5 backdrop-blur">

        <div>

          <h2 className="text-xl font-bold text-white">
            Saved Plan Details
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {plan.id}
          </p>

        </div>

        <button
          onClick={onClose}
          className={ghostButtonClass}
        >
          Close
        </button>

      </div>

      <div className="grid gap-5 p-6 sm:grid-cols-2">

        <DetailItem
          label="User ID"
          value={plan.user_id}
        />

        <DetailItem
          label="Meal Plan ID"
          value={plan.meal_plan_id}
        />

        <DetailItem
          label="City"
          value={plan.city}
        />

        <DetailItem
          label="Diet"
          value={plan.diet}
        />

        <DetailItem
          label="Budget"
          value={plan.budget}
        />

        <DetailItem
          label="Food Type"
          value={plan.food_type}
        />

        <DetailItem
          label="Meal Type"
          value={plan.meal_type}
        />

        <DetailItem
          label="Goal"
          value={plan.goal}
        />

        <DetailItem
          label="Servings"
          value={
            plan.servings !== null
              ? String(plan.servings)
              : null
          }
        />

        <DetailItem
          label="Spice Level"
          value={plan.spice_level}
        />

        <DetailItem
          label="Plan Type"
          value={plan.plan_type}
        />

        <DetailItem
          label="Favorite"
          value={
            plan.favorite === null
              ? null
              : plan.favorite
                ? "Yes"
                : "No"
          }
        />

        <DetailItem
          label="Use Leftovers"
          value={
            plan.use_leftovers === null
              ? null
              : plan.use_leftovers
                ? "Yes"
                : "No"
          }
        />

        <DetailItem
          label="Saved At"
          value={formatDate(
            plan.saved_at
          )}
        />

        <DetailItem
          label="Created At"
          value={formatDate(
            plan.created_at
          )}
        />

        <div className="sm:col-span-2">
          <DetailItem
            label="Allergies"
            value={plan.allergies}
          />
        </div>

        <div className="sm:col-span-2">
          <DetailItem
            label="Dislikes"
            value={plan.dislikes}
          />
        </div>

        <div className="sm:col-span-2">
          <DetailItem
            label="Pantry"
            value={plan.pantry}
          />
        </div>

        <div className="sm:col-span-2">
          <DetailItem
            label="Extra Preferences"
            value={
              plan.extra_preferences
            }
          />
        </div>

        <div className="sm:col-span-2">
          <DetailItem
            label="Leftovers"
            value={plan.leftovers}
          />
        </div>

        <div className="sm:col-span-2">
          <DetailItem
            label="Meal Plan"
            value={plan.meal_plan}
          />
        </div>

        <div className="sm:col-span-2">

          <JsonDetail
            label="Smart Substitutions"
            value={
              plan.smart_substitutions
            }
          />

        </div>

      </div>

    </ModalShell>
  );
}

/*
 * SHOPPING LIST DETAILS MODAL
 */
function ShoppingListDetailsModal({
  list,
  onClose,
}: {
  list: ShoppingList;
  onClose: () => void;
}) {
  return (
    <ModalShell onClose={onClose} maxWidth="max-w-3xl">

      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0e111a]/95 px-6 py-5 backdrop-blur">

        <div>

          <h2 className="text-xl font-bold text-white">
            Shopping List Details
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            {list.id}
          </p>

        </div>

        <button
          onClick={onClose}
          className={ghostButtonClass}
        >
          Close
        </button>

      </div>

      <div className="grid gap-6 p-6">

        <DetailItem
          label="List Name"
          value={list.name}
        />

        <DetailItem
          label="User ID"
          value={list.user_id}
        />

        <DetailItem
          label="Created"
          value={formatDate(
            list.created_at
          )}
        />

        <DetailItem
          label="Updated"
          value={formatDate(
            list.updated_at
          )}
        />

        <DetailItem
          label="Shopping List"
          value={list.shopping_list}
        />

        <JsonDetail
          label="Checked Items"
          value={list.checked_items}
        />

        <JsonDetail
          label="Favorite Items"
          value={list.favorite_items}
        />

        <JsonDetail
          label="Custom Items"
          value={list.custom_items}
        />

        <JsonDetail
          label="Manual Prices"
          value={list.manual_prices}
        />

      </div>

    </ModalShell>
  );
}

/*
 * DETAIL ITEM
 */
function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">
        {value || "—"}
      </p>

    </div>
  );
}

/*
 * JSON DETAIL
 */
function JsonDetail({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <pre className="lp-scroll mt-2 max-h-60 overflow-auto rounded-xl border border-white/10 bg-[#090b12] p-4 text-xs text-violet-200">
        {formatJson(value)}
      </pre>

    </div>
  );
}

/*
 * SECURITY ITEM
 */
function SecurityItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="group flex items-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition duration-200 hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]">

      <span className="mr-2 text-emerald-400 transition-transform duration-200 group-hover:scale-125">
        ✓
      </span>

      {text}

    </div>
  );
}

/*
 * ACTIVITY LOG HELPERS
 */
function auditEntityIcon(type: string | null) {
  switch (type) {
    case "user":
      return "👤";
    case "feature_flag":
      return "🎚️";
    case "system":
      return "⚙️";
    default:
      return "📄";
  }
}

function AuditActionBadge({
  action,
}: {
  action: string;
}) {
  const styles: Record<string, string> = {
    feature_enabled:
      "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
    feature_disabled:
      "border-slate-400/30 bg-slate-500/15 text-slate-200",
    user_profile_updated:
      "border-violet-400/30 bg-violet-500/15 text-violet-200",
    user_profile_and_role_updated:
      "border-violet-400/30 bg-violet-500/15 text-violet-200",
    dashboard_test:
      "border-amber-400/30 bg-amber-500/15 text-amber-200",
  };

  const style =
    styles[action] ||
    "border-white/10 bg-white/5 text-slate-200";

  const label = action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function AuditDetails({
  details,
}: {
  details: unknown;
}) {
  if (
    details === null ||
    details === undefined ||
    details === ""
  ) {
    return (
      <span className="text-xs text-slate-500">
        —
      </span>
    );
  }

  if (
    typeof details !== "object" ||
    Array.isArray(details)
  ) {
    return (
      <p
        className="max-w-[320px] truncate text-xs text-slate-400"
        title={formatJson(details)}
      >
        {formatJson(details)}
      </p>
    );
  }

  // user_id is already shown in the Entity column.
  const entries = Object.entries(
    details as Record<string, unknown>
  ).filter(([key]) => key !== "user_id");

  if (entries.length === 0) {
    return (
      <span className="text-xs text-slate-500">
        —
      </span>
    );
  }

  const visible = entries.slice(0, 4);
  const hidden = entries.length - visible.length;

  return (
    <div
      className="flex max-w-[380px] flex-wrap gap-1.5"
      title={formatJson(details)}
    >
      {visible.map(([key, value]) => {
        const text =
          typeof value === "string"
            ? value
            : value === null ||
              value === undefined
              ? "—"
              : typeof value === "object"
                ? JSON.stringify(value)
                : String(value);

        const short =
          text.length > 28
            ? `${text.slice(0, 28)}…`
            : text;

        return (
          <span
            key={key}
            className="inline-flex max-w-full items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px]"
          >
            <span className="text-slate-500">
              {key.replace(/_/g, " ")}
            </span>

            <span className="truncate text-slate-200">
              {short}
            </span>
          </span>
        );
      })}

      {hidden > 0 && (
        <span className="px-1.5 py-0.5 text-[11px] text-slate-500">
          +{hidden} more
        </span>
      )}
    </div>
  );
}

/*
 * RELATIVE TIME ("5 min ago")
 */
function formatRelativeTime(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const seconds = Math.round(
    (Date.now() - date.getTime()) / 1000
  );

  if (seconds < 45) {
    return "Just now";
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours} h ago`;
  }

  const days = Math.round(hours / 24);

  if (days < 7) {
    return `${days} d ago`;
  }

  return date.toLocaleDateString();
}

/*
 * DATE FORMATTER
 */
function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

/*
 * JSON FORMATTER
 */
function formatJson(value: unknown) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return String(value);
  }
}