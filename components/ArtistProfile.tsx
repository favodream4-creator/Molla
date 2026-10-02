"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type SocialLinks = {
  instagram?: string;
  spotify?: string;
  tiktok?: string;
  website?: string;
};

type ArtistProfileData = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  genres: string[] | null;
  looking_for: string[] | null;
  social_links: SocialLinks | null;
};

const socialMeta: {
  key: keyof SocialLinks;
  label: string;
  icon: string;
}[] = [
  { key: "instagram", label: "Instagram", icon: "📸" },
  { key: "spotify", label: "Spotify", icon: "🎧" },
  { key: "tiktok", label: "TikTok", icon: "🎵" },
  { key: "website", label: "Website", icon: "🔗" },
];

export default function ArtistProfile({
  artistId,
}: {
  artistId: string;
}) {
  const router = useRouter();

  const [me, setMe] = useState<string | null>(null);
  const [artist, setArtist] = useState<ArtistProfileData | null>(null);

  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [following, setFollowing] = useState(false);
  const [connectSent, setConnectSent] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const supabase = createClient();

      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setMe(user?.id ?? null);

      // If viewing your own profile, use the editable profile page.
      if (user?.id === artistId) {
        router.replace("/profile");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          "id,display_name,avatar_url,bio,location,genres,looking_for,social_links"
        )
        .eq("id", artistId)
        .maybeSingle();

      if (!mounted) return;

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      setArtist(profile as ArtistProfileData | null);

      // Followers
      const { count: followers } = await supabase
        .from("follows")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("following_id", artistId);

      if (!mounted) return;

      setFollowerCount(followers ?? 0);

      // Following
      const { count: followingTotal } = await supabase
        .from("follows")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("follower_id", artistId);

      if (!mounted) return;

      setFollowingCount(followingTotal ?? 0);

      if (user) {
        // Does current user follow this artist?
        const { data: myFollow } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", artistId)
          .maybeSingle();

        if (!mounted) return;

        setFollowing(!!myFollow);

        // Existing connection request
        const { data: myRequest } = await supabase
          .from("artist_connection_requests")
          .select("id")
          .eq("requester_id", user.id)
          .eq("target_id", artistId)
          .maybeSingle();

        if (!mounted) return;

        setConnectSent(!!myRequest);
      }

      setLoading(false);
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [artistId, router]);

  async function toggleFollow() {
    if (!me || followLoading) return;

    const supabase = createClient();

    const previousFollowing = following;
    const previousCount = followerCount;

    const nextFollowing = !previousFollowing;

    setFollowLoading(true);

    // Optimistic UI
    setFollowing(nextFollowing);

    setFollowerCount((count) =>
      nextFollowing ? count + 1 : Math.max(0, count - 1)
    );

    if (nextFollowing) {
      const { error } = await supabase.from("follows").insert({
        follower_id: me,
        following_id: artistId,
      });

      if (error) {
        console.error("Follow error:", error);

        // Rollback UI
        setFollowing(previousFollowing);
        setFollowerCount(previousCount);
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", me)
        .eq("following_id", artistId);

      if (error) {
        console.error("Unfollow error:", error);

        // Rollback UI
        setFollowing(previousFollowing);
        setFollowerCount(previousCount);
      }
    }

    setFollowLoading(false);
  }

  async function sendConnect() {
    if (!me || connectSent || connectLoading) return;

    const supabase = createClient();

    setConnectLoading(true);

    const { error } = await supabase
      .from("artist_connection_requests")
      .upsert(
        {
          requester_id: me,
          target_id: artistId,
        },
        {
          onConflict: "requester_id,target_id",
        }
      );

    if (error) {
      console.error("Connection request error:", error);
    } else {
      setConnectSent(true);
    }

    setConnectLoading(false);
  }

  if (loading) {
    return (
      <div className="px-5 pt-8">
        <p className="text-sm text-molla-sub">Loading…</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="px-5 pt-8">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm font-bold text-molla-sub"
        >
          ← Back
        </button>

        <p className="text-sm text-molla-sub">
          This artist couldn&rsquo;t be found.
        </p>
      </div>
    );
  }

  const links = artist.social_links ?? {};

  const activeLinks = socialMeta.filter(
    (social) => links[social.key]
  );

  return (
    <div className="px-5 pb-10 pt-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm font-bold text-molla-sub"
      >
        ← Back
      </button>

      {/* Artist Header */}
      <div className="text-center">
        <div className="mx-auto mb-3.5 flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-molla-black text-2xl font-extrabold text-white">
          {artist.avatar_url ? (
            <img
              src={artist.avatar_url}
              alt={artist.display_name}
              className="h-full w-full object-cover"
            />
          ) : (
            artist.display_name.charAt(0).toUpperCase()
          )}
        </div>

        <h2 className="text-lg font-extrabold">
          {artist.display_name}
        </h2>

        <p className="mt-1 text-sm text-molla-sub">
          Artist
          {artist.location ? ` · ${artist.location}` : ""}
        </p>

        {/* Social Stats */}
        <div className="mt-4 flex items-center justify-center gap-8">
  <Link
    href={`/artist/${artistId}/followers`}
    className="text-center transition-opacity hover:opacity-70"
  >
    <div className="text-base font-extrabold">
      {followerCount}
    </div>

    <div className="text-xs text-molla-sub">
      Followers
    </div>
  </Link>

  <div className="h-8 w-px bg-molla-line" />

  <Link
    href={`/artist/${artistId}/following`}
    className="text-center transition-opacity hover:opacity-70"
  >
    <div className="text-base font-extrabold">
      {followingCount}
    </div>

    <div className="text-xs text-molla-sub">
      Following
    </div>
  </Link>
</div>

        {/* Genres */}
        {!!artist.genres?.length && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {artist.genres.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-molla-gray px-3 py-1.5 text-xs font-bold"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bio */}
      {artist.bio && (
        <p className="mt-4 text-center text-sm leading-relaxed text-molla-sub">
          {artist.bio}
        </p>
      )}

      {/* Social Links */}
      {activeLinks.length > 0 && (
        <div className="mt-4 flex justify-center gap-3">
          {activeLinks.map((social) => (
            <a
              key={social.key}
              href={links[social.key]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-molla-gray text-lg"
              title={social.label}
              aria-label={social.label}
            >
              {social.icon}
            </a>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-2.5">
        <button
          type="button"
          onClick={toggleFollow}
          disabled={!me || followLoading}
          className={`flex-1 rounded-2xl py-3.5 text-sm font-bold transition ${
            following
              ? "bg-molla-gray text-molla-sub"
              : "bg-molla-black text-white"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {followLoading
            ? "..."
            : following
              ? "Following ✓"
              : "Follow"}
        </button>

        <button
          type="button"
          onClick={sendConnect}
          disabled={!me || connectSent || connectLoading}
          className={`flex-1 rounded-2xl py-3.5 text-sm font-bold transition ${
            connectSent
              ? "bg-molla-gray text-molla-sub"
              : "bg-molla-blue text-white"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {connectLoading
            ? "..."
            : connectSent
              ? "Requested"
              : "Connect"}
        </button>
      </div>

      {/* Looking For */}
      {!!artist.looking_for?.length && (
        <>
          <div className="mb-1 mt-7 text-xs font-extrabold text-molla-sub">
            LOOKING FOR
          </div>

          <ul>
            {artist.looking_for.map((item) => (
              <li
                key={item}
                className="border-b border-molla-line py-2.5 text-sm font-semibold"
              >
                {item}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Login CTA */}
      {!me && (
        <p className="mt-5 text-center text-xs text-molla-sub">
          <Link
            href="/login"
            className="font-bold text-molla-blue"
          >
            Sign in
          </Link>{" "}
          to follow or connect with {artist.display_name}.
        </p>
      )}
    </div>
  );
}