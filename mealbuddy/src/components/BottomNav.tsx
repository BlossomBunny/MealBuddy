"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", emoji: "🏠", label: "Home" },
  { href: "/ingredients", emoji: "🥦", label: "Fridge" },
  { href: "/recipes", emoji: "🍳", label: "Recipes" },
  { href: "/shopping", emoji: "🛒", label: "Shopping" },
  { href: "/family", emoji: "👨‍👩‍👧", label: "Family" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 flex z-30"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {NAV.map(({ href, emoji, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
              active ? "text-orange-500" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className={`text-xl transition-transform ${active ? "scale-110" : ""}`}>
              {emoji}
            </span>
            <span className={`text-[10px] font-bold ${active ? "text-orange-500" : ""}`}>
              {label}
            </span>
            {active && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-orange-500 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
