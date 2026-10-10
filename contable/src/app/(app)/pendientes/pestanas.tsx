"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

export function Pestanas({
  tabs,
  defaultTab,
  children,
}: {
  tabs: Tab[];
  defaultTab: string;
  children: (activeTab: string) => React.ReactNode;
}) {
  const [activo, setActivo] = useState(defaultTab);

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 rounded-xl bg-gris-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivo(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200",
              activo === tab.id
                ? "bg-superficie text-texto shadow-sm"
                : "text-texto-suave hover:text-texto"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                  activo === tab.id
                    ? "bg-primario text-blanco"
                    : "bg-gris-200 text-texto-suave"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">{children(activo)}</div>
    </div>
  );
}
