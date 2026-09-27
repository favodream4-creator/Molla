"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", icon: "🏠", label: "Home" },
  { href: "/feed", icon: "📰", label: "Feed" },
  { href: "/create", icon: "➕", label: "Create" },
  { href: "/connect", icon: "👥", label: "Connect" },
  { href: "/opportunities", icon: "🏆", label: "Opportunities" },
  { href: "/profile", icon: "👤", label: "Profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-molla-line flex px-2 py-2.5">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center gap-1 text-[11px] font-bold py-1 ${
              active ? "text-molla-black" : "text-molla-sub"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
