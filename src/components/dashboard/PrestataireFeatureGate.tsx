import type { ReactNode } from "react";
import ProfileRequiredGuard from "@/components/dashboard/ProfileRequiredGuard";

/** Bloque le contenu si profil incomplet ou compte non validé (prestataire). */
export function PrestataireFeatureGate({ children }: { children: ReactNode }) {
  return <ProfileRequiredGuard>{children}</ProfileRequiredGuard>;
}
