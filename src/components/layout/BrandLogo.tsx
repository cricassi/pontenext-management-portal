import Image from "next/image";
import { cn } from "@/utils/cn";

type BrandLogoProps = {
  variant?: "compact" | "full";
  className?: string;
  priority?: boolean;
};

const logoSrc = "/brand/ponte-next-logo.jpg";

export function BrandLogo({
  variant = "compact",
  className,
  priority = false,
}: BrandLogoProps) {
  if (variant === "full") {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-md bg-black", className)}>
        <Image
          src={logoSrc}
          alt="Ponte Next APS - Territorio - Comunita"
          width={1536}
          height={1152}
          className="h-auto w-full object-contain"
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-2 sm:gap-3", className)}>
      <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded-md bg-black ring-1 ring-white/10 sm:h-11 sm:w-14">
        <Image
          src={logoSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 48px, 56px"
          className="object-contain"
          priority={priority}
        />
      </div>
      <div className="min-w-0 flex-1 leading-none">
        <p className="truncate text-sm font-extrabold uppercase tracking-normal text-white">
          Ponte <span className="text-primary">Next</span>
        </p>
        <p className="mt-1 truncate text-[10px] font-medium uppercase tracking-normal text-white/55">
          Management Portal
        </p>
      </div>
    </div>
  );
}
