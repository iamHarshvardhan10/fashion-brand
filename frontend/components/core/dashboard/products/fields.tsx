"use client";

import { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Section({
    id,
    title,
    description,
    action,
    children,
    className,
}: {
    id?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <Card id={id} className={cn("scroll-mt-24 rounded-none", className)}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="grid gap-1">
                    <CardTitle className="font-display text-xl font-black tracking-tight uppercase font-stretch-75%">{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </div>
                {action}
            </CardHeader>
            <CardContent className="grid gap-5">{children}</CardContent>
        </Card>
    );
}

export function Field({
    label,
    htmlFor,
    error,
    hint,
    optional,
    counter,
    children,
    className,
}: {
    label: React.ReactNode;
    htmlFor?: string;
    error?: string;
    hint?: React.ReactNode;
    optional?: boolean;
    counter?: { value: number; max: number };
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("grid content-start gap-2", className)}>
            <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={htmlFor}>
                    {label}
                    {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
                </Label>
                {counter && (
                    <span className={cn("font-mono text-[10px] text-muted-foreground", counter.value > counter.max && "text-destructive")}>
                        {counter.value}/{counter.max}
                    </span>
                )}
            </div>
            {children}
            {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

// Styled native select: accessible, works with forms, no extra dependency
export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
    return (
        <select
            className={cn(
                "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30",
                className,
            )}
            {...props}
        />
    );
}

// ₹ amount entered in rupees (converted to paise on save)
export function RupeeInput({ className, ...props }: React.ComponentProps<typeof Input>) {
    return (
        <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
            <Input type="number" inputMode="decimal" min={0} step="0.01" className={cn("pl-6 font-mono", className)} {...props} />
        </div>
    );
}

// Ordered list of short lines, e.g. highlights
export function ListInput({
    values,
    onChange,
    placeholder,
    max,
    maxLength,
    errors,
}: {
    values: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
    max: number;
    maxLength: number;
    errors?: (index: number) => string | undefined;
}) {
    return (
        <div className="grid gap-2">
            {values.map((value, i) => (
                <div key={i} className="grid gap-1">
                    <div className="flex gap-2">
                        <Input
                            value={value}
                            maxLength={maxLength}
                            placeholder={placeholder}
                            aria-invalid={Boolean(errors?.(i))}
                            aria-label={`Item ${i + 1}`}
                            onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove item ${i + 1}`}
                            onClick={() => onChange(values.filter((_, j) => j !== i))}
                        >
                            <XIcon />
                        </Button>
                    </div>
                    {errors?.(i) && <p className="text-xs text-destructive">{errors(i)}</p>}
                </div>
            ))}
            {values.length < max && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit font-mono text-[11px] tracking-wider uppercase"
                    onClick={() => onChange([...values, ""])}
                >
                    <PlusIcon />
                    Add
                </Button>
            )}
        </div>
    );
}

// Free-form tags: Enter or comma adds one
export function ChipsInput({
    id,
    values,
    onChange,
    placeholder,
    max,
}: {
    id?: string;
    values: string[];
    onChange: (values: string[]) => void;
    placeholder: string;
    max: number;
}) {
    const [draft, setDraft] = useState("");

    function commit(text = draft) {
        const items = text
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);
        const next = [...values];
        for (const item of items) if (!next.includes(item) && next.length < max) next.push(item.slice(0, 40));
        onChange(next);
        setDraft("");
    }

    return (
        <div className="flex min-h-8 flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
            {values.map((value) => (
                <span key={value} className="inline-flex items-center gap-1 bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {value}
                    <button type="button" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((v) => v !== value))}>
                        <XIcon className="size-3" />
                    </button>
                </span>
            ))}
            <input
                id={id}
                value={draft}
                disabled={values.length >= max}
                placeholder={values.length >= max ? "Limit reached" : placeholder}
                onChange={(e) => (e.target.value.includes(",") ? commit(e.target.value) : setDraft(e.target.value))}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        commit();
                    } else if (e.key === "Backspace" && !draft && values.length) {
                        onChange(values.slice(0, -1));
                    }
                }}
                onBlur={() => commit()}
                className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
        </div>
    );
}
