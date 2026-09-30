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

// après création de compte réussie
await trackEvent("signup", {
  source: "magic_link",
});

// après sauvegarde du profil
await trackEvent("profile_completed", {
  has_avatar: Boolean(profile.avatar_url),
  city: profile.location || null,
  genres: profile.genres?.length ?? 0,
});

// après création d'un projet
await trackEvent("project_created", {
  project_type: project.type,
  source: "dashboard",
});

// après publication d'un post
await trackEvent("post_created", {
  media_count: mediaUrls.length,
  has_text: Boolean(content.trim()),
});

// quand le focus démarre
await trackEvent("focus_started", {
  duration: 25,
  mode: "deep_work",
});

// quand l'IA est utilisée
await trackEvent("ai_used", {
  feature: "content_generation",
  source: "composer",
});