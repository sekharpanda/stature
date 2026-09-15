"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import {
  createFormFieldAction,
  deleteFormFieldAction,
  toggleFormActiveAction,
} from "@/actions/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELD_TYPES = [
  "TEXT",
  "EMAIL",
  "PHONE",
  "TEXTAREA",
  "SELECT",
  "NUMBER",
  "CHECKBOX",
  "HIDDEN",
] as const;

export function FormFieldEditor({
  formId,
  isActive,
  fields,
}: {
  formId: string;
  isActive: boolean;
  fields: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    isRequired: boolean;
  }>;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<string>("TEXT");
  const [required, setRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Status:{" "}
          <span className="font-medium text-foreground">
            {isActive ? "Active" : "Inactive"}
          </span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            await toggleFormActiveAction({ formId, isActive: !isActive });
            router.refresh();
          }}
        >
          {isActive ? "Deactivate" : "Activate"}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Label</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Required</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{field.label}</td>
                <td className="px-4 py-3 text-muted-foreground">{field.name}</td>
                <td className="px-4 py-3">{field.type}</td>
                <td className="px-4 py-3">{field.isRequired ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${field.label}`}
                    onClick={async () => {
                      await deleteFormFieldAction({ fieldId: field.id });
                      router.refresh();
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_160px_auto_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError(null);
          const result = await createFormFieldAction({
            formId,
            label,
            type,
            isRequired: required,
          });
          setLoading(false);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setLabel("");
          setRequired(false);
          router.refresh();
        }}
      >
        <div className="space-y-1">
          <Label htmlFor="field-label">New field label</Label>
          <Input
            id="field-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="field-type">Type</Label>
          <select
            id="field-type"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          Required
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Adding…" : "Add field"}
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-destructive md:col-span-4">{error}</p>
        ) : null}
      </form>
    </div>
  );
}
