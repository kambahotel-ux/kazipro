import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Période"
}: DateRangeFilterProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4" />
          {label}
        </Label>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground sm:hidden">Date de début</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            placeholder="Du"
            className="text-sm h-10"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground sm:hidden">Date de fin</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            placeholder="Au"
            className="text-sm h-10"
          />
        </div>
      </div>
    </div>
  );
}
