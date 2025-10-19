"use client";

import * as React from "react";
import { JSX, useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";

// UI (shadcn)
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// Dependent geo data helpers
import { getDivisions, getDistricts, getUpazilas } from "@/app/data/bd-geo";
import { BloodGroupEnum, RoleEnum } from "@/app/enums/index.enum";


const BLOOD_GROUPS = Object.values(BloodGroupEnum) as BloodGroupEnum[];



// Safely turn enum into options (works for string or numeric enums)
const roleValues = Object.values(RoleEnum).filter(
  (v) => typeof v === "string"
) as string[] as RoleEnum[];

const baseDonorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z
    .string()
    .min(11, "Enter a valid mobile number")
    .max(11, "Enter a valid mobile number")
    .regex(/^01\d{9}$/, "Bangladesh number (11 digits, starts with 01)"),
  bloodGroup: z.enum(BloodGroupEnum).or(z.string().min(1, "Select blood group")),
  age: z
    .union([z.number().int().min(1).max(120), z.nan()])
    .transform((v) => (Number.isNaN(v) ? undefined : v))
    .optional(),
  presentDivision: z.string().optional(),
  presentDistrict: z.string().optional(),
  presentUpazilla: z.string().optional(),
  lastDonationDate: z.date().optional().nullable(),
  email: z.string().min(1, "email should not be empty").email({ message: "email must be an email" }),
  // NEW: roles required, min 1
  roles: z.array(z.nativeEnum(RoleEnum)).min(1, "Select at least one role"),
});

