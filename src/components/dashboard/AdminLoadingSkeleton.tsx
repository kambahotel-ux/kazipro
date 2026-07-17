import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return <Skeleton className={cn("bg-muted/80", className)} />;
}

/** Titre + sous-titre de page */
export function PageHeaderSkeleton({ withActions = false }: { withActions?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <Shimmer className="h-7 w-48 sm:h-8 sm:w-64" />
        <Shimmer className="h-4 w-full max-w-md" />
      </div>
      {withActions ? (
        <div className="flex gap-2">
          <Shimmer className="h-9 w-full sm:w-36 rounded-md" />
          <Shimmer className="h-9 w-full sm:w-32 rounded-md" />
        </div>
      ) : null}
    </div>
  );
}

/** Accueil client / prestataire : stats optionnelles + colonnes */
export function DashboardHomeSkeleton({ withStats = true }: { withStats?: boolean }) {
  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
      <PageHeaderSkeleton withActions />
      {withStats ? (
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/60 shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <Shimmer className="h-4 w-24" />
                <Shimmer className="h-8 w-8 rounded-lg" />
              </div>
              <Shimmer className="h-8 w-16" />
              <Shimmer className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <Shimmer className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                <Shimmer className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Shimmer className="h-4 w-3/4" />
                  <Shimmer className="h-3 w-1/2" />
                </div>
                <Shimmer className="h-8 w-20 shrink-0 rounded-md" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <Shimmer className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-border/50 p-3">
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-3 w-5/6" />
                <div className="flex gap-2 pt-1">
                  <Shimmer className="h-6 w-16 rounded-full" />
                  <Shimmer className="h-6 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Liste type demandes / contrats / devis */
export function AdminListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-300">
      {Array.from({ length: items }).map((_, i) => (
        <Card key={i} className="border-border/60 shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 gap-3">
                <Shimmer className="hidden h-11 w-11 shrink-0 rounded-lg sm:block" />
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Shimmer className="h-5 w-44 max-w-full" />
                    <Shimmer className="h-5 w-16 rounded-full" />
                  </div>
                  <Shimmer className="h-4 w-full" />
                  <Shimmer className="h-4 w-4/5" />
                  <div className="flex flex-wrap gap-3 pt-1">
                    <Shimmer className="h-3.5 w-24" />
                    <Shimmer className="h-3.5 w-28" />
                    <Shimmer className="h-3.5 w-20" />
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Shimmer className="h-9 w-24 rounded-md" />
                <Shimmer className="h-9 w-9 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Page paramètres (onglets + formulaire) */
export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeaderSkeleton />
      <Shimmer className="h-10 w-full max-w-xl rounded-lg" />
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <Shimmer className="h-6 w-40" />
          <Shimmer className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Shimmer className="h-4 w-28" />
              <Shimmer className="h-10 w-full rounded-md" />
            </div>
          ))}
          <Shimmer className="h-10 w-32 rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

/** Page litiges */
export function LitigesPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Shimmer className="h-8 w-32" />
          <Shimmer className="h-4 w-full max-w-lg" />
        </div>
        <Shimmer className="h-10 w-40 rounded-md" />
      </div>
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <Shimmer className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Shimmer className="h-16 w-full rounded-lg" />
            <Shimmer className="h-16 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
      <AdminListSkeleton items={2} />
    </div>
  );
}

/** Champs dans une carte (onglets paramètres) */
export function InlineFormSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6 py-2 animate-in fade-in duration-300">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="h-10 w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Profil prestataire (formulaire long) */
export function ProfilePageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeaderSkeleton withActions />
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          <Shimmer className="h-24 w-24 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-4">
            <Shimmer className="h-7 w-48" />
            <Shimmer className="h-4 w-full max-w-md" />
            <div className="flex flex-wrap gap-2">
              <Shimmer className="h-6 w-20 rounded-full" />
              <Shimmer className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="border-border/60 shadow-sm">
          <CardHeader>
            <Shimmer className="h-6 w-40" />
            <Shimmer className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <InlineFormSkeleton rows={3} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Calendrier prestataire */
export function CalendrierPageSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-300">
      <Card className="border-border/60 shadow-sm lg:col-span-2">
        <CardHeader>
          <Shimmer className="h-6 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Shimmer key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
          <Shimmer className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <Shimmer className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Shimmer key={i} className="h-20 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/** Détail (demande, mission, profil) */
export function DetailPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Shimmer className="h-9 w-28 rounded-md" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardContent className="space-y-4 p-6">
            <Shimmer className="h-7 w-2/3" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-full" />
            <Shimmer className="h-4 w-3/4" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Shimmer className="h-20 rounded-lg" />
              <Shimmer className="h-20 rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <Shimmer className="h-5 w-32" />
            <Shimmer className="h-10 w-full rounded-md" />
            <Shimmer className="h-10 w-full rounded-md" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** @deprecated Utiliser DashboardHomeSkeleton ou PageHeaderSkeleton */
export function AdminPageSkeleton() {
  return <DashboardHomeSkeleton />;
}
