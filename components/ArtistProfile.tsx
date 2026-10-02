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

const socialMeta: { key: keyof SocialLinks; label: string; icon: string }[] = [
  { key: "instagram", label: "Instagram", icon: "📸" },
  { key: "spotify", label: "Spotify", icon: "🎧" },
  { key: "tiktok", label: "TikTok", icon: "🎵" },
  { key: "website", label: "Website", icon: "🔗" },
];

export default function ArtistProfile({ artistId }: { artistId: string }) {
  const router = useRouter();
  const [me, setMe] = useState<string | null>(null);
  const [artist, setArtist] = useState<ArtistProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [connectSent, setConnectSent] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setMe(user?.id ?? null);

      // Viewing your own profile? Send them to the editable Profile screen instead.
      if (user?.id === artistId) {
        router.replace("/profile");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url,bio,location,genres,looking_for,social_links")
        .eq("id", artistId)
        .maybeSingle();
      setArtist(profile as ArtistProfileData | null);

      const { count } = await supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", artistId);
      setFollowerCount(count ?? 0);

      if (user) {
        const { data: myFollow } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", artistId)
          .maybeSingle();
        setFollowing(!!myFollow);

        const { data: myRequest } = await supabase
          .from("artist_connection_requests")
          .select("id")
          .eq("requester_id", user.id)
          .eq("target_id", artistId)
          .maybeSingle();
        setConnectSent(!!myRequest);
      }

      setLoading(false);
    })();
  }, [artistId, router]);

  async function toggleFollow() {
    if (!me) return;
    const supabase = createClient();
    if (following) {
      setFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
      await supabase.from("follows").delete().eq("follower_id", me).eq("following_id", artistId);
    } else {
      setFollowing(true);
      setFollowerCount((c) => c + 1);
      await supabase.from("follows").upsert({ follower_id: me, following_id: artistId });
    }
  }

  async function sendConnect() {
    if (!me || connectSent) return;
    const supabase = createClient();
    setConnectSent(true);
    await supabase
      .from("artist_connection_requests")
      .upsert({ requester_id: me, target_id: artistId });
  }

  if (loading) {
    return <p className="px-5 pt-8 text-sm text-molla-sub">Loading…</p>;
  }

  if (!artist) {
    return (
      <div className="px-5 pt-8">
        <button onClick={() => router.back()} className="text-sm font-bold text-molla-sub mb-4">
          ← Back
        </button>
        <p className="text-sm text-molla-sub">This artist couldn&rsquo;t be found.</p>
      </div>
    );
  }

  const links = artist.social_links ?? {};
  const activeLinks = socialMeta.filter((s) => links[s.key]);

  return (
    <div className="pt-6 pb-10 px-5">
      <button onClick={() => router.back()} className="text-sm font-bold text-molla-sub mb-4">
        ← Back
      </button>

      <div className="text-center">
        <div className="mx-auto mb-3.5 flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-molla-black text-2xl font-extrabold text-white">
          {artist.avatar_url ? (
            <img src={artist.avatar_url} alt={artist.display_name} className="h-full w-full object-cover" />
          ) : (
            artist.display_name.charAt(0).toUpperCase()
          )}
        </div>
        <h2 className="text-lg font-extrabold">{artist.display_name}</h2>
        <p className="text-sm text-molla-sub mt-1">
          Artist{artist.location ? ` · ${artist.location}` : ""}
        </p>
        <p className="text-sm text-molla-sub mt-1">
          {followerCount} follower{followerCount === 1 ? "" : "s"}
        </p>

        {!!artist.genres?.length && (
          <div className="mt-2.5 space-x-1.5">
            {artist.genres.map((tag) => (
              <span key={tag} className="inline-block bg-molla-gray text-xs font-bold px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {artist.bio && <p className="text-sm text-molla-sub mt-4 leading-relaxed text-center">{artist.bio}</p>}

      {activeLinks.length > 0 && (
        <div className="flex justify-center gap-3 mt-4">
          {activeLinks.map((s) => (
            <a
              key={s.key}
              href={links[s.key]}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-molla-gray flex items-center justify-center text-lg"
              title={s.label}
            >
              {s.icon}
            </a>
          ))}
        </div>
      )}

      <div className="flex gap-2.5 mt-6">
        <button
          onClick={toggleFollow}
          disabled={!me}
          className={`flex-1 rounded-2xl py-3.5 font-bold text-sm ${
            following ? "bg-molla-gray text-molla-sub" : "bg-molla-black text-white"
          } disabled:opacity-50`}
        >
          {following ? "Following ✓" : "Follow"}
        </button>
        <button
          onClick={sendConnect}
          disabled={!me || connectSent}
          className={`flex-1 rounded-2xl py-3.5 font-bold text-sm ${
            connectSent ? "bg-molla-gray text-molla-sub" : "bg-molla-blue text-white"
          } disabled:opacity-50`}
        >
          {connectSent ? "Requested" : "Connect"}
        </button>
      </div>

      {!!artist.looking_for?.length && (
        <>
          <div className="text-xs font-extrabold text-molla-sub mt-7 mb-1">LOOKING FOR</div>
          <ul>
            {artist.looking_for.map((s) => (
              <li key={s} className="py-2.5 border-b border-molla-line text-sm font-semibold">
                {s}
              </li>
            ))}
          </ul>
        </>
      )}

      {!me && (
        <p className="text-center text-xs text-molla-sub mt-5">
          <Link href="/login" className="font-bold text-molla-blue">
            Sign in
          </Link>{" "}
          to follow or connect with {artist.display_name}.
        </p>
      )}
    </div>
  );
}
