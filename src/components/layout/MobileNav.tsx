import Link from "next/link";
import { Menu } from "lucide-react";
import { navigationItems } from "@/components/layout/navigation";

export function MobileNav() {
  return (
    <details className="relative lg:hidden">
      <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border px-3 text-sm font-medium">
        <Menu aria-hidden="true" />
        Menu
      </summary>
      <nav
        className="absolute left-0 top-12 z-20 flex w-64 flex-col gap-1 rounded-md border bg-card p-2 shadow-sm"
        aria-label="Navigazione mobile"
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                className="inline-flex h-10 cursor-not-allowed items-center gap-3 rounded-md px-3 text-sm text-muted-foreground"
                aria-disabled="true"
              >
                <Icon aria-hidden="true" />
                {item.label}
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-accent"
            >
              <Icon aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </details>
  );
}
