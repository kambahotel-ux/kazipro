import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  footer,
}: FormDrawerProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "flex flex-col gap-0 p-0",
          isDesktop ? "w-full sm:max-w-lg lg:max-w-xl" : "max-h-[92vh] rounded-t-xl",
          className,
        )}
      >
        <SheetHeader className="shrink-0 border-b px-4 py-4 text-left sm:px-6">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t px-4 py-4 sm:px-6">{footer}</div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
