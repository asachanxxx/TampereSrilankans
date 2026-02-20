import { CalendarX } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
};

export function EmptyState({
  title = "No events found",
  description = "There are no events to display at this time.",
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon || <CalendarX className="h-16 w-16 text-muted-foreground/40 mb-4" />}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">{description}</p>
    </div>
  );
}
