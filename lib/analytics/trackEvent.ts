import { createClient } from "@/lib/supabase/client";

export async function trackEvent(
  eventName: string,
  metadata?: Record<string, unknown>
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: userError ?? new Error("No user") };
  }

  const { error } = await supabase.from("analytics_events").insert({
    user_id: user.id,
    event_name: eventName,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error("trackEvent error:", error);
    return { ok: false, error };
  }

  return { ok: true };
}