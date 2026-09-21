"use client";

export interface ChipOption<T extends string | number> {
  value: T;
  label: string;
  caveat?: string;
}

interface ChipGroupProps<T extends string | number> {
  options: ChipOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
  mode: "single" | "multi";
  exclusiveValue?: T;
}

export function ChipGroup<T extends string | number>({ options, selected, onChange, mode, exclusiveValue }: ChipGroupProps<T>) {
  function toggle(value: T) {
    if (mode === "single") {
      onChange([value]);
      return;
    }

    if (value === exclusiveValue) {
      onChange(selected.includes(value) ? [] : [value]);
      return;
    }

    const withoutExclusive = selected.filter((v) => v !== exclusiveValue);
    if (withoutExclusive.includes(value)) {
      onChange(withoutExclusive.filter((v) => v !== value));
    } else {
      onChange([...withoutExclusive, value]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors border ${
              active
                ? "border-transparent text-white"
                : "border-border text-muted hover:text-foreground hover:border-foreground/30"
            }`}
            style={active ? { background: "var(--accent-gradient)" } : undefined}
          >
            {opt.label}
            {opt.caveat && <span className="ml-1.5 text-xs opacity-75">({opt.caveat})</span>}
          </button>
        );
      })}
    </div>
  );
}
