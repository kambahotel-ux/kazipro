import { useCallback, useRef, useState } from "react";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SlideToConfirmVariant = "default" | "success" | "destructive";

interface SlideToConfirmProps {
  label: string;
  hint?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: SlideToConfirmVariant;
  className?: string;
  successMessage?: string;
}

const variantStyles: Record<
  SlideToConfirmVariant,
  { track: string; fill: string; thumb: string; text: string }
> = {
  default: {
    track: "bg-muted border-border",
    fill: "bg-primary/20",
    thumb: "bg-primary text-primary-foreground",
    text: "text-muted-foreground",
  },
  success: {
    track: "bg-success/10 border-success/30",
    fill: "bg-success/25",
    thumb: "bg-success text-success-foreground",
    text: "text-success/80",
  },
  destructive: {
    track: "bg-destructive/10 border-destructive/30",
    fill: "bg-destructive/25",
    thumb: "bg-destructive text-destructive-foreground",
    text: "text-destructive/80",
  },
};

export function SlideToConfirm({
  label,
  hint = "Glisser pour confirmer",
  onConfirm,
  disabled = false,
  loading = false,
  variant = "default",
  className,
  successMessage = "Confirmé",
}: SlideToConfirmProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);
  const startXRef = useRef(0);
  const maxDragRef = useRef(0);

  const styles = variantStyles[variant];
  const isBusy = loading || internalLoading;
  const isDisabled = disabled || isBusy || confirmed;

  const reset = useCallback(() => {
    setDragX(0);
    setDragging(false);
  }, []);

  const getMaxDrag = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const thumbWidth = 48;
    return Math.max(0, track.clientWidth - thumbWidth - 8);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isDisabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    maxDragRef.current = getMaxDrag();
    startXRef.current = e.clientX - dragX;
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || isDisabled) return;
    const next = Math.min(Math.max(0, e.clientX - startXRef.current), maxDragRef.current);
    setDragX(next);
  };

  const handlePointerUp = async () => {
    if (!dragging || isDisabled) return;
    setDragging(false);
    const threshold = maxDragRef.current * 0.85;

    if (dragX >= threshold) {
      setDragX(maxDragRef.current);
      setInternalLoading(true);
      try {
        await onConfirm();
        setConfirmed(true);
      } catch {
        reset();
      } finally {
        setInternalLoading(false);
      }
    } else {
      reset();
    }
  };

  const progress = maxDragRef.current > 0 ? dragX / maxDragRef.current : 0;

  if (confirmed) {
    return (
      <div
        className={cn(
          "flex h-12 items-center justify-center gap-2 rounded-full border px-4",
          styles.track,
          className,
        )}
      >
        <Check className="h-5 w-5 text-success" />
        <span className="text-sm font-medium text-success">{successMessage}</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div
        ref={trackRef}
        className={cn(
          "relative h-12 select-none overflow-hidden rounded-full border",
          styles.track,
          isDisabled && "cursor-not-allowed opacity-60",
        )}
      >
        <div
          className={cn("absolute inset-y-0 left-0 transition-[width] duration-75", styles.fill)}
          style={{ width: `${Math.max(progress * 100, dragging ? 8 : 0)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center px-14">
          <span className={cn("truncate text-sm font-medium", styles.text)}>
            {isBusy ? "Traitement…" : hint}
          </span>
        </div>
        <div
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label={label}
          tabIndex={isDisabled ? -1 : 0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={reset}
          onKeyDown={(e) => {
            if (isDisabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              void (async () => {
                setInternalLoading(true);
                try {
                  await onConfirm();
                  setConfirmed(true);
                } finally {
                  setInternalLoading(false);
                }
              })();
            }
          }}
          className={cn(
            "absolute left-1 top-1 flex h-10 w-12 cursor-grab items-center justify-center rounded-full shadow-md transition-transform active:cursor-grabbing",
            styles.thumb,
            dragging && "cursor-grabbing",
          )}
          style={{ transform: `translateX(${dragX}px)` }}
        >
          {isBusy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
