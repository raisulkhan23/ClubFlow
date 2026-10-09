import { Slot } from "@radix-ui/react-select";
import * as React from "react";
import { cn } from "@/lib/utils";

function SelectRoot({ children, ...props }: React.ComponentProps<"div"> & { defaultValue?: string; value?: string }) {
  return (
    <Slot className="relative" {...props}>
      {children}
    </Slot>
  );
}

function SelectGroup({ children, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="select-group" {...props}>{children}</div>;
}

function SelectValue({ placeholder, ...props }: React.ComponentProps<"div"> & { placeholder?: string }) {
  return (
    <div
      data-slot="select-value"
      className={cn("select-value text-sm", props.className)}
      {...props}
    >
      {placeholder}
    </div>
  );
}

function SelectTrigger({ className, children, ...props }: React.ComponentProps<"button"> & { value?: string }) {
  return (
    <button
      data-slot="select-trigger"
      className={cn(
        "inline-flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm outline-none transition-colors hover:bg-accent focus:border-ring data-[placeholder]:text-muted-foreground data-[state=open]:bg-accent data-[state=open]:border-ring",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function SelectContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-content"
      className={cn(
        "bg-popover text-popover-foreground shadow-lg z-50 max-h-96 rounded-md border overflow-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function SelectItem({ children, value, className, ...props }: React.ComponentProps<"div"> & { value?: string }) {
  const [itemProps, rest] = React.useMemo(() => {
    const item = {
      className: cn(
        "flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        className,
      ),
      ...props,
    };
    return [{ ...item, value }, {}];
  }, [className, props]);

  return (
    <div
      data-slot="select-item"
      data-value={value}
      {...itemProps}
    >
      {children}
    </div>
  );
}

export { SelectRoot, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem };
