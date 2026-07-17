import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  defaultDashboardForRole,
  getCachedUserRole,
  isSuperAdminEmail,
  resolveUserRoleSafe,
  type AppRole,
} from "@/lib/user-role";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  /** Prestataire non validé peut accéder (ex. page en attente). */
  skipPrestataireValidation?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, skipPrestataireValidation }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [resolvedRole, setResolvedRole] = useState<AppRole | null>(null);
  const [checkingRole, setCheckingRole] = useState(Boolean(allowedRoles?.length));

  const allowedRolesKey =
    allowedRoles?.length ? [...allowedRoles].sort().join("|") : "";

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!user || !allowedRoles?.length) {
        setResolvedRole(null);
        setCheckingRole(false);
        return;
      }

      setCheckingRole(true);
      const userId = String(user.id);
      const cachedRole = getCachedUserRole(userId);
      if (cachedRole) {
        setResolvedRole(cachedRole);
        setCheckingRole(false);
        return;
      }

      try {
        const role = await resolveUserRoleSafe(user);
        if (active) {
          setResolvedRole(role);
        }
      } finally {
        if (active) {
          setCheckingRole(false);
        }
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [user, allowedRolesKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  if (allowedRoles?.length) {
    if (checkingRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Vérification des permissions...</p>
          </div>
        </div>
      );
    }

    if (!resolvedRole) {
      const roleFromUser = String(user.role ?? "").toLowerCase() as AppRole;
      const fallback: AppRole | null =
        isSuperAdminEmail(user.email)
          ? "admin"
          : ["admin", "prestataire", "client"].includes(roleFromUser)
            ? roleFromUser
            : null;
      if (fallback && allowedRoles.includes(fallback)) {
        return <>{children}</>;
      }
      return <Navigate to="/connexion" replace />;
    }

    if (!allowedRoles.includes(resolvedRole)) {
      return <Navigate to={defaultDashboardForRole(resolvedRole)} replace />;
    }

  }

  return <>{children}</>;
}
