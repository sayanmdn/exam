import Link from "next/link";
import Image from "next/image";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg shadow-sm">
        <Image
          src="/logo-icon.jpeg"
          alt="ExamsHub logo"
          width={36}
          height={36}
          className="h-full w-full object-cover"
          priority
        />
      </span>
      <span className="text-lg font-bold tracking-tight text-gray-900">
        Exams<span className="text-brand-600">Hub</span>
      </span>
    </Link>
  );
}
