type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl font-semibold tracking-normal text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="min-w-0 shrink-0">{action}</div> : null}
    </header>
  );
}
