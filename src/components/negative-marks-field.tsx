"use client";

import { useState } from "react";
import { NEGATIVE_MARK_PRESETS } from "@/lib/marking-scheme";

const CUSTOM = "custom";

/**
 * Negative-marking input: a dropdown of common schemes (0, -1, -1/2, -1/3, -1/4)
 * plus a "Custom…" option that reveals a free decimal input. Always submits a
 * single hidden `name` field, so no server-action changes are needed.
 */
export function NegativeMarksField({
  name = "negativeMarks",
  defaultValue = 1,
  label = "Negative marks for wrong",
}: {
  name?: string;
  defaultValue?: number;
  label?: string;
}) {
  const preset = NEGATIVE_MARK_PRESETS.find(
    (p) => Math.abs(p.value - defaultValue) < 1e-9,
  );
  const [selected, setSelected] = useState<string>(
    preset ? String(preset.value) : CUSTOM,
  );
  const [custom, setCustom] = useState(String(defaultValue));

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600">
        {label}
      </label>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        {NEGATIVE_MARK_PRESETS.map((p) => (
          <option key={p.label} value={p.value}>
            {p.label}
          </option>
        ))}
        <option value={CUSTOM}>Custom…</option>
      </select>
      {selected === CUSTOM && (
        <input
          type="number"
          min={0}
          step={0.01}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="e.g. 0.2"
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      )}
      <input
        type="hidden"
        name={name}
        value={selected === CUSTOM ? custom : selected}
      />
    </div>
  );
}
