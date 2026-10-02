"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  user_id: string;
  body: string;
  author: string;
  created_at: string;
};

type Post = {
  id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  media_urls: string[];
  created_at: string;
  author: string;
  authorAvatar: string | null;
  likeCount: number;
  likedByMe: boolean;
  comments: Comment[];
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);

  if (hours < 24) return `${hours}h`;

  return `${Math.floor(hours / 24)}d`;
}

function isVideoUrl(url: string | null | undefined) {
  return !!url && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

function getMediaUrls(post: any): string[] {
  const urls = Array.isArray(post?.media_urls)
    ? post.media_urls.filter(Boolean)
    : [];

  if (post?.image_url && !urls.includes(post.image_url)) {
    urls.unshift(post.image_url);
  }

  return urls;
}

function MediaItem({
  url,
  onOpen,
}: {
  url: string;
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const isVideo = isVideoUrl(url);

  useEffect(() => {
    if (!isVideo || !videoRef.current) return;

    const video = videoRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      {
        threshold: [0, 0.6, 1],
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [isVideo]);

  function toggleMute(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (!videoRef.current) return;

    const nextMuted = !videoRef.current.muted;

    videoRef.current.muted = nextMuted;
    setMuted(nextMuted);
  }

  if (!isVideo) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="block h-full w-full bg-black"
      >
        <img
          src={url}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </button>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        src={url}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        onClick={onOpen}
        className="h-full w-full object-contain"
      />

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-sm text-white backdrop-blur-sm"
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}

function MediaGallery({
  post,
  onOpen,
}: {
  post: Post;
  onOpen: (index: number) => void;
}) {
  const urls = getMediaUrls(post);

  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        <MediaItem url={urls[0]} onOpen={() => onOpen(0)} />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full snap-x snap-mandatory overflow-x-auto bg-black">
      {urls.map((url, index) => (
        <div
          key={`${post.id}-${index}-${url}`}
          className="h-full min-w-full snap-center"
        >
          <MediaItem
            url={url}
            onOpen={() => onOpen(index)}
          />
        </div>
      ))}
    </div>
  );
}

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<
    { file: File; url: string }[]
  >([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [posting, setPosting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalPostId, setModalPostId] = useState<string | null>(null);
  const [modalMediaIndex, setModalMediaIndex] = useState(0);

  const [openComments, setOpenComments] = useState<Set<string>>(
    new Set()
  );

  const [commentDrafts, setCommentDrafts] = useState<
    Record<string, string>
  >({});

  const [reportPostId, setReportPostId] = useState<string | null>(
    null
  );
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportError, setReportError] = useState<string | null>(
    null
  );
  const [reporting, setReporting] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);

  async function load() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setMyId(user?.id ?? null);

    const { data: rawPosts } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    const ids = (rawPosts ?? []).map((post) => post.id);

    const userIds = new Set(
      (rawPosts ?? []).map((post) => post.user_id)
    );

    const [{ data: likes }, { data: comments }] = await Promise.all([
      ids.length
        ? supabase
            .from("post_likes")
            .select("post_id,user_id")
            .in("post_id", ids)
        : Promise.resolve({ data: [] as any[] }),

      ids.length
        ? supabase
            .from("post_comments")
            .select("id,post_id,user_id,body,created_at")
            .in("post_id", ids)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] as any[] }),
    ]);

    (comments ?? []).forEach((comment) => {
      userIds.add(comment.user_id);
    });

    const { data: profiles } = userIds.size
      ? await supabase
          .from("profiles")
          .select("id,display_name,avatar_url")
          .in("id", Array.from(userIds))
      : { data: [] as any[] };

    const nameOf = (id: string) =>
      profiles?.find((profile) => profile.id === id)
        ?.display_name ?? "Artist";

    const avatarOf = (id: string) =>
      profiles?.find((profile) => profile.id === id)
        ?.avatar_url ?? null;

    const merged: Post[] = (rawPosts ?? []).map((post) => {
      const mediaUrls = getMediaUrls(post);

      return {
        id: post.id,
        user_id: post.user_id,
        body: post.body,
        image_url: mediaUrls[0] ?? post.image_url ?? null,
        media_urls: mediaUrls,
        created_at: post.created_at,
        author: nameOf(post.user_id),
        authorAvatar: avatarOf(post.user_id),

        likeCount: (likes ?? []).filter(
          (like) => like.post_id === post.id
        ).length,

        likedByMe: (likes ?? []).some(
          (like) =>
            like.post_id === post.id &&
            like.user_id === user?.id
        ),

        comments: (comments ?? [])
          .filter((comment) => comment.post_id === post.id)
          .map((comment) => ({
            ...comment,
            author: nameOf(comment.user_id),
          })),
      };
    });

    setPosts(merged);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  function pickMedia() {
    fileInput.current?.click();
  }

  function onMediaChosen(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (files.length) {
      handleSelectedMedia(files);
    }
  }

  function handleSelectedMedia(files: File[]) {
    setMediaError(null);

    const maxBytes = 30 * 1024 * 1024;
    const maxFiles = 10;

    const invalidFile = files.find(
      (file) => !/^(image|video)\//.test(file.type)
    );

    if (invalidFile) {
      setMediaError(
        `${invalidFile.name} : format non supporté.`
      );
      return;
    }

    const oversizedFile = files.find(
      (file) => file.size > maxBytes
    );

    if (oversizedFile) {
      setMediaError(
        `${oversizedFile.name} dépasse la limite de 30 MB.`
      );
      return;
    }

    if (mediaFiles.length + files.length > maxFiles) {
      setMediaError(
        `Un post peut contenir au maximum ${maxFiles} médias.`
      );
      return;
    }

    const previews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setMediaFiles((current) => [...current, ...files]);

    setMediaPreviews((current) => [
      ...current,
      ...previews,
    ]);
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    const files = Array.from(
      event.dataTransfer.files ?? []
    );

    if (files.length) {
      handleSelectedMedia(files);
    }
  }

  function onDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(true);
  }

  function onDragLeave() {
    setDragActive(false);
  }

  function removeMedia(index: number) {
    const preview = mediaPreviews[index];

    if (preview) {
      URL.revokeObjectURL(preview.url);
    }

    setMediaFiles((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );

    setMediaPreviews((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );

    setMediaError(null);
  }

  async function submitPost() {
    if (!text.trim() && mediaFiles.length === 0) return;

    setPosting(true);
    setMediaError(null);

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Connectez-vous avant de publier."
        );
      }

      const mediaUrls = await Promise.all(
        mediaFiles.map(async (file, index) => {
          const path = `${user.id}/${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2)}-${file.name}`;

          const { error } = await supabase.storage
            .from("post-images")
            .upload(path, file);

          if (error) {
            throw new Error(
              `Échec de l'envoi de ${file.name} : ${error.message}`
            );
          }

          return supabase.storage
            .from("post-images")
            .getPublicUrl(path).data.publicUrl;
        })
      );

      const { error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          body: text.trim(),
          image_url: mediaUrls[0] ?? null,
          media_urls: mediaUrls,
        });

      if (insertError) {
        throw new Error(
          `Le post n'a pas été enregistré : ${insertError.message}`
        );
      }

      mediaPreviews.forEach(({ url }) => {
        URL.revokeObjectURL(url);
      });

      setText("");
      setMediaFiles([]);
      setMediaPreviews([]);

      await load();
    } catch (error) {
      setMediaError(
        error instanceof Error
          ? error.message
          : "La publication a échoué. Réessayez."
      );
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(post: Post) {
    const supabase = createClient();

    if (!myId) return;

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              likedByMe: !item.likedByMe,
              likeCount:
                item.likeCount +
                (item.likedByMe ? -1 : 1),
            }
          : item
      )
    );

    if (post.likedByMe) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", myId);
    } else {
      await supabase
        .from("post_likes")
        .upsert({
          post_id: post.id,
          user_id: myId,
        });
    }
  }

  function toggleComments(postId: string) {
    setOpenComments((current) => {
      const next = new Set(current);

      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }

      return next;
    });
  }

  async function submitComment(postId: string) {
    const body = (
      commentDrafts[postId] || ""
    ).trim();

    if (!body || !myId) return;

    const supabase = createClient();

    setCommentDrafts((current) => ({
      ...current,
      [postId]: "",
    }));

    await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: myId,
      body,
    });

    await load();
  }

  async function deletePost(post: Post) {
    if (!myId || post.user_id !== myId) {
      return;
    }

    if (!window.confirm("Supprimer cette publication ?")) {
      return;
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id)
      .eq("user_id", myId);

    if (error) {
      setMediaError(
        `Suppression impossible : ${error.message}`
      );
      return;
    }

    setPosts((current) =>
      current.filter((item) => item.id !== post.id)
    );
  }

  async function submitReport() {
    if (!reportPostId || !myId) return;

    setReporting(true);
    setReportError(null);

    const supabase = createClient();

    const { error } = await supabase
      .from("post_reports")
      .insert({
        post_id: reportPostId,
        reporter_id: myId,
        reason: reportReason,
        details: reportDetails.trim() || null,
      });

    setReporting(false);

    if (error) {
      setReportError(
        error.code === "23505"
          ? "Vous avez déjà signalé cette publication."
          : error.message
      );
      return;
    }

    setReportPostId(null);
    setReportDetails("");
    setReportError(null);
  }

  function openModal(
    postId: string,
    mediaIndex = 0
  ) {
    setModalPostId(postId);
    setModalMediaIndex(mediaIndex);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalPostId(null);
    setModalMediaIndex(0);
  }

  function nextModalMedia() {
    if (!modalPostId) return;

    const post = posts.find(
      (item) => item.id === modalPostId
    );

    if (!post) return;

    const urls = getMediaUrls(post);

    if (urls.length === 0) return;

    setModalMediaIndex(
      (current) => (current + 1) % urls.length
    );
  }

  function prevModalMedia() {
    if (!modalPostId) return;

    const post = posts.find(
      (item) => item.id === modalPostId
    );

    if (!post) return;

    const urls = getMediaUrls(post);

    if (urls.length === 0) return;

    setModalMediaIndex(
      (current) =>
        (current - 1 + urls.length) % urls.length
    );
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (!modalOpen) return;

      if (event.key === "Escape") {
        closeModal();
      }

      if (event.key === "ArrowRight") {
        nextModalMedia();
      }

      if (event.key === "ArrowLeft") {
        prevModalMedia();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [modalOpen, modalPostId, posts]);

  const activeModalPost = modalPostId
    ? posts.find(
        (post) => post.id === modalPostId
      ) ?? null
    : null;

  const activeModalMedia = activeModalPost
    ? getMediaUrls(activeModalPost)
    : [];

  const activeModalUrl =
    activeModalMedia[modalMediaIndex] ?? null;

  return (
    <div className="mt-4 pb-24">
      <div className="mx-auto max-w-md">
        <div className="px-4 pb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-molla-sub">
          Community
        </div>

        {/* Composer */}
        <div
          className={`mx-4 rounded-[28px] border border-molla-line bg-white/90 p-3 shadow-[0_12px_24px_rgba(11,13,16,0.04)] backdrop-blur-sm ${
            dragActive
              ? "border-2 border-molla-blue"
              : ""
          }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <textarea
            value={text}
            onChange={(event) =>
              setText(event.target.value)
            }
            placeholder="Share your latest drop…"
            rows={2}
            className="w-full resize-none bg-transparent text-sm text-molla-black outline-none placeholder:text-molla-sub"
          />

          {mediaPreviews.length > 0 && (
            <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
              {mediaPreviews.map(
                ({ file, url }, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative h-36 w-28 flex-none overflow-hidden rounded-xl bg-molla-black"
                  >
                    {file.type.startsWith("video/") ? (
                      <video
                        src={url}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        removeMedia(index)
                      }
                      aria-label={`Supprimer ${file.name}`}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-sm text-white"
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          )}

          {mediaError && (
            <div className="mt-2 text-xs text-red-600">
              {mediaError}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={pickMedia}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-molla-black text-base text-white"
              >
                ＋
              </button>

              <span className="text-[10px] uppercase tracking-[0.15em] text-molla-sub">
                Media
              </span>
            </div>

            <input
              ref={fileInput}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={onMediaChosen}
            />

            <button
              type="button"
              onClick={() => void submitPost()}
              disabled={
                posting ||
                (!text.trim() &&
                  mediaFiles.length === 0)
              }
              className="rounded-full bg-molla-yellow px-4 py-2 text-xs font-bold text-molla-black disabled:opacity-40"
            >
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <p className="mx-auto max-w-md px-4 py-6 text-sm text-molla-sub">
          Loading…
        </p>
      )}

      {!loading && posts.length === 0 && (
        <p className="mx-auto max-w-md px-4 py-6 text-sm text-molla-sub">
          No posts yet — be the first to share something.
        </p>
      )}

      {/* Main vertical feed */}
      {!loading && posts.length > 0 && (
        <div className="mx-auto mt-4 h-[calc(100dvh-220px)] min-h-[560px] max-w-md snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth">
          {posts.map((post) => {
            const urls = getMediaUrls(post);
            const hasMedia = urls.length > 0;

            return (
              <article
                key={post.id}
                className="min-h-full snap-start snap-always px-2 pb-4"
              >
                <div
                  className={`relative flex min-h-full flex-col overflow-hidden rounded-[28px] shadow-[0_14px_28px_rgba(11,13,16,0.10)] ${
                    hasMedia
                      ? "bg-molla-black"
                      : "border border-molla-line bg-white"
                  }`}
                >
                  {hasMedia ? (
                    <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
                      <MediaGallery
                        post={post}
                        onOpen={(index) =>
                          openModal(post.id, index)
                        }
                      />

                      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/65 to-transparent" />

                      {/* Author */}
                      <div className="absolute left-4 right-4 top-4 flex items-center gap-3 text-white">
                        <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-white/15 text-xs font-bold backdrop-blur-sm">
                          {post.authorAvatar ? (
                            <img
                              src={post.authorAvatar}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            post.author
                              .charAt(0)
                              .toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold">
                            {post.author}
                          </p>

                          <p className="text-[11px] text-white/70">
                            {timeAgo(post.created_at)}
                          </p>
                        </div>

                        {post.user_id === myId ? (
                          <button
                            type="button"
                            onClick={() =>
                              void deletePost(post)
                            }
                            className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
                          >
                            Delete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReportPostId(post.id);
                              setReportError(null);
                            }}
                            className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
                          >
                            Report
                          </button>
                        )}
                      </div>

                      {urls.length > 1 && (
                        <div className="pointer-events-none absolute right-4 top-20 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                          {urls.length} media
                        </div>
                      )}

                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                      {/* Bottom information */}
                      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <div className="flex items-end gap-4">
                          <div className="min-w-0 flex-1">
                            {post.body && (
                              <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed">
                                {post.body}
                              </p>
                            )}

                            <div className="flex items-center gap-2 text-[11px] text-white/70">
                              <span>Music Creator</span>
                              <span>•</span>
                              <span>
                                {timeAgo(
                                  post.created_at
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-none flex-col items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                void toggleLike(post)
                              }
                              className={`flex h-11 w-11 flex-col items-center justify-center rounded-full bg-black/45 backdrop-blur-sm ${
                                post.likedByMe
                                  ? "text-molla-blue"
                                  : "text-white"
                              }`}
                            >
                              <span className="text-xl leading-none">
                                {post.likedByMe
                                  ? "♥"
                                  : "♡"}
                              </span>

                              <span className="mt-0.5 text-[9px] font-bold">
                                {post.likeCount}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                toggleComments(
                                  post.id
                                )
                              }
                              className="flex h-11 w-11 flex-col items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
                            >
                              <span className="text-lg leading-none">
                                💬
                              </span>

                              <span className="mt-0.5 text-[9px] font-bold">
                                {post.comments.length}
                              </span>
                            </button>
                          </div>
                        </div>

                        {openComments.has(post.id) && (
                          <div className="pointer-events-auto mt-3 rounded-2xl bg-black/60 p-3 backdrop-blur-md">
                            <div className="max-h-32 overflow-y-auto">
                              {post.comments.length ===
                              0 ? (
                                <p className="text-xs text-white/60">
                                  No comments yet.
                                </p>
                              ) : (
                                post.comments.map(
                                  (comment) => (
                                    <div
                                      key={comment.id}
                                      className="mb-2 text-xs"
                                    >
                                      <span className="font-extrabold">
                                        {
                                          comment.author
                                        }
                                      </span>{" "}
                                      <span className="text-white/75">
                                        {comment.body}
                                      </span>
                                    </div>
                                  )
                                )
                              )}
                            </div>

                            <div className="mt-2 flex gap-2">
                              <input
                                value={
                                  commentDrafts[
                                    post.id
                                  ] || ""
                                }
                                onChange={(event) =>
                                  setCommentDrafts(
                                    (current) => ({
                                      ...current,
                                      [post.id]:
                                        event.target
                                          .value,
                                    })
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key ===
                                    "Enter"
                                  ) {
                                    void submitComment(
                                      post.id
                                    );
                                  }
                                }}
                                placeholder="Add a comment…"
                                className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white outline-none placeholder:text-white/50"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  void submitComment(
                                    post.id
                                  )
                                }
                                className="rounded-full bg-molla-blue px-3 text-sm font-bold text-white"
                              >
                                ➤
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Text-only post */
                    <div className="flex min-h-full flex-col p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-molla-black text-xs font-bold text-white">
                          {post.authorAvatar ? (
                            <img
                              src={post.authorAvatar}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            post.author
                              .charAt(0)
                              .toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold">
                            {post.author}
                          </p>

                          <p className="text-[11px] text-molla-sub">
                            {timeAgo(post.created_at)}
                          </p>
                        </div>

                        {post.user_id === myId ? (
                          <button
                            type="button"
                            onClick={() =>
                              void deletePost(post)
                            }
                            className="px-2 py-1 text-xs font-semibold text-red-600"
                          >
                            Delete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReportPostId(post.id);
                              setReportError(null);
                            }}
                            className="px-2 py-1 text-xs font-semibold text-molla-sub"
                          >
                            Report
                          </button>
                        )}
                      </div>

                      {post.body && (
                        <div className="flex flex-1 items-center">
                          <p className="w-full whitespace-pre-wrap text-lg leading-relaxed text-molla-black">
                            {post.body}
                          </p>
                        </div>
                      )}

                      <div className="mt-auto flex items-center gap-5 border-t border-molla-line pt-4 text-sm">
                        <button
                          type="button"
                          onClick={() =>
                            void toggleLike(post)
                          }
                          className={`font-bold ${
                            post.likedByMe
                              ? "text-molla-blue"
                              : "text-molla-sub"
                          }`}
                        >
                          {post.likedByMe
                            ? "♥"
                            : "♡"}{" "}
                          {post.likeCount}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleComments(post.id)
                          }
                          className="font-bold text-molla-sub"
                        >
                          💬 {post.comments.length}
                        </button>
                      </div>

                      {openComments.has(post.id) && (
                        <div className="mt-3 border-t border-molla-line pt-3">
                          <div className="max-h-40 overflow-y-auto">
                            {post.comments.map(
                              (comment) => (
                                <div
                                  key={comment.id}
                                  className="mb-2 text-sm"
                                >
                                  <span className="font-extrabold">
                                    {comment.author}
                                  </span>{" "}
                                  <span className="text-molla-sub">
                                    {comment.body}
                                  </span>
                                </div>
                              )
                            )}
                          </div>

                          <div className="mt-2 flex gap-2">
                            <input
                              value={
                                commentDrafts[
                                  post.id
                                ] || ""
                              }
                              onChange={(event) =>
                                setCommentDrafts(
                                  (current) => ({
                                    ...current,
                                    [post.id]:
                                      event.target.value,
                                  })
                                )
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key ===
                                  "Enter"
                                ) {
                                  void submitComment(
                                    post.id
                                  );
                                }
                              }}
                              placeholder="Add a comment…"
                              className="min-w-0 flex-1 rounded-full border border-molla-line bg-molla-black/5 px-3 py-2 text-sm outline-none"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                void submitComment(
                                  post.id
                                )
                              }
                              className="rounded-full bg-molla-blue px-3 text-sm font-bold text-white"
                            >
                              ➤
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Report modal */}
      {reportPostId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitReport();
            }}
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold">
                Report publication
              </h2>

              <button
                type="button"
                onClick={() =>
                  setReportPostId(null)
                }
                aria-label="Close"
                className="text-xl text-molla-sub"
              >
                ×
              </button>
            </div>

            <label
              className="mt-4 block text-sm font-semibold"
              htmlFor="report-reason"
            >
              Reason
            </label>

            <select
              id="report-reason"
              value={reportReason}
              onChange={(event) =>
                setReportReason(event.target.value)
              }
              className="mt-1 w-full rounded-xl border border-molla-line bg-white px-3 py-2 text-sm"
            >
              <option value="spam">Spam</option>
              <option value="harassment">
                Harassment
              </option>
              <option value="inappropriate">
                Inappropriate content
              </option>
              <option value="other">Other</option>
            </select>

            <label
              className="mt-3 block text-sm font-semibold"
              htmlFor="report-details"
            >
              Details (optional)
            </label>

            <textarea
              id="report-details"
              value={reportDetails}
              onChange={(event) =>
                setReportDetails(
                  event.target.value.slice(0, 500)
                )
              }
              rows={3}
              className="mt-1 w-full resize-none rounded-xl border border-molla-line px-3 py-2 text-sm"
            />

            {reportError && (
              <p
                role="alert"
                className="mt-2 text-sm text-red-600"
              >
                {reportError}
              </p>
            )}

            <button
              type="submit"
              disabled={reporting}
              className="mt-4 w-full rounded-full bg-molla-black px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {reporting
                ? "Sending…"
                : "Send report"}
            </button>
          </form>
        </div>
      )}

      {/* Fullscreen viewer */}
      {modalOpen &&
        activeModalPost &&
        activeModalUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3">
            <div className="relative h-full w-full max-w-md">
              <button
                type="button"
                onClick={closeModal}
                className="absolute right-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-xl text-white"
                aria-label="Close"
              >
                ×
              </button>

              {activeModalMedia.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevModalMedia}
                    className="absolute left-2 top-1/2 z-20 -translate-y-1/2 text-4xl text-white"
                    aria-label="Previous"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={nextModalMedia}
                    className="absolute right-2 top-1/2 z-20 -translate-y-1/2 text-4xl text-white"
                    aria-label="Next"
                  >
                    ›
                  </button>
                </>
              )}

              <div className="flex h-full items-center justify-center overflow-hidden rounded-[28px] bg-black">
                {isVideoUrl(activeModalUrl) ? (
                  <video
                    src={activeModalUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-full w-full object-contain"
                  />
                ) : (
                  <img
                    src={activeModalUrl}
                    alt=""
                    className="max-h-full w-full object-contain"
                  />
                )}
              </div>

              {activeModalMedia.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {activeModalMedia.map(
                    (url, index) => (
                      <button
                        type="button"
                        key={`${activeModalPost.id}-${index}-${url}`}
                        onClick={() =>
                          setModalMediaIndex(index)
                        }
                        className={`h-2 w-2 rounded-full ${
                          index === modalMediaIndex
                            ? "bg-white"
                            : "bg-white/40"
                        }`}
                        aria-label={`Media ${
                          index + 1
                        }`}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}