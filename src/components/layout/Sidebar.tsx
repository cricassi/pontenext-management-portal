import Link from "next/link";
import { navigationItems } from "@/components/layout/navigation";
import { Separator } from "@/components/ui/Separator";
import { cn } from "@/utils/cn";

export function Sidebar() {
  return (
    <aside className="hidden w-[260px] shrink-0 border-r bg-card lg:flex lg:min-h-screen lg:flex-col">
      <div className="p-6">
        <p className="text-sm font-medium text-muted-foreground">PonteNext</p>
        <p className="mt-1 text-lg font-semibold tracking-normal">
          Management Portal
        </p>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Navigazione principale">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <>
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
              {!item.enabled ? (
                <span className="ml-auto text-xs text-muted-foreground">M1+</span>
              ) : null}
            </>
          );

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                className="inline-flex h-10 cursor-not-allowed items-center gap-3 rounded-md px-3 text-sm text-muted-foreground"
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
                "inline-flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent",
              )}
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
