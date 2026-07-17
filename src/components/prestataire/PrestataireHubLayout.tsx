import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  displayNameFromProfil,
  getProfil,
  professionLabelFromProfil,
} from '@/lib/kazipro-profile';
import {
  PRESTATAIRE_HUBS,
  type PrestataireHubId,
} from '@/lib/prestataire-nav';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

type PrestataireHubLayoutProps = {
  hubId: PrestataireHubId;
};

export function PrestataireHubLayout({ hubId }: PrestataireHubLayoutProps) {
  const hub = PRESTATAIRE_HUBS[hubId];
  const location = useLocation();
  const { user } = useAuth();
  const profil = getProfil(user);
  const userName = displayNameFromProfil(profil, 'Prestataire');
  const userRole = professionLabelFromProfil(profil) || 'Prestataire';

  const activeTab =
    hub.tabs.find((tab) => location.pathname.startsWith(tab.href))?.id ??
    hub.tabs[0].id;

  return (
    <DashboardLayout role="prestataire" userName={userName} userRole={userRole}>
      <div className="space-y-5">
        <header>
          <h1 className="font-display text-xl font-bold sm:text-2xl">{hub.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{hub.description}</p>
        </header>

        <nav
          className="-mx-1 flex gap-1 overflow-x-auto border-b border-border pb-px scrollbar-hide px-1"
          aria-label={hub.title}
        >
          {hub.tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                to={tab.href}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-md px-3 py-2.5 text-sm font-medium transition-colors sm:px-4',
                  isActive
                    ? '-mb-px border-b-2 border-primary bg-primary/5 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <Outlet />
      </div>
    </DashboardLayout>
  );
}
