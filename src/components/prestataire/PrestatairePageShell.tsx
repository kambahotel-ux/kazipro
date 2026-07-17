import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

type PrestatairePageShellProps = {
  embedded?: boolean;
  userName?: string;
  userRole?: string;
  isVerified?: boolean;
  isProfileComplete?: boolean;
  children: React.ReactNode;
};

export function PrestatairePageShell({
  embedded = false,
  userName = 'Prestataire',
  userRole = 'Prestataire',
  isVerified,
  isProfileComplete,
  children,
}: PrestatairePageShellProps) {
  if (embedded) {
    return <div className="min-w-0">{children}</div>;
  }

  return (
    <DashboardLayout
      role="prestataire"
      userName={userName}
      userRole={userRole}
      isVerified={isVerified}
      isProfileComplete={isProfileComplete}
    >
      {children}
    </DashboardLayout>
  );
}