const createDonorSchema = baseDonorSchema
  .extend({
    password: z
      .string()
      .min(6, "password must be longer than or equal to 6 characters")
      .max(100, "password must be shorter than or equal to 100 characters"),
    confirmPassword: z
      .string()
      .min(6, "confirmPassword must be longer than or equal to 6 characters")
      .max(100, "confirmPassword must be shorter than or equal to 100 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const updateDonorSchema = baseDonorSchema
  .extend({
    password: z
      .string()
      .optional()
      .refine(
        (v) => !v || v.length === 0 || (v.length >= 6 && v.length <= 100),
        "Password must be between 6 and 100 characters if provided"
      ),
    confirmPassword: z
      .string()
      .optional()
      .refine(
        (v) => !v || v.length === 0 || (v.length >= 6 && v.length <= 100),
        "Confirm Password must be between 6 and 100 characters if provided"
      ),
  })
  .refine(
    (data) => {
      if (!data.password && !data.confirmPassword) return true;
      return data.password === data.confirmPassword;
    },
    { message: "Passwords do not match", path: ["confirmPassword"] }
  );

export type DonorFormDTO = {
  _id?: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroupEnum | string;
  age?: number | null;
  presentDivision?: string | null;
  presentDistrict?: string | null;
  presentUpazilla?: string | null;
  lastDonationDate?: string | null; // we’ll send ISO string or null
  email: string;
  roles: RoleEnum[]; // NEW
  password?: string;
  confirmPassword?: string;
};

type FormValuesCreate = z.infer<typeof createDonorSchema>;
type FormValuesUpdate = z.infer<typeof updateDonorSchema>;
type FormValues = FormValuesCreate | FormValuesUpdate;

type Props = {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<DonorFormDTO>; // presence of _id => update mode
  onCreate?: (payload: Omit<DonorFormDTO, "_id">) => Promise<void>;
  onUpdate?: (id: string, payload: Omit<DonorFormDTO, "_id">) => Promise<void>;
};

export default function DonorModal({
  open,
  onClose,
  initialData,
  onCreate,
  onUpdate,
}: Props): JSX.Element {
  const mode: "create" | "edit" = initialData?._id ? "edit" : "create";
  const [submitting, setSubmitting] = useState(false);

  const defaultRoles = [RoleEnum.USER]; // ✅ as requested

  const defaultValues: Partial<FormValues> = useMemo(
    () => ({
      name: initialData?.name ?? "",
      phone: initialData?.phone ?? "",
      bloodGroup: (initialData?.bloodGroup as BloodGroupEnum | string) ?? "",
      age: typeof initialData?.age === "number" ? initialData?.age : (undefined as any),
      presentDivision: initialData?.presentDivision ?? "",
      presentDistrict: initialData?.presentDistrict ?? "",
      presentUpazilla: initialData?.presentUpazilla ?? "",
      lastDonationDate: initialData?.lastDonationDate
        ? new Date(initialData.lastDonationDate)
        : null,
      email: initialData?.email ?? "",
      roles: (initialData?.roles && initialData.roles.length > 0)
        ? (initialData.roles as RoleEnum[])
        : defaultRoles, // ✅ ensure at least [User]
      password: "",
      confirmPassword: "",
    }),
    [initialData]
  );

  const schema = mode === "create" ? createDonorSchema : updateDonorSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  });

  // keep form in sync when dialog reuses same instance for different rows
  useEffect(() => {
    form.reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultValues)]);

  // Dependent selects
  const divValue = form.watch("presentDivision");
  const distValue = form.watch("presentDistrict");

  const divisionOptions = useMemo(
    () => getDivisions().map((d) => ({ label: d, value: d })),
    []
  );
  const districtOptions = useMemo(
    () => getDistricts(divValue).map((d) => ({ label: d, value: d })),
    [divValue]
  );
  const upazilaOptions = useMemo(
    () => getUpazilas(divValue, distValue).map((u) => ({ label: u, value: u })),
    [divValue, distValue]
  );

  // reset children when parent changes
  useEffect(() => {
    form.setValue("presentDistrict", "");
    form.setValue("presentUpazilla", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [divValue]);
  useEffect(() => {
    form.setValue("presentUpazilla", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distValue]);

  // Submit
  const handleSubmit = async (values: FormValues) => {
    const basePayload: Omit<DonorFormDTO, "_id"> = {
      name: values.name.trim(),
      phone: values.phone.trim(),
      bloodGroup: values.bloodGroup as BloodGroupEnum,
      age: values.age,
      presentDivision: values.presentDivision || undefined,
      presentDistrict: values.presentDistrict || undefined,
      presentUpazilla: values.presentUpazilla || undefined,
      lastDonationDate: values.lastDonationDate
        ? values.lastDonationDate.toISOString()
        : null,
      email: values.email.trim(),
      roles: (values.roles?.length ? values.roles : [RoleEnum.USER]) as RoleEnum[], // ✅ enforce at least [User]
    };

    const payload: Omit<DonorFormDTO, "_id"> =
      mode === "create"
        ? {
            ...basePayload,
            password: (values as FormValuesCreate).password,
            confirmPassword: (values as FormValuesCreate).confirmPassword,
          }
        : {
            ...basePayload,
            ...(values.password ? { password: values.password } : {}),
            ...(values.confirmPassword ? { confirmPassword: values.confirmPassword } : {}),
          };

    setSubmitting(true);
    try {
      if (mode === "create" && onCreate) {
        await toast.promise(onCreate(payload), {
          loading: "Creating donor…",
          success: "Donor created",
          error: "Failed to create donor",
        });
      } else if (mode === "edit" && onUpdate && initialData?._id) {
        await toast.promise(onUpdate(initialData._id!, payload), {
          loading: "Saving changes…",
          success: "Donor updated",
          error: "Failed to update donor",
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for multi-select changes
  const toMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>): RoleEnum[] =>
    Array.from(e.target.selectedOptions).map((o) => o.value as RoleEnum);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add Donor" : "Edit Donor"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Create a new donor profile." : "Update donor information."}
          </DialogDescription>
        </DialogHeader>

        <Card className="border border-border">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                {/* Identity & Blood */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <Controller
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...field}
                          type="text"
                          placeholder="e.g., Arif Hossain"
                          className="w-full rounded-md border px-3 py-2"
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* Phone */}
                  <Controller
                    control={form.control}
                    name="phone"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...field}
                          type="tel"
                          inputMode="numeric"
                          placeholder="01XXXXXXXXX"
                          className="w-full rounded-md border px-3 py-2"
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* Blood Group */}
                  <Controller
                    control={form.control}
                    name="bloodGroup"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Blood Group <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...field}
                          className="w-full rounded-md border px-3 py-2 bg-white"
                        >
                          <option value="">Select blood group</option>
                          {BLOOD_GROUPS.map((bg) => (
                            <option key={bg} value={bg}>
                              {bg}
                            </option>
                          ))}
                        </select>
                        {fieldState.error && (
                          <p className="text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* Age */}
                  <Controller
                    control={form.control}
                    name="age"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Age</label>
                        <input
                          type="number"
                          className="w-full rounded-md border px-3 py-2"
                          placeholder="e.g., 25"
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.onChange(v === "" ? Number.NaN : Number(v));
                          }}
                          onBlur={field.onBlur}
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Credentials + Roles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <Controller
                    control={form.control}
                    name="email"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...field}
                          type="email"
                          placeholder="you@example.com"
                          className="w-full rounded-md border px-3 py-2"
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* Roles (multi-select) */}
                  <Controller
                    control={form.control}
                    name="roles"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium">
                          Roles <span className="text-red-500">*</span>
                        </label>
                        <select
                          multiple
                          className="w-full rounded-md border px-3 py-2 bg-white min-h-[44px]"
                          value={field.value ?? defaultRoles}
                          onChange={(e) => field.onChange(toMultiSelect(e))}
                          onBlur={field.onBlur}
                        >
                          {roleValues.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Tip: Hold Ctrl/Cmd to select multiple.
                        </p>
                        {fieldState.error && (
                          <p className="text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* Passwords */}
                  <Controller
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          {mode === "create" ? "Password" : "Password (leave blank to keep)"}
                          {mode === "create" && <span className="text-red-500"> *</span>}
                        </label>
                        <input
                          {...field}
                          type="password"
                          placeholder={mode === "create" ? "Enter password" : "Leave blank to keep unchanged"}
                          className="w-full rounded-md border px-3 py-2"
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          {mode === "create" ? "Confirm Password" : "Confirm Password (leave blank)"}
                          {mode === "create" && <span className="text-red-500"> *</span>}
                        </label>
                        <input
                          {...field}
                          type="password"
                          placeholder={mode === "create" ? "Re-enter password" : "Leave blank if not changing"}
                          className="w-full rounded-md border px-3 py-2"
                        />
                        {fieldState.error && (
                          <p className="text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Address (Dependent selects) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Division */}
                  <Controller
                    control={form.control}
                    name="presentDivision"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Division <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...field}
                          className="w-full rounded-md border px-3 py-2 bg-white"
                        >
                          <option value="">Select division</option>
                          {divisionOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        {fieldState.error && (
                          <p className="text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* District */}
                  <Controller
                    control={form.control}
                    name="presentDistrict"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          District <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...field}
                          disabled={!divValue}
                          className="w-full rounded-md border px-3 py-2 bg-white disabled:opacity-60"
                        >
                          <option value="">{divValue ? "Select district" : "Select division first"}</option>
                          {districtOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        {fieldState.error && (
                          <p className="text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* Upazilla */}
                  <Controller
                    control={form.control}
                    name="presentUpazilla"
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Upazilla <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...field}
                          disabled={!distValue}
                          className="w-full rounded-md border px-3 py-2 bg-white disabled:opacity-60"
                        >
                          <option value="">{distValue ? "Select upazilla" : "Select district first"}</option>
                          {upazilaOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        {fieldState.error && (
                          <p className="text-sm text-red-600">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Last Donation */}
                <Controller
                  control={form.control}
                  name="lastDonationDate"
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Last Donation Date</label>
                      <input
                        type="date"
                        className="w-full rounded-md border px-3 py-2"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v ? new Date(v + "T00:00:00") : null);
                        }}
                        onBlur={field.onBlur}
                      />
                      {fieldState.error && (
                        <p className="text-sm text-red-600">{fieldState.error.message}</p>
                      )}
                    </div>
                  )}
                />

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="min-w-[130px]" disabled={submitting}>
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {mode === "create" ? "Creating…" : "Saving…"}
                      </span>
                    ) : mode === "create" ? (
                      "Create Donor"
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
