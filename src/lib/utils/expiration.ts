export type ExpirationStatus =
  | "fresh"
  | "expiring_soon"
  | "expires_today"
  | "expired";

export function getExpirationStatus(
  expirationDate: Date,
  warningDays: number = 3,
): ExpirationStatus {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expDate = new Date(
    expirationDate.getFullYear(),
    expirationDate.getMonth(),
    expirationDate.getDate(),
  );
  const diffDays = Math.floor(
    (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return "expired";
  if (diffDays === 0) return "expires_today";
  if (diffDays <= warningDays) return "expiring_soon";
  return "fresh";
}

export function getExpirationColor(status: ExpirationStatus): string {
  const colors: Record<ExpirationStatus, string> = {
    fresh: "bg-green-100 text-green-800",
    expiring_soon: "bg-yellow-100 text-yellow-800",
    expires_today: "bg-orange-100 text-orange-800",
    expired: "bg-red-100 text-red-800",
  };
  return colors[status];
}

export function getExpirationLabel(status: ExpirationStatus): string {
  const labels: Record<ExpirationStatus, string> = {
    fresh: "Fresh",
    expiring_soon: "Expiring Soon",
    expires_today: "Expires Today",
    expired: "Expired",
  };
  return labels[status];
}

export function getDaysUntilExpiration(expirationDate: Date): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expDate = new Date(
    expirationDate.getFullYear(),
    expirationDate.getMonth(),
    expirationDate.getDate(),
  );
  return Math.floor(
    (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function formatDaysUntilExpiration(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d left`;
}
