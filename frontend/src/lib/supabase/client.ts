"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/config";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
