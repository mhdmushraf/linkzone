import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MultiSelect({ label, options, value, onChange, allLabel }) {
  const [open, setOpen] = useState(false);
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const display = value.length === 0
    ? (allLabel || `All ${label}`)
    : value.length === 1
      ? (options.find((o) => o.value === value[0])?.label || value[0])
      : `${value.length} ${label}`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 font-500 justify-between min-w-[8rem]">
          <span className="truncate text-xs">{display}</span>
          <ChevronDown className="w-3.5 h-3.5 ml-1 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="start">
        <div className="max-h-60 overflow-y-auto">
          {options.map((o) => (
            <button key={o.value} onClick={() => toggle(o.value)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-muted text-left">
              <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", value.includes(o.value) ? "bg-primary border-primary" : "border-border")}>
                {value.includes(o.value) && <Check className="w-3 h-3 text-white" />}
              </span>
              <span className="truncate">{o.label}</span>
            </button>
          ))}
        </div>
        {value.length > 0 && <button onClick={() => onChange([])} className="w-full text-xs text-primary font-600 mt-1 pt-1.5 border-t border-border">Clear</button>}
      </PopoverContent>
    </Popover>
  );
}