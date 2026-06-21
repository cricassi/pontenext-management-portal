type DashboardSectionProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardSection({
  title,
  description,
  action,
  children,
}: DashboardSectionProps) {
  return (
    <section className="flex min-w-0 max-w-full flex-col gap-3 overflow-x-hidden">
      <div className="flex min-w-0 max-w-full flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-base font-semibold tracking-normal text-foreground">
            {title}
          </h2>
          <p className="mt-1 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
            {description}
          </p>
        </div>
        {action ? <div className="min-w-0 shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
