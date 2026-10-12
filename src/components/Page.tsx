import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 tabIndex={-1}>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({
  title,
  description,
  children,
  icon = <BookOpen size={25} />,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
