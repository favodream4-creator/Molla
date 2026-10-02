"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FollowButtonProps = {
  targetUserId: string;
  onFollowChange?: (following: boolean) => void;
};

export default function FollowButton({
  targetUserId,
  onFollowChange,
}: FollowButtonProps) {
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadFollowState() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setCurrentUserId(null);
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      if (user.id === targetUserId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

      if (!mounted) return;

      if (!error) {
        setIsFollowing(!!data);
      }

      setLoading(false);
    }

    loadFollowState();

    return () => {
      mounted = false;
    };
  }, [targetUserId]);

  async function toggleFollow() {
    if (!currentUserId || actionLoading) return;

    if (currentUserId === targetUserId) return;

    setActionLoading(true);

    const previousState = isFollowing;
    const nextState = !previousState;

    // Optimistic UI
    setIsFollowing(nextState);
    onFollowChange?.(nextState);

    if (nextState) {
      const { error } = await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: targetUserId,
      });

      if (error) {
        console.error("Follow error:", error);

        setIsFollowing(previousState);
        onFollowChange?.(previousState);
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId);

      if (error) {
        console.error("Unfollow error:", error);

        setIsFollowing(previousState);
        onFollowChange?.(previousState);
      }
    }

    setActionLoading(false);
  }

  // Don't show Follow button on your own profile
  if (currentUserId === targetUserId) {
    return null;
  }

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-500"
      >
        ...
      </button>
    );
  }

  if (!currentUserId) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={actionLoading}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
        isFollowing
          ? "border border-gray-300 bg-white text-gray-900"
          : "bg-black text-white hover:bg-gray-800"
      } ${actionLoading ? "cursor-wait opacity-60" : ""}`}
    >
      {actionLoading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}