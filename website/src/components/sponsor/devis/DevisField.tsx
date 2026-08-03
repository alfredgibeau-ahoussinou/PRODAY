"use client";

export function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-amber-100/80">
      {children}
      {required ? <span className="text-amber-400"> *</span> : null}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      required={required}
      value={value}
      autoComplete={autoComplete}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-xl border border-amber-500/15 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <select
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full rounded-xl border border-amber-500/15 bg-black/40 px-4 py-3 text-white focus:border-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
    >
      <option value="" className="bg-neutral-900">
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-neutral-900">
          {opt}
        </option>
      ))}
    </select>
  );
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function ChipSelect({
  options,
  selected,
  onChange,
  max,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        const disabled = !active && max !== undefined && selected.length >= max;
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange(toggleInList(selected, option))}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/50"
                : disabled
                  ? "cursor-not-allowed bg-white/5 text-white/25"
                  : "bg-white/5 text-white/65 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
