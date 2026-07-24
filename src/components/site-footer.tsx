import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm text-gray-500">
              A dedicated educational institute providing carefully designed
              mock tests and practice examinations. Practise like the real exam,
              perform with confidence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Platform</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="/#features" className="hover:text-brand-700">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-brand-700">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Company</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="/about" className="hover:text-brand-700">
                    About us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-brand-700">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-100 pt-6 text-sm text-gray-400">
          © {new Date().getFullYear()} Exams Hub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
