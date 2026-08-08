"use client";

import { useState } from "react";
import { updateClassroom } from "@/app/actions/admin";
import { SubmitButton } from "@/components/submit-button";

// Collapsible inline editor for a batch's name, class and description.
export function EditClassroom({
  classroom,
}: {
  classroom: {
    id: string;
    name: string;
    description: string | null;
    class: string | null;
  };
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-brand-600 hover:underline"
      >
        Edit
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateClassroom(classroom.id, formData);
        setOpen(false);
      }}
      className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
    >
      <div>
        <label className="block text-xs font-medium text-gray-600">Name</label>
        <input
          name="name"
          required
          defaultValue={classroom.name}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600">
          Class
        </label>
        <input
          name="class"
          defaultValue={classroom.class ?? ""}
          placeholder="e.g. 11, 11 first semester, 12 even"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="mt-1 text-xs text-gray-400">
          Students only see batches matching a class they&apos;re already in.
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600">
          Description
        </label>
        <input
          name="description"
          defaultValue={classroom.description ?? ""}
          placeholder="Optional"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
      <div className="flex gap-2">
        <SubmitButton
          pendingText="Saving…"
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        >
          Save
        </SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
