import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { FormField } from "@/convex/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UploadCloud, FileCheck2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type FieldValues = Record<string, unknown>;

/**
 * Renders the organizer-built registration form. Fully controlled so the same
 * component powers live registration and the form-builder preview.
 */
export function DynamicFormFields({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
}: {
  fields: FormField[];
  values: FieldValues;
  onChange: (fieldId: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}) {
  const isVisible = (field: FormField): boolean => {
    if (!field.dependsOn) return true;
    return values[field.dependsOn.fieldId] === field.dependsOn.value;
  };

  return (
    <div className="space-y-5">
      {fields.filter(isVisible).map((field) => {
        const value = values[field.id];
        const error = errors[field.id];
        return (
          <div key={field.id} className="space-y-1.5">
            {field.type !== "checkbox" && (
              <Label htmlFor={`field-${field.id}`} className="flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
            )}
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}

            <FieldInput field={field} value={value} onChange={(v) => onChange(field.id, v)} disabled={disabled} />

            {error && <p className="text-xs text-red-600 dark:text-red-300">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
}) {
  switch (field.type) {
    case "textarea":
      return (
        <Textarea
          id={`field-${field.id}`}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
        />
      );
    case "number":
      return (
        <Input
          id={`field-${field.id}`}
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          disabled={disabled}
        />
      );
    case "date":
      return (
        <Input
          id={`field-${field.id}`}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    case "select":
      return (
        <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v)} disabled={disabled}>
          <SelectTrigger id={`field-${field.id}`} className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "radio":
      return (
        <RadioGroup
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}
          className="gap-2"
        >
          {(field.options ?? []).map((opt) => (
            <Label
              key={opt}
              htmlFor={`field-${field.id}-${opt}`}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-sm font-normal transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5"
            >
              <RadioGroupItem id={`field-${field.id}-${opt}`} value={opt} />
              {opt}
            </Label>
          ))}
        </RadioGroup>
      );
    case "checkbox":
      return (
        <Label
          htmlFor={`field-${field.id}`}
          className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-sm font-normal transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5"
        >
          <Checkbox
            id={`field-${field.id}`}
            checked={value === true}
            onCheckedChange={(checked) => onChange(checked === true)}
            disabled={disabled}
          />
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </Label>
      );
    case "multiselect":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {(field.options ?? []).map((opt) => {
            const list = Array.isArray(value) ? (value as string[]) : [];
            const checked = list.includes(opt);
            return (
              <Label
                key={opt}
                htmlFor={`field-${field.id}-${opt}`}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-sm font-normal transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5"
              >
                <Checkbox
                  id={`field-${field.id}-${opt}`}
                  checked={checked}
                  onCheckedChange={(c) => onChange(c === true ? [...list, opt] : list.filter((o) => o !== opt))}
                  disabled={disabled}
                />
                {opt}
              </Label>
            );
          })}
        </div>
      );
    case "file":
      return <FileUpload storageId={typeof value === "string" ? value : undefined} onUploaded={(id) => onChange(id)} disabled={disabled} />;
    default:
      return (
        <Input
          id={`field-${field.id}`}
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={field.type === "email" ? "you@example.com" : field.type === "phone" ? "+880 1XXX-XXXXXX" : undefined}
        />
      );
  }
}

function FileUpload({
  storageId,
  onUploaded,
  disabled,
}: {
  storageId?: string;
  onUploaded: (storageId: string) => void;
  disabled: boolean;
}) {
  const generateUploadUrl = useMutation(api.registrations.generateUploadUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = (await res.json()) as { storageId: string };
      onUploaded(storageId);
    } catch {
      setError("Upload failed. Please try a smaller file.");
    } finally {
      setUploading(false);
    }
  };

  if (storageId) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
        <FileCheck2 className="size-4" /> File attached
        <button
          type="button"
          className="ml-auto text-xs underline underline-offset-2"
          onClick={() => onUploaded("")}
          disabled={disabled}
        >
          Remove
        </button>
      </p>
    );
  }

  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:bg-accent/40",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {uploading ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
      {uploading ? "Uploading…" : "Choose a file to upload"}
      <input
        type="file"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && file.size <= 5 * 1024 * 1024) void handleFile(file);
          else if (file) setError("File is too large (max 5 MB).");
        }}
      />
      {error && <span className="text-red-600 dark:text-red-300">{error}</span>}
    </label>
  );
}
