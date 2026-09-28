// Shared negative-marking presets and display formatting, used by both the
// admin marking-scheme forms and the student-facing marks display.

export const NEGATIVE_MARK_PRESETS = [
  { label: "No negative marking", value: 0 },
  { label: "-1 (full mark)", value: 1 },
  { label: "-1/2", value: 1 / 2 },
  { label: "-1/3", value: 1 / 3 },
  { label: "-1/4", value: 1 / 4 },
] as const;

const KNOWN_FRACTIONS: [number, string][] = [
  [1 / 2, "1/2"],
  [1 / 3, "1/3"],
  [1 / 4, "1/4"],
  [2 / 3, "2/3"],
  [3 / 4, "3/4"],
];

/** Renders a marks value for display, showing common fractions (1/3, 1/4, …) as such. */
export function formatMarks(value: number): string {
  if (Number.isInteger(value)) return String(value);
  const match = KNOWN_FRACTIONS.find(([v]) => Math.abs(v - value) < 1e-9);
  if (match) return match[1];
  return String(Math.round(value * 100) / 100);
}
