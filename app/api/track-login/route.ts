import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { error } = await admin.from("analytics_events").insert({
      user_id: userId,
      event_name: "login",
      metadata: {
        source: "magic_link",
      },
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("track-login error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to track login" },
      { status: 500 }
    );
  }
}