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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    const users: Array<{
      id: string;
      email?: string | null;
      created_at: string;
      email_confirmed_at?: string | null;
      last_sign_in_at?: string | null;
    }> = [];

    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        throw error;
      }

      users.push(...data.users);

      if (data.users.length < perPage) {
        break;
      }

      page++;
    }

    const now = Date.now();

    const since = (days: number) => now - days * 24 * 60 * 60 * 1000;

    const createdAt = (u: (typeof users)[number]) =>
      new Date(u.created_at).getTime();

    const lastSignIn = (u: (typeof users)[number]) =>
      u.last_sign_in_at ? new Date(u.last_sign_in_at).getTime() : null;

    const total = users.length;

    const new7 = users.filter(
      (u) => createdAt(u) >= since(7)
    ).length;

    const active7 = users.filter((u) => {
      const last = lastSignIn(u);
      return last !== null && last >= since(7);
    }).length;

    const active30 = users.filter((u) => {
      const last = lastSignIn(u);
      return last !== null && last >= since(30);
    }).length;

    const verified = users.filter((u) => Boolean(u.email_confirmed_at)).length;

    const current30 = users.filter(
      (u) => createdAt(u) >= since(30)
    ).length;

    const previous30 = users.filter((u) => {
      const created = createdAt(u);
      return created >= since(60) && created < since(30);
    }).length;

    const growth =
      previous30 === 0
        ? current30 > 0
          ? 100
          : 0
        : Math.round(((current30 - previous30) / previous30) * 100);

    const daily = Array.from({ length: 30 }, (_, index) => {
      const start = now - (29 - index + 1) * 24 * 60 * 60 * 1000;
      const end = now - (29 - index) * 24 * 60 * 60 * 1000;

      const count = users.filter((u) => {
        const created = createdAt(u);
        return created >= start && created < end;
      }).length;

      const date = new Date(end);

      return {
        date: date.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
        count,
      };
    });

    return NextResponse.json({
      total,
      new7,
      active7,
      active30,
      verified,
      verificationRate:
        total === 0 ? 0 : Math.round((verified / total) * 100),
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