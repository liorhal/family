import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const log = (request: NextRequest, msg: string, data: object) => {
  const url = new URL("/api/debug-log", request.nextUrl.origin);
  fetch(url.toString(), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location: "middleware.ts", message: msg, data }) }).catch(() => {});
};

export async function updateSession(request: NextRequest) {
  // #region agent log
  log(request, "middleware_entry", { hypothesisId: "H1", pathname: request.nextUrl.pathname });
  // #endregion
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    // #region agent log
    log(request, "middleware_missing_env", { hypothesisId: "H1", hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey });
    // #endregion
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    await supabase.auth.getUser();
    // #region agent log
    log(request, "middleware_after_getUser", { hypothesisId: "H1,H3", ok: true });
    // #endregion
  } catch (e) {
    // #region agent log
    log(request, "middleware_getUser_error", { hypothesisId: "H1,H3", error: String(e) });
    // #endregion
    return supabaseResponse;
  }

  return supabaseResponse;
}
