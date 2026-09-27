"use client";

import { createClient } from "@/lib/supabase/client";

export type MollaState = {
  onboarded: boolean;
  goal: string;
  where: string;
  blocker: string;
  time: string;
  streak: number;
  progress: number;
  artworkDone: boolean;
  nextMoveTitle: string;
  nextMoveMinutes: number;
};

export const defaultState: MollaState = {
  onboarded: false,
  goal: "",
  where: "",
  blocker: "",
  time: "",
  streak: 4,
  progress: 72,
  artworkDone: false,
  nextMoveTitle: "Finish the second verse of your single",
  nextMoveMinutes: 45,
};

// DB rows use snake_case and "where_now" (since "where" is reserved).
function fromRow(row: any): MollaState {
  return {
    onboarded: row.onboarded,
    goal: row.goal ?? "",
    where: row.where_now ?? "",
    blocker: row.blocker ?? "",
    time: row.daily_time ?? "",
    streak: row.streak,
    progress: row.progress,
    artworkDone: row.artwork_done,
    nextMoveTitle: row.next_move_title,
    nextMoveMinutes: row.next_move_minutes,
  };
}

function toRow(patch: Partial<MollaState>) {
  const row: Record<string, any> = {};
  if (patch.onboarded !== undefined) row.onboarded = patch.onboarded;
  if (patch.goal !== undefined) row.goal = patch.goal;
  if (patch.where !== undefined) row.where_now = patch.where;
  if (patch.blocker !== undefined) row.blocker = patch.blocker;
  if (patch.time !== undefined) row.daily_time = patch.time;
  if (patch.streak !== undefined) row.streak = patch.streak;
  if (patch.progress !== undefined) row.progress = patch.progress;
  if (patch.artworkDone !== undefined) row.artwork_done = patch.artworkDone;
  if (patch.nextMoveTitle !== undefined) row.next_move_title = patch.nextMoveTitle;
  if (patch.nextMoveMinutes !== undefined) row.next_move_minutes = patch.nextMoveMinutes;
  return row;
}

export async function getState(): Promise<MollaState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return defaultState;

  const { data, error } = await supabase
    .from("molla_state")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    // First visit for this user — create their row with defaults.
    const { data: inserted } = await supabase
      .from("molla_state")
      .insert({ user_id: user.id })
      .select("*")
      .single();
    return inserted ? fromRow(inserted) : defaultState;
  }

  return fromRow(data);
}

export async function setState(patch: Partial<MollaState>): Promise<MollaState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return defaultState;

  const { data } = await supabase
    .from("molla_state")
    .upsert({ user_id: user.id, ...toRow(patch) })
    .select("*")
    .single();

  return data ? fromRow(data) : defaultState;
}

export const timeToMinutes: Record<string, number> = {
  "15 min": 15,
  "30 min": 30,
  "1 hour": 60,
  "2+ hours": 90,
};

export const blockerCopy: Record<string, string> = {
  "I don't know what to do": "We'll always show you one clear next move — no guessing.",
  "I procrastinate": "We'll break everything into moves small enough that starting is easy.",
  "I need collaborators": "We'll surface the right people to connect with as you go — check Connect anytime.",
  "I don't have the right tools": "We'll focus your plan on progress with what you already have.",
  "I need money": "We'll weight your plan toward moves that also open money-making opportunities.",
  "I need exposure": "We'll weight your plan toward promotion and visibility.",
  "I need better skills": "We'll mix quick skill-building moves into your plan.",
  "I'm stuck": "We'll find the smallest possible next step to get you moving again.",
};
