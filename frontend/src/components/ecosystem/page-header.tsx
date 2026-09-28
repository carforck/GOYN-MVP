import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-3xl space-y-3">
        {eyebrow && <span className="goyn-eyebrow">{eyebrow}</span>}
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">{title}</h1>
        {description && <p className="text-base text-muted-foreground sm:text-lg">{description}</p>}
      </div>
      {children}
    </div>
  );
}
