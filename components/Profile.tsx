"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { getState } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

export default function Profile() {
  const [progress, setProgress] = useState(72);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Artist");
  const [draftName, setDraftName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [draftBio, setDraftBio] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [draftGenres, setDraftGenres] = useState("");
  const [draftLookingFor, setDraftLookingFor] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void getState()
      .then((state) => { if (active) setProgress(state.progress); })
      .catch(() => undefined);

    void (async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) {
          if (active) setProfileMessage("Sign in to edit your profile.");
          return;
        }
        if (active) setUserId(user.id);

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("display_name,avatar_url,bio,location,genres,looking_for")
          .eq("id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!active) return;
        const name = profile?.display_name || user.email?.split("@")[0] || "Artist";
        setDisplayName(name);
        setDraftName(name);
        setAvatarUrl(profile?.avatar_url ?? null);
        setBio(profile?.bio ?? "");
        setLocation(profile?.location ?? "");
        setGenres(profile?.genres ?? []);
        setLookingFor(profile?.looking_for ?? []);
      } catch (error) {
        if (active) setProfileMessage(error instanceof Error ? error.message : "Could not load your profile.");
      } finally {
        if (active) setProfileLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function saveProfile() {
    const name = draftName.trim();
    if (!userId || !name || name.length > 40 || draftBio.length > 240 || draftLocation.length > 80) {
      setProfileMessage("Check the name, bio and location limits before saving.");
      return;
    }
    setSaving(true);
    setProfileMessage(null);
    try {
      const supabase = createClient();
      let nextAvatarUrl = avatarUrl;
      if (avatarFile) {
        const extension = avatarFile.type === "image/png" ? "png" : avatarFile.type === "image/webp" ? "webp" : "jpg";
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-avatars")
          .upload(path, avatarFile, { contentType: avatarFile.type });
        if (uploadError) throw uploadError;
        nextAvatarUrl = supabase.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
      }

      const splitTags = (value: string) => Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean))).slice(0, 8);
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        display_name: name,
        avatar_url: nextAvatarUrl,
        bio: draftBio.trim(),
        location: draftLocation.trim(),
        genres: splitTags(draftGenres),
        looking_for: splitTags(draftLookingFor),
      }, { onConflict: "id" });
      if (error) throw error;

      setDisplayName(name);
      setAvatarUrl(nextAvatarUrl);
      setBio(draftBio.trim());
      setLocation(draftLocation.trim());
      setGenres(splitTags(draftGenres));
      setLookingFor(splitTags(draftLookingFor));
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(null);
      setAvatarPreview(null);
      setEditing(false);
      setProfileMessage("Profile updated.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not save your profile. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing() {
    setDraftName(displayName);
    setDraftBio(bio);
    setDraftLocation(location);
    setDraftGenres(genres.join(", "));
    setDraftLookingFor(lookingFor.join(", "));
    setProfileMessage(null);
    setEditing(true);
  }

  function cancelEditing() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarPreview(null);
    setEditing(false);
  }

  function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileMessage("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage("Profile photos must be 5 MB or smaller.");
      return;
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setProfileMessage(null);
  }

  return (
    <div className="pt-6 pb-28 px-5">
      <div className="flex justify-end text-lg">⚙️</div>

      <div className="text-center mt-2">
        <div className="mx-auto mb-3.5 flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-molla-black text-2xl font-extrabold text-white">
          {(avatarPreview || avatarUrl) ? (
            <img src={avatarPreview || avatarUrl || ""} alt={`${displayName} profile`} className="h-full w-full object-cover" />
          ) : displayName.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-lg font-extrabold">{displayName}</h2>
        <p className="text-sm text-molla-sub mt-1">Artist{location ? ` · ${location}` : ""}</p>
        <div className="mt-2.5 space-x-1.5">
          {genres.map((tag) => (
            <span key={tag} className="inline-block bg-molla-gray text-xs font-bold px-3 py-1.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {bio && <p className="text-sm text-molla-sub mt-4 leading-relaxed">{bio}</p>}

      <div className="text-xs font-extrabold text-molla-sub mt-6 mb-2.5">CURRENT PROJECT</div>
      <Link href="/project" className="block border border-molla-line rounded-card p-5">
        <div className="flex justify-between mb-2.5">
          <span className="font-extrabold">Debut Single</span>
          <span className="text-molla-blue font-extrabold">{progress}%</span>
        </div>
        <div className="h-2 bg-molla-gray rounded-full overflow-hidden">
          <div className="h-full bg-molla-blue rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </Link>

      <div className="text-xs font-extrabold text-molla-sub mt-6 mb-1">LOOKING FOR</div>
      <ul>
        {lookingFor.map((s) => (
          <li key={s} className="py-2.5 border-b border-molla-line text-sm font-semibold">
            {s}
          </li>
        ))}
      </ul>

      {editing && (
        <div className="mt-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-molla-black text-xl font-bold text-white">
              {(avatarPreview || avatarUrl) ? <img src={avatarPreview || avatarUrl || ""} alt="Profile preview" className="h-full w-full object-cover" /> : displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseAvatar} className="hidden" />
              <button type="button" onClick={() => avatarInput.current?.click()} className="text-sm font-bold text-molla-blue">Change photo</button>
              <p className="mt-1 text-xs text-molla-sub">JPG, PNG or WebP · max 5 MB</p>
            </div>
          </div>
          <label htmlFor="profile-name" className="mb-1.5 block text-sm font-semibold">Display name</label>
          <input
            id="profile-name"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            maxLength={40}
            className="w-full rounded-xl border border-molla-line bg-white px-3 py-3 text-sm"
          />
          <label htmlFor="profile-bio" className="mb-1.5 mt-4 block text-sm font-semibold">Bio</label>
          <textarea id="profile-bio" value={draftBio} onChange={(event) => setDraftBio(event.target.value)} maxLength={240} rows={3} className="w-full resize-none rounded-xl border border-molla-line bg-white px-3 py-3 text-sm" />
          <p className="mt-1 text-right text-xs text-molla-sub">{draftBio.length}/240</p>
          <label htmlFor="profile-location" className="mb-1.5 mt-3 block text-sm font-semibold">Location</label>
          <input id="profile-location" value={draftLocation} onChange={(event) => setDraftLocation(event.target.value)} maxLength={80} className="w-full rounded-xl border border-molla-line bg-white px-3 py-3 text-sm" placeholder="City, country" />
          <label htmlFor="profile-genres" className="mb-1.5 mt-3 block text-sm font-semibold">Genres</label>
          <input id="profile-genres" value={draftGenres} onChange={(event) => setDraftGenres(event.target.value)} className="w-full rounded-xl border border-molla-line bg-white px-3 py-3 text-sm" placeholder="Hip-Hop, R&B, Alternative" />
          <label htmlFor="profile-looking-for" className="mb-1.5 mt-3 block text-sm font-semibold">Looking for</label>
          <input id="profile-looking-for" value={draftLookingFor} onChange={(event) => setDraftLookingFor(event.target.value)} className="w-full rounded-xl border border-molla-line bg-white px-3 py-3 text-sm" placeholder="Producer, mixing engineer" />
          <div className="mt-3 flex gap-2">
            <button onClick={cancelEditing} className="flex-1 rounded-full border border-molla-line py-3 text-sm font-bold">
              Cancel
            </button>
            <button onClick={saveProfile} disabled={saving} className="flex-1 rounded-full bg-molla-black py-3 text-sm font-bold text-white disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
      {!editing && (
        <button
          onClick={startEditing}
          disabled={profileLoading || !userId}
          className="mt-5 w-full rounded-2xl border border-molla-line py-4 font-bold text-molla-sub disabled:opacity-50"
        >
          {profileLoading ? "Loading profile…" : "Edit profile"}
        </button>
      )}
      {profileMessage && <p role="status" className="mt-2 text-center text-sm text-molla-sub">{profileMessage}</p>}
    </div>
  );
}
