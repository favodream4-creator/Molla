import { createClient } from "@/lib/supabase/client";

type TrackEventResult =
  | { ok: true }
  | { ok: false; error: unknown };

export function trackEvent(
  eventName: string,
  metadata?: Record<string, unknown>
): Promise<TrackEventResult> {
  const supabase = createClient();

  return supabase.auth
    .getUser()
    .then(
      ({ data: { user }, error: userError }): TrackEventResult | PromiseLike<TrackEventResult> => {
        if (userError || !user) {
          return { ok: false, error: userError ?? new Error("No user") };
        }

        return supabase
          .from("analytics_events")
          .insert({
            user_id: user.id,
            event_name: eventName,
            metadata: metadata ?? {},
          })
          .then(({ error }): TrackEventResult => {
            if (error) {
              console.error("trackEvent error:", error);
              return { ok: false, error };
            }

            return { ok: true };
          });
      }
    )
    .catch((error: unknown): TrackEventResult => {
      console.error("trackEvent error:", error);
      return { ok: false, error };
    });
}