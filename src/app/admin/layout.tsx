import { requireAdmin } from "@/lib/auth-helpers";
import { PortalShell, type NavItem } from "@/components/portal-shell";
import { Icons } from "@/components/icons";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: Icons.dashboard },
  { href: "/admin/classrooms", label: "Classrooms", icon: Icons.classroom },
  { href: "/admin/students", label: "Students", icon: Icons.students },
  { href: "/admin/exams", label: "Exams", icon: Icons.exam },
  { href: "/admin/results", label: "Results", icon: Icons.results },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  return (
    <PortalShell navItems={navItems} user={user} roleLabel="Administrator">
      {children}
    </PortalShell>
  );
}
