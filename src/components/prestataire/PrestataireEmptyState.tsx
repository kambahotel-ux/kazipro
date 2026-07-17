import { PrestataireListEmptyState } from "@/components/prestataire/PrestataireListEmptyState";
import {
  usePrestataireListEmptyState,
  type PrestataireEmptyPageContext,
} from "@/hooks/usePrestataireListEmptyState";
import type { PrestataireEmptyAction } from "@/components/prestataire/PrestataireListEmptyState";

type PrestataireEmptyStateProps = {
  context: PrestataireEmptyPageContext;
  hasActiveFilters: boolean;
  onResetFilters?: () => void;
  extraActions?: PrestataireEmptyAction[];
  className?: string;
};

export function PrestataireEmptyState({
  context,
  hasActiveFilters,
  onResetFilters,
  extraActions,
  className,
}: PrestataireEmptyStateProps) {
  const state = usePrestataireListEmptyState({
    context,
    hasActiveFilters,
    onResetFilters,
    extraActions,
  });

  return (
    <PrestataireListEmptyState
      icon={state.icon}
      title={state.title}
      description={state.description}
      steps={state.steps}
      actions={state.actions}
      className={className}
    />
  );
}
