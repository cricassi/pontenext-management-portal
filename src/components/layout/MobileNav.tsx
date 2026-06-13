"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  isNavigationItemActive,
  navigationItems,
} from "@/components/layout/navigation";
import { cn } from "@/utils/cn";

export function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        navRef.current &&
        !navRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={navRef} className="relative shrink-0 lg:hidden">
      <button
        type="button"
        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Menu aria-hidden="true" className="size-4" />
        Menu
      </button>
      {isOpen ? (
        <nav
          id="mobile-navigation"
          className="absolute left-0 top-12 z-30 flex w-64 flex-col gap-1 rounded-md border border-white/10 bg-[#0B0B0B] p-2 text-white shadow-xl"
          aria-label="Navigazione mobile"
        >
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavigationItemActive(pathname, item.href);

            if (!item.enabled) {
              return (
                <span
                  key={item.href}
                  className="inline-flex h-10 cursor-not-allowed items-center gap-3 rounded-md px-3 text-sm text-white/35"
                  aria-disabled="true"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-white/75 hover:bg-white/10 hover:text-white",
                )}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsOpen(false)}
              >
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
