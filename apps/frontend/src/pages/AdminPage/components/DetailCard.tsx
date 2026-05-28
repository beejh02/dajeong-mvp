import type { ReactNode } from "react";

type DetailCardProps = {
  title: string;
  children: ReactNode;
};

export function DetailCard({ title, children }: DetailCardProps) {
  return (
    <article className="detail-card">
      <h2>{title}</h2>
      <div>{children}</div>
    </article>
  );
}

type DetailItemProps = {
  label: string;
  value: ReactNode;
  last?: boolean;
};

export function DetailItem({ label, value, last = false }: DetailItemProps) {
  return (
    <div className={`detail-item ${last ? "last" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
