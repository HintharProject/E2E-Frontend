import { SubNav } from "@/components/ui/sub-nav";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { href: "/settings/profile", label: "Edit Profile" },
    { href: "/settings/account", label: "Account Details" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <PageHeader title="Settings" />
      </div>
      
      <div className="mb-8 border-b border-line pb-4">
        <SubNav items={navItems} />
      </div>
      
      <div>
        {children}
      </div>
    </div>
  );
}
