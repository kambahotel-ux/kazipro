import { useState } from "react";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MaterielImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function MaterielImageGallery({ images, alt, className }: MaterielImageGalleryProps) {
  const [index, setIndex] = useState(0);
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());

  const validImages = images.filter((url) => !brokenUrls.has(url));
  const safeIndex = Math.min(index, Math.max(validImages.length - 1, 0));
  const current = validImages[safeIndex];

  if (validImages.length === 0) {
    return (
      <div
        className={cn(
          "flex aspect-[4/3] items-center justify-center rounded-xl border bg-muted",
          className,
        )}
      >
        <Package className="h-14 w-14 text-muted-foreground/30" />
      </div>
    );
  }

  const go = (next: number) => {
    const len = validImages.length;
    setIndex((next + len) % len);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative overflow-hidden rounded-xl border bg-muted aspect-[4/3] max-h-[min(24rem,50vh)]">
        <img
          key={current}
          src={current}
          alt={alt}
          className="h-full w-full object-contain bg-black/[0.03]"
          onError={() =>
            setBrokenUrls((prev) => {
              const next = new Set(prev);
              next.add(current);
              return next;
            })
          }
        />
        {validImages.length > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-90 shadow"
              onClick={() => go(safeIndex - 1)}
              aria-label="Image précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-90 shadow"
              onClick={() => go(safeIndex + 1)}
              aria-label="Image suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="absolute bottom-2 right-2 rounded-md bg-background/85 px-2 py-0.5 text-xs font-medium shadow">
              {safeIndex + 1} / {validImages.length}
            </span>
          </>
        )}
      </div>

      {validImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {validImages.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-colors sm:h-16 sm:w-16",
                i === safeIndex ? "border-primary" : "border-transparent opacity-75 hover:opacity-100",
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
