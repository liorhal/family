import type { SetAllCookies } from "@supabase/ssr";

/** Cookie array type for Supabase setAll callbacks. Use to avoid implicit any. */
export type CookiesToSet = Parameters<SetAllCookies>[0];
