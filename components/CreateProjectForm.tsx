import { trackEvent } from "@/lib/analytics/trackEvent";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const { data, error } = await supabase.from("projects").insert({
    title,
    type,
    user_id: user.id,
  });

  if (error) {
    setError(error.message);
    return;
  }

  await trackEvent("project_created", {
    project_type: type,
    source: "dashboard",
  });

  router.push("/projects");
};