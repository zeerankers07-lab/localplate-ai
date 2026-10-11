import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/planner",
  "/weekly-plan",
  "/saved-plans",
  "/shopping-list",
  "/profile",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAdminEmail(email: string | undefined) {
  if (!email) return false;

  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(email.toLowerCase());
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Supabase public environment variables are missing."
    );

    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) =>
              request.cookies.set(name, value)
          );

          response = NextResponse.next({ request });

          cookiesToSet.forEach(
            ({ name, value, options }) =>
              response.cookies.set(
                name,
                value,
                options
              )
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  /*
   * PROTECTED USER ROUTES
   */
  if (isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  /*
   * ADMIN ROUTES
   *
   * Admin can be recognized by:
   * 1. ADMIN_EMAILS environment variable
   * 2. Supabase Auth app_metadata.role
   * 3. profiles.role in the database
   */
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    if (!user) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    let isAdmin = false;

    /*
     * 1. Check ADMIN_EMAILS
     */
    if (isAdminEmail(user.email)) {
      isAdmin = true;
    }

    /*
     * 2. Check Supabase Auth app_metadata
     */
    if (user.app_metadata?.role === "admin") {
      isAdmin = true;
    }

    /*
     * 3. Check profiles.role
     *
     * This is important because your Admin role is being
     * stored in the profiles table.
     */
    if (!isAdmin) {
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Unable to check admin profile role:",
          profileError.message
        );
      }

      if (profile?.role === "admin") {
        isAdmin = true;
      }
    }

    /*
     * Not an admin
     */
    if (!isAdmin) {
      return NextResponse.redirect(
        new URL("/planner", request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};