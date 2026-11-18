"use client";

import { useMemo, useState } from "react";
import { PlusIcon, RefreshCwIcon, Trash2Icon, WandSparklesIcon, XIcon } from "lucide-react";
import { colorPalette, makeSku, sizeRank, sizeSystems } from "@/lib/product-options";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { newKey, type VariantRow } from "./form-state";
import { Field, NativeSelect } from "./fields";

type Colour = { name: string; hex: string };

type VariantsEditorProps = {
    rows: VariantRow[];
    onChange: (rows: VariantRow[]) => void;
    skuPrefix: string; // style code, or a fallback from the name
    basePrice: string;
    baseMrp: string;
    errors: Record<string, string>;
};

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function VariantsEditor({ rows, onChange, skuPrefix, basePrice, baseMrp, errors }: VariantsEditorProps) {
    // Builder state is seeded from existing rows so editing a product shows its current options
    const [systemId, setSystemId] = useState(() => {
        const sizes = rows.map((r) => r.size);
        return sizeSystems.find((s) => sizes.some((size) => s.sizes.includes(size)))?.id ?? "apparel";
    });
    const [sizes, setSizes] = useState<string[]>(() => [...new Set(rows.map((r) => r.size))]);
    const [colours, setColours] = useState<Colour[]>(() => {
        const seen = new Map<string, Colour>();
        for (const r of rows) if (r.color && !seen.has(r.color)) seen.set(r.color, { name: r.color, hex: r.colorHex || "#cccccc" });
        return [...seen.values()];
    });
    const [customSize, setCustomSize] = useState("");
    const [newColour, setNewColour] = useState<Colour>({ name: "", hex: "#000000" });
    const [bulkStock, setBulkStock] = useState("");

    const system = sizeSystems.find((s) => s.id === systemId)!;
    const sizeOptions = [...new Set([...system.sizes, ...sizes])];

    const missing = useMemo(() => {
        const combos = (colours.length ? colours : [null]).flatMap((c) => sizes.map((size) => ({ size, colour: c })));
        return combos.filter(({ size, colour }) => !rows.some((r) => sameText(r.size, size) && sameText(r.color, colour?.name ?? "")));
    }, [colours, sizes, rows]);

    const totals = useMemo(() => {
        const active = rows.filter((r) => r.isActive);
        return {
            stock: active.reduce((sum, r) => sum + (Number(r.stock) || 0), 0),
            out: active.filter((r) => !Number(r.stock)).length,
        };
    }, [rows]);

    function toggleSize(size: string) {
        setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size].sort((a, b) => sizeRank(a) - sizeRank(b))));
    }

    function addCustomSize() {
        const size = customSize.trim().slice(0, 20);
        if (size && !sizes.includes(size)) setSizes((prev) => [...prev, size]);
        setCustomSize("");
    }

    function addColour(colour: Colour) {
        const name = colour.name.trim();
        if (!name || colours.some((c) => sameText(c.name, name))) return;
        setColours((prev) => [...prev, { name, hex: colour.hex }]);
        setNewColour({ name: "", hex: "#000000" });
    }

    function generate() {
        const added: VariantRow[] = missing.map(({ size, colour }) => ({
            key: newKey(),
            sku: makeSku(skuPrefix, size, colour?.name ?? null),
            barcode: "",
            size,
            color: colour?.name ?? "",
            colorHex: colour?.hex ?? "",
            price: "",
            mrp: "",
            stock: "0",
            lowStockThreshold: "5",
            isActive: true,
        }));
        // Keep rows grouped by colour, then in size order
        const colourOrder = (name: string) => {
            const i = colours.findIndex((c) => sameText(c.name, name));
            return i === -1 ? colours.length : i;
        };
        onChange([...rows, ...added].sort((a, b) => colourOrder(a.color) - colourOrder(b.color) || sizeRank(a.size) - sizeRank(b.size)));
    }

    function update(index: number, patch: Partial<VariantRow>) {
        onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    }

    const err = (i: number, key: string) => errors[`variants.${i}.${key}`];

    return (
        <div className="grid gap-5">
            {/* Builder */}
            <div className="grid gap-4 border bg-muted/30 p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <Field label="Size system" htmlFor="size-system" className="w-56">
                        <NativeSelect id="size-system" value={systemId} onChange={(e) => setSystemId(e.target.value)}>
                            {sizeSystems.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.label}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>
                    <div className="flex gap-2">
                        <Input
                            value={customSize}
                            onChange={(e) => setCustomSize(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key !== "Enter") return;
                                e.preventDefault(); // don't submit the product form
                                addCustomSize();
                            }}
                            placeholder="Custom size, e.g. 3–4Y"
                            aria-label="Custom size"
                            className="w-44"
                        />
                        <Button type="button" variant="outline" size="icon" aria-label="Add size" onClick={addCustomSize}>
                            <PlusIcon />
                        </Button>
                    </div>
                </div>

                <div className="grid gap-2">
                    <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Sizes</p>
                    <div className="flex flex-wrap gap-1.5">
                        {sizeOptions.map((size) => (
                            <button
                                key={size}
                                type="button"
                                aria-pressed={sizes.includes(size)}
                                onClick={() => toggleSize(size)}
                                className={cn(
                                    "h-8 min-w-10 border px-2.5 font-mono text-xs transition-colors",
                                    sizes.includes(size) ? "border-foreground bg-foreground text-background" : "bg-background hover:border-foreground/50",
                                )}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-2">
                    <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                        Colours <span className="normal-case tracking-normal">(leave empty for single-colour products)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {colours.map((c) => (
                            <span key={c.name} className="inline-flex h-8 items-center gap-1.5 border bg-background pr-1 pl-2 text-xs">
                                <span className="size-3.5 border" style={{ backgroundColor: c.hex }} />
                                {c.name}
                                <button type="button" aria-label={`Remove ${c.name}`} onClick={() => setColours((prev) => prev.filter((x) => x !== c))}>
                                    <XIcon className="size-3.5" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="color"
                            aria-label="Colour swatch"
                            value={newColour.hex}
                            onChange={(e) => setNewColour((c) => ({ ...c, hex: e.target.value }))}
                            className="h-8 w-10 cursor-pointer border bg-transparent p-0.5"
                        />
                        <Input
                            value={newColour.name}
                            onChange={(e) => setNewColour((c) => ({ ...c, name: e.target.value.slice(0, 40) }))}
                            onKeyDown={(e) => {
                                if (e.key !== "Enter") return;
                                e.preventDefault();
                                addColour(newColour);
                            }}
                            placeholder="Colour name"
                            aria-label="Colour name"
                            className="w-40"
                        />
                        <Button type="button" variant="outline" size="sm" className="font-mono text-[11px] uppercase" onClick={() => addColour(newColour)}>
                            Add colour
                        </Button>
                        <span className="text-xs text-muted-foreground">or pick:</span>
                        <div className="flex flex-wrap gap-1">
                            {colorPalette
                                .filter((p) => !colours.some((c) => sameText(c.name, p.name)))
                                .map((p) => (
                                    <button
                                        key={p.name}
                                        type="button"
                                        title={p.name}
                                        aria-label={`Add ${p.name}`}
                                        onClick={() => addColour(p)}
                                        className="size-6 border hover:scale-110"
                                        style={{ backgroundColor: p.hex }}
                                    />
                                ))}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                    <Button type="button" onClick={generate} disabled={!missing.length} className="font-mono text-xs tracking-wider uppercase">
                        <WandSparklesIcon />
                        {missing.length ? `Add ${missing.length} variant${missing.length === 1 ? "" : "s"}` : "All combinations added"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Adds every size × colour combination that isn&apos;t in the table yet.</p>
                </div>
            </div>

            {/* Table */}
            {rows.length ? (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm">
                            <span className="font-mono">{rows.length}</span> variants ·{" "}
                            <span className="font-mono">{totals.stock}</span> units in stock
                            {totals.out > 0 && <span className="text-destructive"> · {totals.out} out of stock</span>}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <Input
                                type="number"
                                min={0}
                                value={bulkStock}
                                onChange={(e) => setBulkStock(e.target.value)}
                                placeholder="Stock"
                                aria-label="Stock for all variants"
                                className="w-24 font-mono"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={bulkStock === "" || Number(bulkStock) < 0}
                                onClick={() => onChange(rows.map((r) => ({ ...r, stock: String(Math.floor(Number(bulkStock))) })))}
                                className="font-mono text-[11px] uppercase"
                            >
                                Set for all
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                title="Rebuild every SKU from the style code, colour and size"
                                onClick={() => onChange(rows.map((r) => ({ ...r, sku: makeSku(skuPrefix, r.size, r.color || null) })))}
                                className="font-mono text-[11px] uppercase"
                            >
                                <RefreshCwIcon />
                                Regenerate SKUs
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto border">
                        <Table className="min-w-[960px]">
                            <TableHeader>
                                <TableRow className="font-mono text-[10px] tracking-[0.15em] uppercase">
                                    <TableHead>Variant</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="w-24">Stock</TableHead>
                                    <TableHead className="w-28">Price ₹</TableHead>
                                    <TableHead className="w-28">MRP ₹</TableHead>
                                    <TableHead className="w-20" title="Show as low stock at or below this">Alert at</TableHead>
                                    <TableHead className="w-36">Barcode</TableHead>
                                    <TableHead className="w-16">On</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row, i) => {
                                    const stock = Number(row.stock);
                                    const low = row.isActive && stock > 0 && stock <= Number(row.lowStockThreshold || 0);
                                    return (
                                        <TableRow key={row.key} className={cn(!row.isActive && "opacity-50")}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {row.color && (
                                                        <span className="size-4 shrink-0 border" style={{ backgroundColor: row.colorHex || "#ccc" }} title={row.color} />
                                                    )}
                                                    <div className="grid gap-1">
                                                        <div className="flex gap-1">
                                                            <Input
                                                                value={row.size}
                                                                onChange={(e) => update(i, { size: e.target.value.slice(0, 20) })}
                                                                aria-label="Size"
                                                                aria-invalid={Boolean(err(i, "size"))}
                                                                className="h-7 w-20 font-mono text-xs"
                                                            />
                                                            <Input
                                                                value={row.color}
                                                                onChange={(e) => update(i, { color: e.target.value.slice(0, 40) })}
                                                                placeholder="No colour"
                                                                aria-label="Colour"
                                                                className="h-7 w-28 text-xs"
                                                            />
                                                        </div>
                                                        {err(i, "size") && <span className="text-[11px] text-destructive">{err(i, "size")}</span>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={row.sku}
                                                    onChange={(e) => update(i, { sku: e.target.value.toUpperCase().slice(0, 60) })}
                                                    aria-label="SKU"
                                                    aria-invalid={Boolean(err(i, "sku"))}
                                                    className="h-7 min-w-44 font-mono text-xs"
                                                />
                                                {err(i, "sku") && <span className="text-[11px] text-destructive">{err(i, "sku")}</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    value={row.stock}
                                                    onChange={(e) => update(i, { stock: e.target.value })}
                                                    aria-label="Stock"
                                                    aria-invalid={Boolean(err(i, "stock"))}
                                                    className={cn("h-7 font-mono text-xs", row.isActive && stock === 0 && "border-destructive/50 text-destructive", low && "border-amber-400")}
                                                />
                                                {err(i, "stock") && <span className="text-[11px] text-destructive">{err(i, "stock")}</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={row.price}
                                                    onChange={(e) => update(i, { price: e.target.value })}
                                                    placeholder={basePrice || "Base"}
                                                    aria-label="Price override"
                                                    aria-invalid={Boolean(err(i, "price"))}
                                                    className="h-7 font-mono text-xs"
                                                />
                                                {err(i, "price") && <span className="text-[11px] text-destructive">{err(i, "price")}</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    value={row.mrp}
                                                    onChange={(e) => update(i, { mrp: e.target.value })}
                                                    placeholder={baseMrp || "Base"}
                                                    aria-label="MRP override"
                                                    className="h-7 font-mono text-xs"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    value={row.lowStockThreshold}
                                                    onChange={(e) => update(i, { lowStockThreshold: e.target.value })}
                                                    aria-label="Low stock alert"
                                                    className="h-7 font-mono text-xs"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={row.barcode}
                                                    onChange={(e) => update(i, { barcode: e.target.value.replace(/\D/g, "").slice(0, 14) })}
                                                    placeholder="EAN-13"
                                                    inputMode="numeric"
                                                    aria-label="Barcode"
                                                    aria-invalid={Boolean(err(i, "barcode"))}
                                                    className="h-7 font-mono text-xs"
                                                />
                                                {err(i, "barcode") && <span className="text-[11px] text-destructive">{err(i, "barcode")}</span>}
                                            </TableCell>
                                            <TableCell>
                                                <Switch size="sm" checked={row.isActive} onCheckedChange={(v) => update(i, { isActive: v })} aria-label="Variant active" />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label={`Remove ${row.size} ${row.color}`}
                                                    title={row.id ? "Removed on save. Variants with orders are switched off instead." : "Remove"}
                                                    onClick={() => onChange(rows.filter((_, j) => j !== i))}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2Icon />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Leave price/MRP empty to use the product price. Stock changes are recorded in the inventory log.
                        Removing a variant that has been ordered switches it off instead of deleting it.
                    </p>
                </>
            ) : (
                <p className="border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    Pick sizes (and colours, if any) above, then add the variants. Every product needs at least one active variant to go live.
                </p>
            )}
        </div>
    );
}
