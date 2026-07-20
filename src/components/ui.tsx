import { PendingLink } from "./pending-link";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "brand" | "green" | "amber" | "red" | "gray";
}) {
  const tones: Record<string, string> = {
    brand: "text-brand-600",
    green: "text-green-600",
    amber: "text-amber-600",
    red: "text-red-600",
    gray: "text-gray-700",
  };
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const badgeTones: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  APPROVED: "bg-green-50 text-green-700 ring-green-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
  PUBLISHED: "bg-green-50 text-green-700 ring-green-600/20",
  HIDDEN: "bg-gray-100 text-gray-600 ring-gray-500/20",
  ADMIN: "bg-brand-50 text-brand-700 ring-brand-600/20",
  STUDENT: "bg-gray-100 text-gray-600 ring-gray-500/20",
};

export function Badge({
  children,
  tone,
}: {
  children: string;
  tone?: string;
}) {
  const cls = badgeTones[tone ?? children] ?? "bg-gray-100 text-gray-600 ring-gray-500/20";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center justify-center p-12 text-center">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">{body}</p>
      {cta && (
        <PendingLink
          href={cta.href}
          className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {cta.label}
        </PendingLink>
      )}
    </div>
  );
}
