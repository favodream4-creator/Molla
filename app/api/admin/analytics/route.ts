import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "favodream4@gmail.com";

export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createAdminClient();

    const {
      data: usersData,
      error: usersError,
    } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (usersError) throw usersError;

    const { data: events, error: eventsError } = await admin
      .from("analytics_events")
      .select("event_name, created_at");

    if (eventsError) throw eventsError;

    const summary = events?.reduce<Record<string, number>>((acc, item) => {
      acc[item.event_name] = (acc[item.event_name] ?? 0) + 1;
      return acc;
    }, {}) ?? {};

    return NextResponse.json({
      users: usersData.users.length,
      events: summary,
      totalEvents: events?.length ?? 0,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Could not load analytics." },
      { status: 500 }
    );
  }
}