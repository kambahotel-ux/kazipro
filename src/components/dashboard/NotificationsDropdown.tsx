import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationsApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { toast } from "sonner";

interface AppNotification {
  id: string | number;
  type?: string;
  titre?: string;
  title?: string;
  message?: string;
  contenu?: string;
  lu?: boolean;
  created_at?: string;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const hasFetchedRef = useRef(false);

  const unreadCount = items.filter((n) => !n.lu).length;

  const fetchNotifications = useCallback(async (options?: { silent?: boolean; force?: boolean }) => {
    const silent = options?.silent ?? false;
    try {
      if (!silent) setLoading(true);
      const res = await notificationsApi.getAll({ force: options?.force });
      setItems(unwrapPaginated<AppNotification>(res));
      hasFetchedRef.current = true;
    } catch {
      if (!hasFetchedRef.current) setItems([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Rechargement à l'ouverture si pas encore chargé
  useEffect(() => {
    if (open) {
      void fetchNotifications({ silent: hasFetchedRef.current, force: hasFetchedRef.current });
    }
  }, [open, fetchNotifications]);

  // Rafraîchissement silencieux seulement quand le menu est ouvert
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      void fetchNotifications({ silent: true, force: true });
    }, 120_000);
    return () => clearInterval(interval);
  }, [open, fetchNotifications]);

  const handleMarkRead = async (id: string | number) => {
    try {
      await notificationsApi.marquerLu(String(id));
      setItems((prev) =>
        prev.map((n) => (String(n.id) === String(id) ? { ...n, lu: true } : n)),
      );
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.marquerToutLu();
      setItems((prev) => prev.map((n) => ({ ...n, lu: true })));
      toast.success("Toutes les notifications lues");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    }
  };

  const label = (n: AppNotification) =>
    n.titre ?? n.title ?? n.type ?? "Notification";

  const body = (n: AppNotification) => n.message ?? n.contenu ?? "";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title="Notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-secondary-foreground ring-2 ring-card">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.preventDefault();
                handleMarkAllRead();
              }}
            >
              <Check className="w-3 h-3 mr-1" />
              Tout lire
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Aucune notification
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.slice(0, 15).map((n) => (
              <DropdownMenuItem
                key={String(n.id)}
                className={`flex flex-col items-start gap-1 py-3 cursor-default ${!n.lu ? "bg-muted/50" : ""}`}
                onSelect={(e) => e.preventDefault()}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{label(n)}</p>
                  {!n.lu && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 shrink-0 px-2 text-xs"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      Lu
                    </Button>
                  )}
                </div>
                {body(n) && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{body(n)}</p>
                )}
                {n.created_at && (
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("fr-FR")}
                  </p>
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
