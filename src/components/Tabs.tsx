import { useId } from "react";
import type { ReactNode } from "react";

export function Tabs({
  items,
  active,
  onChange,
  children,
  label,
}: {
  items: { id: string; label: string; icon?: ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  children: ReactNode;
  label: string;
}) {
  const prefix = useId();
  return (
    <>
      <div
        className="tabs"
        role="tablist"
        aria-label={label}
        onKeyDown={(event) => {
          const index = items.findIndex((i) => i.id === active);
          let target = index;
          if (event.key === "ArrowRight") target = (index + 1) % items.length;
          else if (event.key === "ArrowLeft")
            target = (index - 1 + items.length) % items.length;
          else if (event.key === "Home") target = 0;
          else if (event.key === "End") target = items.length - 1;
          else return;
          event.preventDefault();
          onChange(items[target].id);
          document.getElementById(`${prefix}-tab-${items[target].id}`)?.focus();
        }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            id={`${prefix}-tab-${item.id}`}
            role="tab"
            aria-selected={active === item.id}
            aria-controls={`${prefix}-panel`}
            tabIndex={active === item.id ? 0 : -1}
            className={active === item.id ? "active" : ""}
            onClick={() => onChange(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
      <section
        className="tab-panel"
        role="tabpanel"
        tabIndex={0}
        id={`${prefix}-panel`}
        aria-labelledby={`${prefix}-tab-${active}`}
      >
        {children}
      </section>
    </>
  );
}
