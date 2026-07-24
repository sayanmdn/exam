import { requireStudent } from "@/lib/auth-helpers";
import { PortalShell, type NavItem } from "@/components/portal-shell";
import { Icons } from "@/components/icons";

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Icons.dashboard },
  { href: "/classrooms", label: "Batches", icon: Icons.classroom },
  { href: "/results", label: "My Results", icon: Icons.results },
  { href: "/profile", label: "Profile", icon: Icons.profile },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStudent();
  return (
    <PortalShell navItems={navItems} user={user} roleLabel="Student">
      {children}
    </PortalShell>
  );
}
