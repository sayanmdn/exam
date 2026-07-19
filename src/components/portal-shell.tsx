"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { SignOutButton } from "./sign-out-button";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function PortalShell({
  navItems,
  user,
  roleLabel,
  children,
}: {
  navItems: NavItem[];
  user: { name?: string | null; email?: string | null; image?: string | null };
  roleLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            isActive(item.href)
              ? "bg-brand-600 text-white"
              : "text-gray-600 hover:bg-brand-50 hover:text-brand-700"
          }`}
        >
          <span className="h-5 w-5">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white p-4 lg:flex">
        <div className="px-2 py-2">
          <Logo href={navItems[0]?.href ?? "/"} />
          <p className="mt-1 pl-11 text-xs font-semibold uppercase tracking-wide text-brand-500">
            {roleLabel}
          </p>
        </div>
        <div className="mt-6 flex flex-1 flex-col">{nav}</div>
        <UserCard user={user} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-gray-200 bg-white p-4">
            <Logo href={navItems[0]?.href ?? "/"} />
            <div className="mt-6 flex flex-1 flex-col">{nav}</div>
            <UserCard user={user} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <Logo href={navItems[0]?.href ?? "/"} />
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function UserCard({
  user,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
}) {
  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-center gap-3 px-2">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">
            {user.name ?? "User"}
          </p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
      <div className="mt-3 px-2">
        <SignOutButton />
      </div>
    </div>
  );
}
