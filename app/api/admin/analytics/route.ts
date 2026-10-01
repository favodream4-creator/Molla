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
    } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (usersError) throw usersError;

    const users = usersData.users;
    const now = Date.now();

    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const new7 = users.filter(
      (user) =>
        new Date(user.created_at).getTime() >= sevenDaysAgo
    ).length;

    const verified = users.filter(
      (user) => Boolean(user.email_confirmed_at)
    ).length;

    const activeUsers = new Set<string>();

    const { data: events, error: eventsError } = await admin
      .from("analytics_events")
      .select("user_id, event_name, created_at");

    if (eventsError) throw eventsError;

    for (const event of events ?? []) {
      if (!event.user_id) continue;

      activeUsers.add(event.user_id);
    }

    const active7Users = new Set<string>();
    const active30Users = new Set<string>();

    for (const event of events ?? []) {
      if (!event.user_id) continue;

      const timestamp = new Date(event.created_at).getTime();

      if (timestamp >= sevenDaysAgo) {
        active7Users.add(event.user_id);
      }

      if (timestamp >= thirtyDaysAgo) {
        active30Users.add(event.user_id);
      }
    }

    const current30 = users.filter(
      (user) =>
        new Date(user.created_at).getTime() >= thirtyDaysAgo
    ).length;

    const previous30 = users.filter((user) => {
      const createdAt = new Date(user.created_at).getTime();

      return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;

    const growth =
      previous30 === 0
        ? current30 > 0
          ? 100
          : 0
        : Math.round(
            ((current30 - previous30) / previous30) * 100
          );

    const dailyMap: Record<string, number> = {};

    for (let i = 29; i >= 0; i--) {
      const date = new Date(
        now - i * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .slice(0, 10);

      dailyMap[date] = 0;
    }

    for (const user of users) {
      const date = new Date(user.created_at)
        .toISOString()
        .slice(0, 10);

      if (date in dailyMap) {
        dailyMap[date]++;
      }
    }

    const daily = Object.entries(dailyMap).map(
      ([date, count]) => ({
        date,
        count,
      })
    );

    return NextResponse.json({
      total: users.length,
      new7,
      active7: active7Users.size,
      active30: active30Users.size,
      verified,
      verificationRate:
        users.length > 0
          ? Math.round((verified / users.length) * 100)
          : 0,
      current30,
      previous30,
      growth,
      daily,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    return NextResponse.json(
      { error: "Could not load analytics." },
      { status: 500 }
    );
  }
}