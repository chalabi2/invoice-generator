import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const isDropdownLayout =
    props.captionLayout === "dropdown" ||
    props.captionLayout === "dropdown-months" ||
    props.captionLayout === "dropdown-years"

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "relative flex h-10 items-center justify-center px-10",
        caption: "relative flex h-10 items-center justify-center px-10",
        caption_label: cn("text-sm font-medium", isDropdownLayout && "sr-only"),
        dropdowns: "flex items-center justify-center gap-2",
        caption_dropdowns: "flex items-center justify-center gap-2",
        dropdown_root:
          "rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm",
        dropdown:
          "h-8 cursor-pointer rounded-md bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
        nav: "pointer-events-none absolute inset-x-0 top-2 !flex h-8 items-center justify-between",
        nav_button: cn(buttonVariants({ variant: "ghost" }), "h-7 w-7 p-0"),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "pointer-events-auto absolute left-2 top-2 z-10 h-7 w-7 cursor-pointer bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "pointer-events-auto absolute right-2 top-2 z-10 h-7 w-7 cursor-pointer bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        nav_button_previous:
          "pointer-events-auto absolute left-1 z-10 h-7 w-7 cursor-pointer",
        nav_button_next:
          "pointer-events-auto absolute right-1 z-10 h-7 w-7 cursor-pointer",
        chevron: "h-4 w-4",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-[hsl(var(--muted-foreground))] rounded-md w-9 font-normal text-[0.8rem]",
        week: "mt-2 flex w-full",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 cursor-pointer p-0 font-normal aria-selected:opacity-100"
        ),
        selected:
          "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]",
        today: "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]",
        outside:
          "text-[hsl(var(--muted-foreground))] opacity-50 aria-selected:bg-[hsl(var(--muted))] aria-selected:text-[hsl(var(--muted-foreground))] aria-selected:opacity-30",
        disabled: "text-[hsl(var(--muted-foreground))] opacity-50",
        range_middle:
          "aria-selected:bg-[hsl(var(--accent))] aria-selected:text-[hsl(var(--accent-foreground))]",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className, ...props }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
          ) : orientation === "down" ? (
            <ChevronDown className={cn("h-4 w-4", className)} {...props} />
          ) : orientation === "up" ? (
            <ChevronUp className={cn("h-4 w-4", className)} {...props} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", className)} {...props} />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
