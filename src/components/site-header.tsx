import Link from "next/link";
import { auth } from "@/auth";
import { Logo } from "./logo";
import { SignOutButton } from "./sign-out-button";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const portalHref = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/#features"
            className="text-sm font-medium text-gray-600 transition hover:text-brand-700"
          >
            Features
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-gray-600 transition hover:text-brand-700"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-gray-600 transition hover:text-brand-700"
          >
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href={portalHref}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Go to portal
              </Link>
              <SignOutButton className="hidden sm:block" />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
