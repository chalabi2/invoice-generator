import * as React from "react";
import { CalendarDays } from "lucide-react";
import { format, isValid, parse } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { normalizeHex } from "@/features/invoice/lib/utils";

export const EditableLabel = ({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) => {
  const [editing, setEditing] = React.useState(false);

  if (editing) {
    return (
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setEditing(false)}
        className={cn("h-7 text-xs", className)}
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
        className
      )}
    >
      {value}
    </button>
  );
};

export const Field = ({
  label,
  onLabelChange,
  children,
  hint,
}: {
  label: string;
  onLabelChange: (value: string) => void;
  children: React.ReactNode;
  hint?: string;
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <EditableLabel value={label} onChange={onLabelChange} />
        {hint ? (
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
};

export const ColorField = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-[hsl(var(--muted-foreground))]">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={normalizeHex(value)}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={cn(
            "h-9 w-12 cursor-pointer rounded-md border border-[hsl(var(--border))] bg-transparent p-1",
            disabled && "cursor-not-allowed opacity-50"
          )}
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export const DatePickerField = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => {
  const displayFormat = "MM/dd/yyyy";
  const [open, setOpen] = React.useState(false);
  const today = new Date();
  const startMonth = new Date(today.getFullYear() - 100, 0, 1);
  const endMonth = new Date(today.getFullYear() + 100, 11, 31);
  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selected}
          className="w-full justify-between font-normal data-[empty=true]:text-[hsl(var(--muted-foreground))]"
        >
          <span>{selected ? format(selected, displayFormat) : placeholder}</span>
          <CalendarDays className="h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        avoidCollisions={false}
        sideOffset={8}
        className="w-auto overflow-hidden p-0"
      >
        <Calendar
          mode="single"
          selected={selected}
          captionLayout="dropdown"
          startMonth={startMonth}
          endMonth={endMonth}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          defaultMonth={selected}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
