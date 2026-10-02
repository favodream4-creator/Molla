"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  actor_id: string | null;
  type: string;
  post_id: string | null;
  read_at: string | null;
  created_at: string;
};

type Actor = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

type NotificationItem = Notification & {
  actor: Actor | null;
};

function getNotificationText(notification: NotificationItem) {
  const name = notification.actor?.display_name ?? "Someone";

  switch (notification.type) {
    case "follow":
      return `${name} started following you.`;

    case "like":
      return `${name} liked your post.`;

    case "comment":
      return `${name} commented on your post.`;

    case "connection_request":
      return `${name} sent you a connection request.`;

    case "connection_accepted":
      return `${name} accepted your connection request.`;

    default:
      return `${name} interacted with you.`;
  }
}

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const seconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString();
}

export default function NotificationList() {
  const supabase = createClient();

  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mounted) {
          setNotifications([]);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id,actor_id,type,post_id,read_at,created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(50);

      if (error) {
        console.error("Notifications error:", error);

        if (mounted) {
          setNotifications([]);
          setLoading(false);
        }

        return;
      }

      const rows = (data ?? []) as Notification[];

      const actorIds = Array.from(
        new Set(
          rows
            .map((notification) => notification.actor_id)
            .filter(Boolean) as string[]
        )
      );

      let actors: Actor[] = [];

      if (actorIds.length > 0) {
        const { data: actorData, error: actorError } =
          await supabase
            .from("profiles")
            .select("id,display_name,avatar_url")
            .in("id", actorIds);

        if (actorError) {
          console.error(
            "Notification actors error:",
            actorError
          );
        } else {
          actors = (actorData ?? []) as Actor[];
        }
      }

      const actorMap = new Map(
        actors.map((actor) => [actor.id, actor])
      );

      const items = rows.map((notification) => ({
        ...notification,
        actor: notification.actor_id
          ? actorMap.get(notification.actor_id) ?? null
          : null,
      }));

      if (mounted) {
        setNotifications(items);
        setLoading(false);
      }
    }

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  async function markAsRead(id: string) {
    const now = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read_at: now,
            }
          : notification
      )
    );

    const { error } = await supabase
      .from("notifications")
      .update({
        read_at: now,
      })
      .eq("id", id);

    if (error) {
      console.error("Mark notification read error:", error);
    }
  }

  async function markAllAsRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const now = new Date().toISOString();

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? now,
      }))
    );

    const { error } = await supabase
      .from("notifications")
      .update({
        read_at: now,
      })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.read_at
  ).length;

  if (loading) {
    return (
      <div className="px-5 pt-8">
        <p className="text-sm text-molla-sub">
          Loading notifications...
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pb-10 pt-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-molla-sub">
            Stay up to date with your Molla network.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-xs font-bold text-molla-blue"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-molla-line bg-molla-gray p-7 text-center">
          <div className="text-2xl">🔔</div>

          <p className="mt-3 text-sm font-bold">
            No notifications yet.
          </p>

          <p className="mt-1 text-xs text-molla-sub">
            Your activity will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const content = (
              <div
                className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                  notification.read_at
                    ? "border-molla-line bg-white"
                    : "border-molla-line bg-molla-gray"
                }`}
                onClick={() =>
                  !notification.read_at &&
                  markAsRead(notification.id)
                }
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-molla-black text-sm font-extrabold text-white">
                  {notification.actor?.avatar_url ? (
                    <img
                      src={notification.actor.avatar_url}
                      alt={
                        notification.actor.display_name
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (
                      notification.actor?.display_name ??
                      "?"
                    )
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {getNotificationText(notification)}
                  </p>

                  <p className="mt-1 text-xs text-molla-sub">
                    {getTimeAgo(notification.created_at)}
                  </p>
                </div>

                {!notification.read_at && (
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-molla-blue" />
                )}
              </div>
            );

            if (
              notification.type === "follow" &&
              notification.actor_id
            ) {
              return (
                <Link
                  key={notification.id}
                  href={`/artist/${notification.actor_id}`}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={notification.id}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}    