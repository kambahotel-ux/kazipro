import { UserLitigesView } from "@/components/litiges/UserLitigesView";

export default function PrestataireLitigesPage({ embedded = false }: { embedded?: boolean }) {
  return <UserLitigesView role="prestataire" embedded={embedded} />;
}
