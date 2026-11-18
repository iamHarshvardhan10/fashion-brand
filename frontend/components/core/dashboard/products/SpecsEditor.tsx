"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { specGroups, specSuggestions } from "@/lib/product-options";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { newKey, type SpecRow } from "./form-state";

// Rows of the "Product details" accordion: Fabric → 100% Cotton, Fit → Oversized ...
export default function SpecsEditor({
    rows,
    onChange,
    errors,
}: {
    rows: SpecRow[];
    onChange: (rows: SpecRow[]) => void;
    errors: Record<string, string>;
}) {
    const [group, setGroup] = useState(specGroups[0].label);
    const has = (label: string) => rows.some((r) => r.label.trim().toLowerCase() === label.toLowerCase());

    const add = (label = "") => onChange([...rows, { key: newKey(), label, values: "" }]);
    const update = (i: number, patch: Partial<SpecRow>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    const move = (i: number, delta: number) => {
        const next = [...rows];
        [next[i], next[i + delta]] = [next[i + delta], next[i]];
        onChange(next);
    };

    return (
        <div className="grid gap-4">
            <div className="grid gap-2 border bg-muted/30 p-3">
                <div className="flex flex-wrap gap-1">
                    {specGroups.map((g) => (
                        <button
                            key={g.label}
                            type="button"
                            onClick={() => setGroup(g.label)}
                            className={cn(
                                "px-2 py-1 font-mono text-[10px] tracking-widest uppercase",
                                group === g.label ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {specGroups
                        .find((g) => g.label === group)!
                        .specs.map((label) => (
                            <Button
                                key={label}
                                type="button"
                                variant="outline"
                                size="xs"
                                disabled={has(label)}
                                onClick={() => add(label)}
                                className="bg-background"
                            >
                                <PlusIcon />
                                {label}
                            </Button>
                        ))}
                    <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        className="bg-background"
                        onClick={() => onChange([...rows, ...specGroups.find((g) => g.label === group)!.specs.filter((l) => !has(l)).map((label) => ({ key: newKey(), label, values: "" }))])}
                    >
                        Add all {group.toLowerCase()} specs
                    </Button>
                </div>
            </div>

            {rows.length > 0 && (
                <ul className="grid gap-2">
                    {rows.map((row, i) => {
                        const suggestions = specSuggestions[row.label.trim()] ?? [];
                        const listId = `spec-suggest-${row.key}`;
                        return (
                            <li key={row.key} className="grid gap-2 border p-2 sm:grid-cols-[180px_1fr_auto]">
                                <div className="grid gap-1">
                                    <Input
                                        value={row.label}
                                        maxLength={40}
                                        placeholder="Spec name"
                                        aria-label="Spec name"
                                        aria-invalid={Boolean(errors[`attributes.${i}.label`])}
                                        onChange={(e) => update(i, { label: e.target.value })}
                                        className="font-medium"
                                    />
                                    {errors[`attributes.${i}.label`] && <span className="text-xs text-destructive">{errors[`attributes.${i}.label`]}</span>}
                                </div>
                                <div className="grid gap-1">
                                    <Textarea
                                        value={row.values}
                                        rows={Math.min(Math.max(row.values.split("\n").length, 1), 5)}
                                        placeholder="One value per line"
                                        aria-label={`${row.label || "Spec"} values`}
                                        aria-invalid={Boolean(errors[`attributes.${i}.values`])}
                                        onChange={(e) => update(i, { values: e.target.value })}
                                        className="min-h-8 py-1.5"
                                    />
                                    {suggestions.length > 0 && (
                                        <div className="flex flex-wrap gap-1" id={listId}>
                                            {suggestions
                                                .filter((s) => !row.values.split("\n").map((v) => v.trim()).includes(s))
                                                .slice(0, 8)
                                                .map((s) => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => update(i, { values: row.values.trim() ? `${row.values.trim()}\n${s}` : s })}
                                                        className="border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                                                    >
                                                        + {s}
                                                    </button>
                                                ))}
                                        </div>
                                    )}
                                    {errors[`attributes.${i}.values`] && <span className="text-xs text-destructive">{errors[`attributes.${i}.values`]}</span>}
                                </div>
                                <div className="flex items-start gap-0.5">
                                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                                        <ArrowUpIcon />
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                                        <ArrowDownIcon />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={`Remove ${row.label || "spec"}`}
                                        onClick={() => onChange(rows.filter((_, j) => j !== i))}
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2Icon />
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <Button type="button" variant="outline" size="sm" onClick={() => add()} className="w-fit font-mono text-[11px] tracking-wider uppercase">
                <PlusIcon />
                Custom spec
            </Button>
        </div>
    );
}
