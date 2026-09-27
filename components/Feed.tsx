"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Post = {
  id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  media_urls: string[];
  created_at: string;
  author: string;
  likeCount: number;
  likedByMe: boolean;
  comments: { id: string; user_id: string; body: string; author: string; created_at: string }[];
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

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [posting, setPosting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
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

    const ids = (rawPosts ?? []).map((p) => p.id);
    const userIds = new Set((rawPosts ?? []).map((p) => p.user_id));

    const [{ data: likes }, { data: comments }] = await Promise.all([
      ids.length
        ? supabase.from("post_likes").select("post_id,user_id").in("post_id", ids)
        : Promise.resolve({ data: [] as any[] }),
      ids.length
        ? supabase
            .from("post_comments")
            .select("id,post_id,user_id,body,created_at")
            .in("post_id", ids)
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] as any[] }),
    ]);

    (comments ?? []).forEach((c) => userIds.add(c.user_id));

    const { data: profiles } = userIds.size
      ? await supabase.from("profiles").select("id,display_name").in("id", Array.from(userIds))
      : { data: [] as any[] };
    const nameOf = (id: string) =>
      profiles?.find((p) => p.id === id)?.display_name ?? "Artist";

    const merged: Post[] = (rawPosts ?? []).map((p) => {
      const mediaUrls = getMediaUrls(p);
      return {
        id: p.id,
        user_id: p.user_id,
        body: p.body,
        image_url: mediaUrls[0] ?? p.image_url ?? null,
        media_urls: mediaUrls,
        created_at: p.created_at,
        author: nameOf(p.user_id),
        likeCount: (likes ?? []).filter((l) => l.post_id === p.id).length,
        likedByMe: (likes ?? []).some((l) => l.post_id === p.id && l.user_id === user?.id),
        comments: (comments ?? [])
          .filter((c) => c.post_id === p.id)
          .map((c) => ({ ...c, author: nameOf(c.user_id) })),
      };
    });

    setPosts(merged);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  function pickMedia() {
    fileInput.current?.click();
  }

  function onMediaChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleSelectedMedia(file);
  }

  function handleSelectedMedia(file: File) {
    setMediaError(null);
    const maxBytes = 30 * 1024 * 1024; // 30 MB
    const allowed = /^(image|video)\//;
    if (!allowed.test(file.type)) {
      setMediaError("Format non supporté — utilisez une image ou une vidéo.");
      return;
    }
    if (file.size > maxBytes) {
      setMediaError("Fichier trop volumineux (max 30MB).");
      return;
    }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(file.type);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    handleSelectedMedia(file);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(true);
  }

  function onDragLeave() {
    setDragActive(false);
  }

  function removeMedia() {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setMediaError(null);
  }

  const mediaPosts = posts.filter((p) => (p.media_urls?.length ?? 0) > 0 || !!p.image_url);

  function openModalForPost(postId: string) {
    const idx = mediaPosts.findIndex((p) => p.id === postId);
    if (idx === -1) return;
    setModalIndex(idx);
    setModalOpen(true);
  }

  function nextModal() {
    if (mediaPosts.length === 0) return;
    setModalIndex((i) => (i + 1) % mediaPosts.length);
  }

  function prevModal() {
    if (mediaPosts.length === 0) return;
    setModalIndex((i) => (i - 1 + mediaPosts.length) % mediaPosts.length);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!modalOpen) return;
      if (e.key === "Escape") setModalOpen(false);
      if (e.key === "ArrowRight") nextModal();
      if (e.key === "ArrowLeft") prevModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, mediaPosts.length]);

  async function submitPost() {
    if (!text.trim() && !mediaFile) return;
    setPosting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPosting(false);
      return;
    }

    let image_url: string | null = null;
    if (mediaFile) {
      const path = `${user.id}/${Date.now()}-${mediaFile.name}`;
      const { error: uploadError } = await supabase.storage.from("post-images").upload(path, mediaFile);
      if (!uploadError) {
        image_url = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
      }
    }

    await supabase.from("posts").insert({ user_id: user.id, body: text.trim(), image_url });

    setText("");
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setPosting(false);
    load();
  }

  async function toggleLike(post: Post) {
    const supabase = createClient();
    if (!myId) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
          : p
      )
    );
    if (post.likedByMe) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", myId);
    } else {
      await supabase.from("post_likes").upsert({ post_id: post.id, user_id: myId });
    }
  }

  function toggleComments(postId: string) {
    setOpenComments((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  }

  async function submitComment(postId: string) {
    const body = (commentDrafts[postId] || "").trim();
    if (!body || !myId) return;
    const supabase = createClient();
    setCommentDrafts((d) => ({ ...d, [postId]: "" }));
    await supabase.from("post_comments").insert({ post_id: postId, user_id: myId, body });
    load();
  }

  function isVideoUrl(url: string | null | undefined) {
    return !!url && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
  }

  function getMediaUrls(post: any) {
    const urls = Array.isArray(post?.media_urls) ? post.media_urls.filter(Boolean) : [];
    if (post?.image_url && !urls.includes(post.image_url)) {
      urls.unshift(post.image_url);
    }
    return urls;
  }

  return (
    <div className="mt-4 pb-24 max-w-md mx-auto">
      <div className="text-[10px] font-extrabold tracking-[0.2em] text-molla-sub mx-4 mb-3 uppercase">Community</div>

      {/* Composer */}
      <div
        className={`mx-4 rounded-[28px] border border-molla-line bg-white/90 p-3 shadow-[0_12px_24px_rgba(11,13,16,0.04)] backdrop-blur-sm ${
          dragActive ? "border-2 border-molla-blue" : ""
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your latest drop…"
          rows={2}
          className="w-full resize-none bg-transparent text-sm text-molla-black outline-none placeholder:text-molla-sub"
        />

        {mediaPreview && mediaType?.startsWith("video/") && (
          <video src={mediaPreview} controls className="mt-2.5 block h-48 w-full rounded-2xl object-cover mx-auto" />
        )}
        {mediaPreview && !mediaType?.startsWith("video/") && (
          <img src={mediaPreview} alt="" className="mt-2.5 block h-48 w-full rounded-2xl object-cover mx-auto" />
        )}

        {mediaFile && (
          <div className="mt-2 flex items-center justify-between rounded-full bg-molla-black/5 px-2.5 py-1.5 text-[11px] text-molla-sub">
            <span className="truncate pr-2">{mediaFile.name}</span>
            <button onClick={removeMedia} className="text-molla-sub">✖</button>
          </div>
        )}

        {mediaError && <div className="mt-2 text-xs text-red-600">{mediaError}</div>}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={pickMedia} className="flex h-9 w-9 items-center justify-center rounded-full bg-molla-black text-base text-white">
              ＋
            </button>
            <span className="text-[10px] uppercase tracking-[0.15em] text-molla-sub">Media</span>
          </div>
          <input ref={fileInput} type="file" accept="image/*,video/*" className="hidden" onChange={onMediaChosen} />
          <button
            onClick={submitPost}
            disabled={posting || (!text.trim() && !mediaFile) || !!mediaError}
            className="rounded-full bg-molla-yellow px-4 py-2 text-xs font-bold text-molla-black disabled:opacity-40"
          >
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading && <p className="px-4 py-4 text-sm text-molla-sub">Loading…</p>}
      {!loading && posts.length === 0 && (
        <p className="px-4 py-4 text-sm text-molla-sub">No posts yet — be the first to share something.</p>
      )}
      <div className="mt-4 space-y-4">
        {posts.map((post) => (
          <article key={post.id} className="mx-4 overflow-hidden rounded-[28px] border border-molla-line bg-white shadow-[0_14px_28px_rgba(11,13,16,0.05)]">
            <div className="flex items-center gap-2.5 px-3 pt-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-molla-black text-xs font-bold text-white">
                {post.author.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold">{post.author}</p>
                <p className="text-[11px] text-molla-sub">{timeAgo(post.created_at)}</p>
              </div>
            </div>

            {post.body && <p className="px-3 pt-2 text-sm leading-relaxed text-molla-black">{post.body}</p>}
            {post.image_url && (() => {
              const urls = getMediaUrls(post);
              const isSingle = urls.length <= 1;
              const renderMedia = (url: string) => {
                const isVideo = isVideoUrl(url);
                if (isVideo) {
                  return <video key={url} src={url} controls className="h-full w-full object-cover block" />;
                }
                return <img key={url} src={url} alt="" className="h-full w-full object-cover block" />;
              };

              if (isSingle) {
                const url = urls[0];
                return (
                  <button key={url} onClick={() => openModalForPost(post.id)} className="mt-3 block w-full px-0">
                    <div className="overflow-hidden bg-molla-black">
                      {renderMedia(url)}
                    </div>
                  </button>
                );
              }

              return (
                <div className="mt-3 overflow-hidden bg-molla-black">
                  <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
                    {urls.map((url: string) => (
                      <button
                        key={url}
                        onClick={() => openModalForPost(post.id)}
                        className="min-w-full snap-center block"
                      >
                        <div className="h-[420px] w-full overflow-hidden bg-molla-black">
                          {renderMedia(url)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center gap-5 px-3 py-3 text-sm">
              <button onClick={() => toggleLike(post)} className={`font-bold ${post.likedByMe ? "text-molla-blue" : "text-molla-sub"}`}>
                {post.likedByMe ? "♥" : "♡"} {post.likeCount}
              </button>
              <button onClick={() => toggleComments(post.id)} className="font-bold text-molla-sub">
                💬 {post.comments.length}
              </button>
            </div>

            {openComments.has(post.id) && (
              <div className="border-t border-molla-line px-3 py-3">
                {post.comments.map((c) => (
                  <div key={c.id} className="mb-2 text-sm">
                    <span className="font-extrabold">{c.author}</span>{" "}
                    <span className="text-molla-sub">{c.body}</span>
                  </div>
                ))}
                <div className="mt-2 flex gap-2">
                  <input
                    value={commentDrafts[post.id] || ""}
                    onChange={(e) => setCommentDrafts((d) => ({ ...d, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                    placeholder="Add a comment…"
                    className="flex-1 rounded-full border border-molla-line bg-molla-black/5 px-3 py-2 text-sm outline-none"
                  />
                  <button onClick={() => submitComment(post.id)} className="rounded-full bg-molla-blue px-3 text-sm font-bold text-white">
                    ➤
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      {/* Fullscreen viewer */}
      {modalOpen && mediaPosts.length > 0 && (() => {
        const activePost = mediaPosts[modalIndex];
        const activeMedia = getMediaUrls(activePost);
        const currentIndex = Math.min(modalIndex, activeMedia.length - 1);
        const currentUrl = activeMedia[currentIndex] ?? activePost.image_url;
        const isVideo = isVideoUrl(currentUrl);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3">
            <div className="relative w-full max-w-md">
              <button onClick={() => setModalOpen(false)} className="absolute right-2 top-2 z-10 text-2xl text-white" aria-label="Close">
                ✖
              </button>

              {activeMedia.length > 1 && (
                <>
                  <button onClick={prevModal} className="absolute left-2 top-1/2 -translate-y-1/2 text-3xl text-white" aria-label="Previous">‹</button>
                  <button onClick={nextModal} className="absolute right-2 top-1/2 -translate-y-1/2 text-3xl text-white" aria-label="Next">›</button>
                </>
              )}

              <div className="flex min-h-[70vh] items-center justify-center overflow-hidden rounded-[28px] bg-black">
                {isVideo ? (
                  <video src={currentUrl} controls className="max-h-[75vh] w-full object-cover" />
                ) : (
                  <img src={currentUrl} alt="" className="max-h-[75vh] w-full object-cover" />
                )}
              </div>

              {activeMedia.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {activeMedia.map((_: string, index) => (
                    <button
                      key={`${activePost.id}-${index}`}
                      onClick={() => setModalIndex(modalIndex)}
                      className={`h-2 w-2 rounded-full ${index === currentIndex ? "bg-white" : "bg-white/40"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
