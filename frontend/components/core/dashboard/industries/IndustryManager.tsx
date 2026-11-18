"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageIcon, PencilIcon, PlusIcon, RefreshCwIcon, ShirtIcon, Trash2Icon } from "lucide-react";
import {
    createIndustry,
    deleteIndustry,
    fetchIndustries,
    patchIndustry,
    updateIndustry,
    type Industry,
    type IndustryFormValues,
} from "@/services/operations/industryAPI";
import { refreshNavigation } from "@/lib/actions/navigation";
import { errorMessage } from "@/utils/apiError";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DeleteDialog from "@/components/core/dashboard/categories/DeleteDialog";
import IndustryFormDialog from "./IndustryFormDialog";

// The navbar caches industries; expire that cache so changes show straight away
const syncNavbar = () => refreshNavigation().catch(() => {});

export default function IndustryManager() {
    const [items, setItems] = useState<Industry[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const [editing, setEditing] = useState<{ industry?: Industry } | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [toDelete, setToDelete] = useState<Industry | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            setItems(await fetchIndustries());
        } catch (error) {
            setLoadError(errorMessage(error, "Could not load industries"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        fetchIndustries()
            .then((data) => !cancelled && setItems(data))
            .catch((error) => !cancelled && setLoadError(errorMessage(error, "Could not load industries")))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, []);

    function openForm(industry?: Industry) {
        setEditing({ industry });
        setFormKey((k) => k + 1);
        setFormOpen(true);
    }

    async function handleSubmit(values: IndustryFormValues) {
        if (editing?.industry) await updateIndustry(editing.industry.id, values);
        else await createIndustry(values);
        await Promise.all([load(), syncNavbar()]);
    }

    // Optimistic switch, rolled back if the request fails
    async function handleSwitch(id: string, key: "isActive" | "showInNav", value: boolean) {
        const apply = (v: boolean) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: v } : i)));
        setActionError(null);
        apply(value);
        try {
            await patchIndustry(id, { [key]: value });
            syncNavbar();
        } catch (error) {
            apply(!value);
            setActionError(errorMessage(error, "Could not update"));
        }
    }

    const inNav = items.filter((i) => i.isActive && i.showInNav).length;

    return (
        <>
            <Card className="rounded-none">
                <CardHeader>
                    <CardTitle className="font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">All industries</CardTitle>
                    <CardDescription>
                        {loading ? "Loading…" : `${inNav} in the navbar, shown left to right by menu order. Each opens a dropdown of its categories.`}
                    </CardDescription>
                    <CardAction className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon-lg"
                            aria-label="Refresh"
                            onClick={() => {
                                setLoading(true);
                                load();
                            }}
                        >
                            <RefreshCwIcon className={cn(loading && "animate-spin")} />
                        </Button>
                        <Button size="lg" onClick={() => openForm()} className="font-mono text-xs tracking-wider uppercase">
                            <PlusIcon />
                            Add industry
                        </Button>
                    </CardAction>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* What the navbar will show */}
                    {!loading && inNav > 0 && (
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border bg-muted/30 px-4 py-3">
                            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Navbar</span>
                            {items
                                .filter((i) => i.isActive && i.showInNav)
                                .map((i) => (
                                    <span key={i.id} className="text-xs font-medium tracking-[0.2em] uppercase">
                                        {i.name}
                                    </span>
                                ))}
                        </div>
                    )}

                    {actionError && (
                        <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {actionError}
                        </p>
                    )}

                    {loadError ? (
                        <Empty title="Couldn't load industries" text={loadError} action={<Button variant="outline" onClick={() => { setLoading(true); load(); }}>Try again</Button>} />
                    ) : loading && !items.length ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-none" />
                            ))}
                        </div>
                    ) : !items.length ? (
                        <Empty
                            title="No industries yet"
                            text="Create Men, Women or Kids to build the navbar menus."
                            action={
                                <Button onClick={() => openForm()}>
                                    <PlusIcon />
                                    Add industry
                                </Button>
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-[760px]">
                                <TableHeader>
                                    <TableRow className="font-mono text-[11px] tracking-[0.15em] uppercase">
                                        <TableHead>Industry</TableHead>
                                        <TableHead>Categories in menu</TableHead>
                                        <TableHead className="text-right">Products</TableHead>
                                        <TableHead className="text-right">Order</TableHead>
                                        <TableHead>In navbar</TableHead>
                                        <TableHead>Active</TableHead>
                                        <TableHead className="w-20">
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((industry) => (
                                        <TableRow key={industry.id} className={cn(!industry.isActive && "opacity-60")}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden border bg-muted">
                                                        {industry.imageUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL
                                                            <img src={industry.imageUrl.replace("/upload/", "/upload/f_auto,q_auto,w_80/")} alt="" className="size-full object-cover" />
                                                        ) : (
                                                            <ImageIcon className="size-3.5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{industry.name}</p>
                                                        <p className="font-mono text-xs text-muted-foreground">/{industry.slug}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {industry.categories.length ? (
                                                    <div className="flex max-w-80 flex-wrap gap-1">
                                                        {industry.categories.map((c) => (
                                                            <span
                                                                key={c.id}
                                                                className={cn("border px-1.5 py-0.5 text-xs", !c.isActive && "border-dashed text-muted-foreground")}
                                                                title={c.isActive ? undefined : "Hidden category: not shown in the navbar"}
                                                            >
                                                                {c.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">None — shows as a plain link</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{industry._count.products}</TableCell>
                                            <TableCell className="text-right font-mono text-muted-foreground">{industry.sortOrder}</TableCell>
                                            <TableCell>
                                                <Switch
                                                    size="sm"
                                                    checked={industry.showInNav}
                                                    disabled={!industry.isActive}
                                                    onCheckedChange={(v) => handleSwitch(industry.id, "showInNav", v)}
                                                    aria-label={`${industry.name} in navbar`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    size="sm"
                                                    checked={industry.isActive}
                                                    onCheckedChange={(v) => handleSwitch(industry.id, "isActive", v)}
                                                    aria-label={`${industry.name} active`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end">
                                                    <Button variant="ghost" size="icon-sm" onClick={() => openForm(industry)} aria-label={`Edit ${industry.name}`}>
                                                        <PencilIcon />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        aria-label={`Delete ${industry.name}`}
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() => {
                                                            setToDelete(industry);
                                                            setDeleteOpen(true);
                                                        }}
                                                    >
                                                        <Trash2Icon />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {editing && <IndustryFormDialog key={formKey} open={formOpen} onOpenChange={setFormOpen} initial={editing.industry} onSubmit={handleSubmit} />}

            {toDelete && (
                <DeleteDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title={`Delete ${toDelete.name}?`}
                    description={
                        toDelete._count.products
                            ? `It's removed from the navbar and from ${toDelete._count.products} product${toDelete._count.products === 1 ? "" : "s"}. The products and categories themselves are kept.`
                            : "It's removed from the navbar. Categories are not affected."
                    }
                    onConfirm={async () => {
                        await deleteIndustry(toDelete.id);
                        await Promise.all([load(), syncNavbar()]);
                    }}
                />
            )}
        </>
    );
}

function Empty({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-3 border border-dashed px-6 py-12 text-center">
            <ShirtIcon className="size-8 text-muted-foreground" />
            <div>
                <p className="font-display text-xl font-black tracking-tight uppercase font-stretch-75%">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
            {action}
        </div>
    );
}
