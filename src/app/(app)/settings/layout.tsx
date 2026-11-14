import { SubNav } from "@/components/ui/sub-nav";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { href: "/settings/profile", label: "Edit Profile" },
    { href: "/settings/account", label: "Account Details" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Settings" />

      <div className="border-b border-border pb-3">
        <SubNav items={navItems} />
      </div>

      <div>
        {children}
      </div>
    </div>
  );
}
