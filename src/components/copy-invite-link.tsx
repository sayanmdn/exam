"use client";

// Renders a "Copy invite link" button that writes the batch join URL to the
// clipboard. Server-rendered pages can't know window.location.origin, so we
// resolve the full URL client-side.
export function CopyInviteLink({ classroomId }: { classroomId: string }) {
  function copy() {
    const url = `${window.location.origin}/join/${classroomId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Invite link copied to clipboard!");
    });
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
    >
      Copy invite link
    </button>
  );
}
