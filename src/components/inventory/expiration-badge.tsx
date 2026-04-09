import {
  getDaysUntilExpiration,
  formatDaysUntilExpiration,
  type ExpirationStatus,
} from "@/lib/utils/expiration";
import { cn } from "@/lib/utils";

type ExpirationBadgeProps = {
  expirationDate: Date;
  status: ExpirationStatus;
  showDays?: boolean;
};

const STATUS_STYLES: Record<ExpirationStatus, string> = {
  fresh: "bg-primary/10 text-primary",
  expiring_soon: "bg-warm/15 text-warm-foreground",
  expires_today: "bg-warm/25 text-warm-foreground",
  expired: "bg-destructive/10 text-destructive",
};

export function ExpirationBadge({
  expirationDate,
  status,
  showDays = true,
}: ExpirationBadgeProps) {
  const days = getDaysUntilExpiration(expirationDate);
  const label = showDays
    ? formatDaysUntilExpiration(days)
    : status.replace("_", " ");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status],
      )}
    >
      {label}
    </span>
  );
}
