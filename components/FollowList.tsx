"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import FollowButton from "@/components/FollowButton";

type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

type FollowRow = {
  follower_id: string;
  following_id: string;
};

type FollowListProps = {
  userId: string;
  mode: "followers" | "following";
};

export default function FollowList({
  userId,
  mode,
}: FollowListProps) {
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadList() {
      setLoading(true);

      const column =
        mode === "followers"
          ? "following_id"
          : "follower_id";

      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("follower_id,following_id")
        .eq(column, userId);

      if (followsError) {
        console.error("Follow list error:", followsError);
        if (mounted) {
          setProfiles([]);
          setLoading(false);
        }
        return;
      }

      const rows = (follows ?? []) as FollowRow[];

      const ids = rows.map((row) =>
        mode === "followers"
          ? row.follower_id
          : row.following_id
      );

      if (ids.length === 0) {
        if (mounted) {
          setProfiles([]);
          setLoading(false);
        }
        return;
      }

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("id,display_name,avatar_url,bio")
          .in("id", ids);

      if (profileError) {
        console.error("Profiles error:", profileError);
        if (mounted) {
          setProfiles([]);
          setLoading(false);
        }
        return;
      }

      const profileMap = new Map(
        (profileData ?? []).map((profile) => [
          profile.id,
          profile as Profile,
        ])
      );

      const orderedProfiles = ids
        .map((id) => profileMap.get(id))
        .filter(Boolean) as Profile[];

      if (mounted) {
        setProfiles(orderedProfiles);
        setLoading(false);
      }
    }

    loadList();

    return () => {
      mounted = false;
    };
  }, [userId, mode]);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return profiles;

    return profiles.filter((profile) =>
      profile.display_name.toLowerCase().includes(query)
    );
  }, [profiles, search]);

  return (
    <div className="px-5 pb-10 pt-6">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold">
          {mode === "followers"
            ? "Followers"
            : "Following"}
        </h1>

        <p className="mt-1 text-sm text-molla-sub">
          {mode === "followers"
            ? "Creators who follow this artist."
            : "Creators this artist follows."}
        </p>
      </div>

      {profiles.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search creators..."
          className="mb-4 w-full rounded-2xl border border-molla-line bg-white px-4 py-3 text-sm outline-none focus:border-molla-blue"
        />
      )}

      {loading ? (
        <p className="text-sm text-molla-sub">
          Loading...
        </p>
      ) : filteredProfiles.length === 0 ? (
        <div className="rounded-2xl border border-molla-line bg-molla-gray p-6 text-center">
          <p className="text-sm font-bold">
            {search
              ? "No creators found."
              : mode === "followers"
                ? "No followers yet."
                : "Not following anyone yet."}
          </p>

          <p className="mt-1 text-xs text-molla-sub">
            Keep building your network on Molla.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-3 rounded-2xl border border-molla-line bg-white p-3"
            >
              <Link
                href={`/artist/${profile.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-molla-black text-sm font-extrabold text-white">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    profile.display_name
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold">
                    {profile.display_name}
                  </div>

                  {profile.bio && (
                    <div className="mt-0.5 truncate text-xs text-molla-sub">
                      {profile.bio}
                    </div>
                  )}
                </div>
              </Link>

              <FollowButton
                targetUserId={profile.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}