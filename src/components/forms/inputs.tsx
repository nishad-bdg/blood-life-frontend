"use client"

import * as React from "react"
import type { Control, FieldPath, FieldValues } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronsUpDown, Check } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { Option } from "./type"

type BaseProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  description?: string
  className?: string
  disabled?: boolean
  requiredMarker?: boolean
}

/* ---------------------------- Text ---------------------------- */
export function RHFText<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  requiredMarker,
}: BaseProps<T> & React.ComponentProps<typeof Input>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {requiredMarker ? " *" : ""}
            </FormLabel>
          )}
          <FormControl>
            <Input {...field} disabled={disabled} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* -------------------------- Password -------------------------- */
export function RHFPassword<T extends FieldValues>(props: BaseProps<T> & { placeholder?: string }) {
  const { control, name, label, description, className, disabled, requiredMarker } = props
  const [show, setShow] = React.useState(false)
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("relative", className)}>
          {label && (
            <FormLabel>
              {label}
              {requiredMarker ? " *" : ""}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              <Input {...field} type={show ? "text" : "password"} disabled={disabled} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </Button>
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* --------------------------- Number --------------------------- */
export function RHFNumber<T extends FieldValues>(props: BaseProps<T> & { min?: number; max?: number; step?: number }) {
  const { control, name, label, description, className, disabled, requiredMarker, min, max, step } = props
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {requiredMarker ? " *" : ""}
            </FormLabel>
          )}
          <FormControl>
            <Input
              type="number"
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              value={field.value ?? ""}
              onChange={(e) => {
                const v = e.target.value
                field.onChange(v === "" ? undefined : Number(v))
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* -------------------------- Textarea -------------------------- */
export function RHFTextarea<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  requiredMarker,
}: BaseProps<T> & React.ComponentProps<typeof Textarea>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {requiredMarker ? " *" : ""}
            </FormLabel>
          )}
          <FormControl>
            <Textarea {...field} disabled={disabled} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* --------------------------- Select --------------------------- */
export function RHFSelect<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  requiredMarker,
  options,
  placeholder = "Select...",
}: BaseProps<T> & { options: Option[]; placeholder?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {requiredMarker ? " *" : ""}
            </FormLabel>
          )}
          <Select disabled={disabled} onValueChange={field.onChange} value={field.value ?? ""}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* -------------------------- Checkbox -------------------------- */
export function RHFCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
}: BaseProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-row items-start gap-2 space-y-0", className)}>
          <FormControl>
            <Checkbox checked={!!field.value} onCheckedChange={field.onChange} disabled={disabled} />
          </FormControl>
          <div className="space-y-1 leading-none">
            {label && <FormLabel>{label}</FormLabel>}
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

/* ------------------------- Radio Group ------------------------ */
export function RHFRadioGroup<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  options,
}: BaseProps<T> & { options: Option[] }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value ?? ""}
              className="grid grid-cols-1 gap-2"
              disabled={disabled}
            >
              {options.map((o) => (
                <div key={o.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={o.value} id={`${name}-${o.value}`} />
                  <FormLabel htmlFor={`${name}-${o.value}`} className="font-normal">
                    {o.label}
                  </FormLabel>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/* ---------------------------- Switch -------------------------- */
export function RHFSwitch<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
}: BaseProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex items-center justify-between", className)}>
          <div className="space-y-0.5">
            {label && <FormLabel>{label}</FormLabel>}
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </div>
          <FormControl>
            <Switch checked={!!field.value} onCheckedChange={field.onChange} disabled={disabled} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

/* ---------------------------- Slider -------------------------- */
export function RHFSlider<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  min = 0,
  max = 100,
  step = 1,
}: BaseProps<T> & { min?: number; max?: number; step?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = (Array.isArray(field.value) ? field.value : [field.value ?? min]) as number[]
        return (
          <FormItem className={className}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <div className="space-y-2">
                <Slider
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onValueChange={(v) => field.onChange(v)}
                  disabled={disabled}
                />
                <div className="text-xs text-muted-foreground">Value: {value.join(", ")}</div>
              </div>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

/* -------------------------- Date Picker ----------------------- */
export function RHFDate<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  placeholder = "Pick a date",
}: BaseProps<T> & { placeholder?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const date = field.value ? new Date(field.value) : undefined
        return (
          <FormItem className={className}>
            {label && <FormLabel>{label}</FormLabel>}
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    disabled={disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? date.toLocaleDateString() : placeholder}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => field.onChange(d ?? null)} initialFocus />
              </PopoverContent>
            </Popover>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

/* --------------------------- File Upload ---------------------- */
export function RHFFile<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  accept,
}: BaseProps<T> & { accept?: string }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // ✅ Safely narrow the type for display logic
        const file = (field.value ?? null) as File | null

        return (
          <FormItem className={className}>
            {label && <FormLabel>{label}</FormLabel>}
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  type="file"
                  accept={accept}
                  disabled={disabled}
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null
                    field.onChange(f) // store File | null
                  }}
                />
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (inputRef.current) inputRef.current.value = ""
                      field.onChange(null)
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </FormControl>

            {/* ✅ Only read properties when file exists */}
            {file && (
              <FormDescription className="text-xs">
                {file.name} • {(file.size / 1024).toFixed(1)} KB
              </FormDescription>
            )}
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

/* --------------------------- Combobox ------------------------- */
export function RHFCombobox<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  options,
  placeholder = "Select...",
}: BaseProps<T> & { options: Option[]; placeholder?: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = options.find((o) => o.value === field.value)
        return (
          <FormItem className={className}>
            {label && <FormLabel>{label}</FormLabel>}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-transparent"
                    disabled={disabled}
                  >
                    {selected ? selected.label : <span className="text-muted-foreground">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-(--radix-popover-trigger-width)">
                <Command>
                  <CommandInput placeholder="Search..." />
                  <CommandList>
                    <CommandEmpty>No result.</CommandEmpty>
                    <CommandGroup>
                      {options.map((o) => (
                        <CommandItem
                          key={o.value}
                          value={o.label}
                          onSelect={() => {
                            field.onChange(o.value)
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", o.value === field.value ? "opacity-100" : "opacity-0")}
                          />
                          {o.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

/* -------------------------- MultiSelect ----------------------- */
export function RHFMultiSelect<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  disabled,
  options,
  placeholder = "Select...",
}: BaseProps<T> & { options: Option[]; placeholder?: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value: string[] = Array.isArray(field.value) ? field.value : []
        const toggle = (v: string) => {
          const set = new Set(value)
          set.has(v) ? set.delete(v) : set.add(v)
          field.onChange(Array.from(set))
        }
        const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label)

        return (
          <FormItem className={className}>
            {label && <FormLabel>{label}</FormLabel>}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant="outline" className="w-full justify-between bg-transparent" disabled={disabled}>
                    <span className={cn("truncate", selectedLabels.length ? "" : "text-muted-foreground")}>
                      {selectedLabels.length ? selectedLabels.join(", ") : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-(--radix-popover-trigger-width)">
                <Command>
                  <CommandInput placeholder="Search..." />
                  <CommandList>
                    <CommandEmpty>No result.</CommandEmpty>
                    <CommandGroup>
                      {options.map((o) => {
                        const checked = value.includes(o.value)
                        return (
                          <CommandItem key={o.value} onSelect={() => toggle(o.value)}>
                            <Checkbox checked={checked} className="mr-2" />
                            {o.label}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
