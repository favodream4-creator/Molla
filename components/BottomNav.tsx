"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  LayoutList,
  Plus,
  Users,
  Trophy,
  UserCircle,
} from "lucide-react";

const tabs = [
  { href: "/", icon: House, label: "Home" },
  { href: "/feed", icon: LayoutList, label: "Feed" },
  { href: "/create", icon: Plus, label: "Create" },
  { href: "/connect", icon: Users, label: "Connect" },
  { href: "/opportunities", icon: Trophy, label: "Opportunities" },
  { href: "/profile", icon: UserCircle, label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-molla-line flex px-2 py-2.5">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center gap-1 text-[11px] font-bold py-1 transition-colors ${
              active ? "text-molla-black" : "text-molla-sub"
            }`}
          >
            <Icon
              size={22}
              strokeWidth={2}
              className={active ? "text-molla-black" : "text-molla-sub"}
            />

            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
