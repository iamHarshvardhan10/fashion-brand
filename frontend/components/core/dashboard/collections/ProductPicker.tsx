"use client";

import { useEffect, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, ImageIcon, Loader2Icon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { fetchProducts, type ProductListItem } from "@/services/operations/productAPI";
import { formatPaise, statusLabels } from "@/lib/product-options";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Minimal product shape the picker needs (works for list items and collection products)
export type PickedProduct = {
    id: string;
    name: string;
    price: number;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    imageUrl: string | null;
};

export const toPicked = (p: ProductListItem): PickedProduct => ({
    id: p.id,
    name: p.name,
    price: p.price,
    status: p.status,
    imageUrl: p.image?.url ?? null,
});

const thumb = (url: string) => url.replace("/upload/", "/upload/f_auto,q_auto,w_96/");

export default function ProductPicker({ value, onChange }: { value: PickedProduct[]; onChange: (value: PickedProduct[]) => void }) {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<PickedProduct[]>([]);
    const [loading, setLoading] = useState(true);

    // Debounced search; an empty box shows the newest products
    useEffect(() => {
        let cancelled = false;
        const t = setTimeout(() => {
            setLoading(true);
            fetchProducts({ search: search.trim() || undefined, pageSize: 8, sort: "newest" })
                .then(({ items }) => !cancelled && setResults(items.map(toPicked)))
                .catch(() => !cancelled && setResults([]))
                .finally(() => !cancelled && setLoading(false));
        }, 250);
        return () => {
            cancelled = true;
            clearTimeout(t);
        };
    }, [search]);

    const chosen = new Set(value.map((p) => p.id));
    const move = (i: number, delta: number) => {
        const next = [...value];
        [next[i], next[i + delta]] = [next[i + delta], next[i]];
        onChange(next);
    };

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {/* Selected */}
            <div className="grid content-start gap-2">
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">In this collection · {value.length}</p>
                {value.length ? (
                    <ol className="grid max-h-72 gap-1 overflow-y-auto border p-1">
                        {value.map((p, i) => (
                            <li key={p.id} className="flex items-center gap-2 bg-card px-1.5 py-1">
                                <span className="w-5 text-right font-mono text-[10px] text-muted-foreground">{i + 1}</span>
                                <Thumb url={p.imageUrl} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm">{p.name}</p>
                                    <p className={cn("font-mono text-[10px]", p.status === "ACTIVE" ? "text-muted-foreground" : "text-amber-700")}>
                                        {formatPaise(p.price)}
                                        {p.status !== "ACTIVE" && ` · ${statusLabels[p.status]} (hidden in store)`}
                                    </p>
                                </div>
                                <Button type="button" variant="ghost" size="icon-xs" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                                    <ArrowUpIcon />
                                </Button>
                                <Button type="button" variant="ghost" size="icon-xs" aria-label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)}>
                                    <ArrowDownIcon />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label={`Remove ${p.name}`}
                                    onClick={() => onChange(value.filter((x) => x.id !== p.id))}
                                    className="hover:text-destructive"
                                >
                                    <XIcon />
                                </Button>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">No products yet. Add some from the right.</p>
                )}
            </div>

            {/* Search */}
            <div className="grid content-start gap-2">
                <div className="relative">
                    <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                        placeholder="Search products or SKUs"
                        aria-label="Search products"
                        className="pl-8"
                    />
                    {loading && <Loader2Icon className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
                </div>
                <ul className="grid max-h-64 gap-1 overflow-y-auto">
                    {results.map((p) => (
                        <li key={p.id}>
                            <button
                                type="button"
                                disabled={chosen.has(p.id)}
                                onClick={() => onChange([...value, p])}
                                className="flex w-full items-center gap-2 border border-transparent px-1.5 py-1 text-left hover:border-border hover:bg-muted/50 disabled:opacity-40"
                            >
                                <Thumb url={p.imageUrl} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm">{p.name}</span>
                                    <span className="font-mono text-[10px] text-muted-foreground">{formatPaise(p.price)}</span>
                                </span>
                                {chosen.has(p.id) ? (
                                    <span className="font-mono text-[10px] text-muted-foreground uppercase">Added</span>
                                ) : (
                                    <PlusIcon className="size-4" />
                                )}
                            </button>
                        </li>
                    ))}
                    {!loading && !results.length && <li className="px-2 py-4 text-center text-sm text-muted-foreground">No products found</li>}
                </ul>
            </div>
        </div>
    );
}

function Thumb({ url }: { url: string | null }) {
    return (
        <span className="flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden border bg-muted">
            {url ? (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail
                <img src={thumb(url)} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
                <ImageIcon className="size-3.5 text-muted-foreground" />
            )}
        </span>
    );
}
