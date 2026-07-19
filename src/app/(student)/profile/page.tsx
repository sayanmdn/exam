import Image from "next/image";
import { requireStudent } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { updateProfile } from "@/app/actions/student";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { INDIAN_PHONE_PATTERN, INDIAN_PHONE_TITLE } from "@/lib/phone";

export default async function ProfilePage() {
  const sessionUser = await requireStudent();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
  });
  if (!user) return null;

  return (
    <div>
      <PageHeader
        title="Profile settings"
        subtitle="Update your personal information."
      />

      <div className="max-w-xl">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? "You"}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
                {(user.name ?? user.email).charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {user.name ?? "Unnamed student"}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <form action={updateProfile} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                name="name"
                type="text"
                defaultValue={user.name ?? ""}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                defaultValue={user.email}
                disabled
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                Email is managed by your Google account and can&apos;t be
                changed here.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <input
                name="phone"
                type="tel"
                pattern={INDIAN_PHONE_PATTERN}
                title={INDIAN_PHONE_TITLE}
                defaultValue={user.phone ?? ""}
                placeholder="+91 00000 00000"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <SubmitButton
              pendingText="Saving…"
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Save changes
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
