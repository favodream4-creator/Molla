"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/trackEvent";

export default function CreateProjectForm() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("Beat");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("You must be signed in to create a project.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({
          title,
          type,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      await trackEvent("project_created", {
        project_type: type,
        source: "dashboard",
        project_id: data?.id,
      });

      router.push("/project");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the project."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-molla-black">
          Project title
        </label>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My next project"
          required
          className="w-full rounded-2xl border border-molla-line px-4 py-3.5 text-sm outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-molla-black">
          Project type
        </label>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-2xl border border-molla-line bg-white px-4 py-3.5 text-sm outline-none"
        >
          <option value="Beat">Beat</option>
          <option value="Song">Song</option>
          <option value="EP">EP</option>
          <option value="Album">Album</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="w-full rounded-2xl bg-molla-yellow py-4 font-bold text-molla-black disabled:opacity-40"
      >
        {loading ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}
