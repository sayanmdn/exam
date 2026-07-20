"use client";

import { useState } from "react";

export function ExamTypeFields() {
  const [type, setType] = useState<"MANUAL" | "PDF">("MANUAL");

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Question format
      </label>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <label
          className={`cursor-pointer rounded-lg border px-4 py-3 text-sm ${
            type === "MANUAL"
              ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <input
            type="radio"
            name="type"
            value="MANUAL"
            checked={type === "MANUAL"}
            onChange={() => setType("MANUAL")}
            className="sr-only"
          />
          <span className="font-semibold text-gray-900">Manual entry</span>
          <span className="mt-0.5 block text-xs text-gray-500">
            Type each question and its options in the portal.
          </span>
        </label>

        <label
          className={`cursor-pointer rounded-lg border px-4 py-3 text-sm ${
            type === "PDF"
              ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <input
            type="radio"
            name="type"
            value="PDF"
            checked={type === "PDF"}
            onChange={() => setType("PDF")}
            className="sr-only"
          />
          <span className="font-semibold text-gray-900">PDF question paper</span>
          <span className="mt-0.5 block text-xs text-gray-500">
            Upload a paper; students answer on an option grid.
          </span>
        </label>
      </div>

      {type === "PDF" && (
        <div className="mt-4 sm:max-w-xs">
          <label className="block text-sm font-medium text-gray-700">
            Number of questions in the paper
          </label>
          <input
            name="numberOfQuestions"
            type="number"
            min={1}
            max={200}
            defaultValue={30}
            required
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            You&apos;ll upload the PDF and can set the answer key on the next
            screen.
          </p>
        </div>
      )}
    </div>
  );
}
