"use client";

import { CheckIcon } from "lucide-react";
import { useId } from "react";
import type { CatalogItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block font-heading text-base font-bold text-foreground sm:text-lg">
        {label} {required && <span className="text-goyn-magenta" aria-hidden>*</span>}
      </label>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {children}
      {error && <p role="alert" className="text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}

// Selección por chips accesible (role="checkbox"/"radio"), usada en todos los catálogos.
export function ChoiceGroup({
  label,
  hint,
  error,
  required,
  options,
  value,
  onChange,
  multiple = true,
  columns = false,
  describe = false,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  options: CatalogItem[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  columns?: boolean;
  describe?: boolean;
}) {
  const id = useId();
  const toggle = (code: string) => {
    if (!multiple) return onChange([code]);
    onChange(value.includes(code) ? value.filter((v) => v !== code) : [...value, code]);
  };
  return (
    <fieldset className="space-y-3" aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className="font-heading text-base font-bold text-foreground sm:text-lg">
        {label} {required && <span className="text-goyn-magenta" aria-hidden>*</span>}
      </legend>
      {hint && <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p>}
      <div role={multiple ? "group" : "radiogroup"} className={cn(columns ? "grid gap-2 sm:grid-cols-2" : "flex flex-wrap gap-2")}>
        {options.map((o) => {
          const checked = value.includes(o.code);
          return (
            <button
              key={o.code}
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={checked}
              onClick={() => toggle(o.code)}
              className={cn(
                "flex items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                checked ? "border-goyn-violeta bg-goyn-lila text-foreground" : "bg-card hover:border-goyn-violeta/40",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 place-items-center border",
                  multiple ? "rounded-[4px]" : "rounded-full",
                  checked ? "border-goyn-violeta bg-goyn-violeta text-white" : "border-input",
                )}
              >
                {checked && <CheckIcon className="size-3" />}
              </span>
              <span>
                <span className="font-semibold">{o.label}</span>
                {describe && o.description && <span className="mt-0.5 block text-xs text-muted-foreground">{o.description}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="text-xs font-semibold text-destructive">{error}</p>}
    </fieldset>
  );
}

export function Scale({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-heading text-base font-bold text-foreground sm:text-lg">{label}</legend>
      <div role="radiogroup" className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} de 10`}
            onClick={() => onChange(n)}
            className={cn(
              "h-10 rounded-lg border text-sm font-bold transition-colors",
              value === n ? "border-goyn-violeta bg-goyn-violeta text-white" : "bg-card hover:border-goyn-violeta/50",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between gap-4 text-sm font-bold text-foreground/80">
        <span>1 · No se ha fortalecido</span>
        <span>10 · Se ha fortalecido mucho</span>
      </div>
    </fieldset>
  );
}
