"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/BrandLogo";
import {
  isNavigationItemActive,
  navigationItems,
} from "@/components/layout/navigation";
import { cn } from "@/utils/cn";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[264px] shrink-0 border-r border-zinc-900 bg-[#0B0B0B] text-white lg:flex lg:min-h-screen lg:flex-col">
      <div className="p-5">
        <BrandLogo priority />
      </div>
      <div className="h-px bg-white/10" />
      <nav
        className="flex flex-1 flex-col gap-1 p-4"
        aria-label="Navigazione principale"
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavigationItemActive(pathname, item.href);
          const content = (
            <>
              <Icon aria-hidden="true" className="size-4" />
              <span>{item.label}</span>
              {!item.enabled ? (
                <span className="ml-auto text-xs text-white/35">M1+</span>
              ) : null}
            </>
          );

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                className="inline-flex h-10 cursor-not-allowed items-center gap-3 rounded-md px-3 text-sm text-white/35"
                aria-disabled="true"
              >
                {content}
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
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover"
                  : "text-white/75 hover:bg-white/10 hover:text-white",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {content}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4">
        <BrandLogo
          variant="full"
          className="border border-white/10 opacity-80 shadow-inner shadow-black"
        />
      </div>
    </aside>
  );
}
