"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
    ChevronRightIcon,
    FolderTreeIcon,
    ImageIcon,
    MoreHorizontalIcon,
    PencilIcon,
    PlusIcon,
    RefreshCwIcon,
    SearchIcon,
    Trash2Icon,
} from "lucide-react";
import { ApiError } from "@/utils/apiError";
import {
    createCategory,
    createSubCategory,
    deleteCategory,
    deleteSubCategory,
    fetchCategories,
    toggleCategory,
    toggleSubCategory,
    updateCategory,
    updateSubCategory,
    type Category,
    type CategoryFormValues,
    type SubCategory,
} from "@/services/operations/categoryAPI";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import CategoryFormDialog from "./CategoryFormDialog";
import DeleteDialog from "./DeleteDialog";

type FormState =
    | { kind: "category"; category?: Category }
    | { kind: "sub-category"; parent: Category; sub?: SubCategory };

type DeleteState =
    | { kind: "category"; category: Category }
    | { kind: "sub-category"; parent: Category; sub: SubCategory };

export default function CategoryManager() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    // Dialog state is kept separately from `open` so content doesn't vanish mid close-animation
    const [form, setForm] = useState<FormState | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const [toDelete, setToDelete] = useState<DeleteState | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const load = useCallback(async () => {
        setLoadError(null);
        try {
            setCategories(await fetchCategories());
        } catch (error) {
            setLoadError(error instanceof ApiError ? error.message : "Could not load categories");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load: state is only set once the request settles
    useEffect(() => {
        let cancelled = false;
        fetchCategories()
            .then((data) => !cancelled && setCategories(data))
            .catch((error) => {
                if (!cancelled) setLoadError(error instanceof ApiError ? error.message : "Could not load categories");
            })
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return categories;
        return categories.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.slug.includes(q) ||
                c.subCategories?.some((s) => s.name.toLowerCase().includes(q)),
        );
    }, [categories, search]);

    const totals = useMemo(
        () => ({
            categories: categories.length,
            active: categories.filter((c) => c.isActive).length,
            subCategories: categories.reduce((sum, c) => sum + c._count.subCategories, 0),
        }),
        [categories],
    );

    function openForm(state: FormState) {
        setForm(state);
        setFormKey((k) => k + 1); // fresh form state every time
        setFormOpen(true);
    }

    function openDelete(state: DeleteState) {
        setToDelete(state);
        setDeleteOpen(true);
    }

    function toggleExpanded(id: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function handleSubmit(values: CategoryFormValues) {
        if (!form) return;
        if (form.kind === "category") {
            if (form.category) await updateCategory(form.category.id, values);
            else await createCategory(values);
        } else {
            if (form.sub) await updateSubCategory(form.sub.id, values);
            else await createSubCategory(form.parent.id, values);
            setExpanded((prev) => new Set(prev).add(form.parent.id));
        }
        await load();
    }

    async function handleDelete() {
        if (!toDelete) return;
        if (toDelete.kind === "category") await deleteCategory(toDelete.category.id);
        else await deleteSubCategory(toDelete.sub.id);
        await load();
    }

    // Optimistic toggle, rolled back if the request fails
    async function handleToggle(target: { categoryId: string; subId?: string }, isActive: boolean) {
        const apply = (value: boolean) =>
            setCategories((prev) =>
                prev.map((c) => {
                    if (c.id !== target.categoryId) return c;
                    if (!target.subId) return { ...c, isActive: value };
                    return {
                        ...c,
                        subCategories: c.subCategories?.map((s) => (s.id === target.subId ? { ...s, isActive: value } : s)),
                    };
                }),
            );

        setActionError(null);
        apply(isActive);
        try {
            if (target.subId) await toggleSubCategory(target.subId, isActive);
            else await toggleCategory(target.categoryId, isActive);
        } catch (error) {
            apply(!isActive);
            setActionError(error instanceof ApiError ? error.message : "Could not update status");
        }
    }

    return (
        <>
            <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="Categories" value={totals.categories} loading={loading} />
                <Stat label="Active in store" value={totals.active} loading={loading} />
                <Stat label="Sub-categories" value={totals.subCategories} loading={loading} />
            </div>

            <Card className="rounded-none">
                <CardHeader>
                    <CardTitle className="font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">
                        All categories
                    </CardTitle>
                    <CardDescription>Expand a category to manage its sub-categories</CardDescription>
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
                        <Button
                            size="lg"
                            onClick={() => openForm({ kind: "category" })}
                            className="font-mono text-xs tracking-wider uppercase"
                        >
                            <PlusIcon />
                            Add category
                        </Button>
                    </CardAction>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="relative max-w-sm">
                        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search categories or sub-categories"
                            className="pl-8"
                            aria-label="Search categories"
                        />
                    </div>

                    {actionError && (
                        <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {actionError}
                        </p>
                    )}

                    {loadError ? (
                        <EmptyState
                            title="Couldn't load categories"
                            text={loadError}
                            action={
                                <Button variant="outline" onClick={() => { setLoading(true); load(); }}>
                                    Try again
                                </Button>
                            }
                        />
                    ) : loading && !categories.length ? (
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-none" />
                            ))}
                        </div>
                    ) : !categories.length ? (
                        <EmptyState
                            title="No categories yet"
                            text="Create your first category to start organising products."
                            action={
                                <Button onClick={() => openForm({ kind: "category" })}>
                                    <PlusIcon />
                                    Add category
                                </Button>
                            }
                        />
                    ) : !filtered.length ? (
                        <EmptyState title="No matches" text={`Nothing matches “${search}”.`} />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="font-mono text-[11px] tracking-[0.15em] uppercase">
                                    <TableHead className="w-10" />
                                    <TableHead>Category</TableHead>
                                    <TableHead className="hidden text-right sm:table-cell">Subs</TableHead>
                                    <TableHead className="hidden text-right md:table-cell">Order</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-12 text-right">
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((category) => {
                                    const isOpen = expanded.has(category.id) || Boolean(search.trim());
                                    return (
                                        <Fragment key={category.id}>
                                            <TableRow className={cn(isOpen && "border-b-0 bg-muted/40")}>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => toggleExpanded(category.id)}
                                                        aria-expanded={isOpen}
                                                        aria-label={`${isOpen ? "Collapse" : "Expand"} ${category.name}`}
                                                    >
                                                        <ChevronRightIcon className={cn("transition-transform", isOpen && "rotate-90")} />
                                                    </Button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Thumb src={category.imageUrl} className="size-11" />
                                                        <div className="min-w-0">
                                                            <div className="truncate font-medium">{category.name}</div>
                                                            <div className="truncate font-mono text-xs text-muted-foreground">
                                                                /{category.slug}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden text-right font-mono sm:table-cell">
                                                    {category._count.subCategories}
                                                </TableCell>
                                                <TableCell className="hidden text-right font-mono text-muted-foreground md:table-cell">
                                                    {category.sortOrder}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusToggle
                                                        checked={category.isActive}
                                                        label={category.name}
                                                        onChange={(v) => handleToggle({ categoryId: category.id }, v)}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <RowActions
                                                        label={category.name}
                                                        onEdit={() => openForm({ kind: "category", category })}
                                                        onAddSub={() => openForm({ kind: "sub-category", parent: category })}
                                                        onDelete={() => openDelete({ kind: "category", category })}
                                                    />
                                                </TableCell>
                                            </TableRow>

                                            {isOpen && (
                                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                                    <TableCell />
                                                    <TableCell colSpan={5} className="pt-0 pb-4">
                                                        <SubCategoryList
                                                            category={category}
                                                            onAdd={() => openForm({ kind: "sub-category", parent: category })}
                                                            onEdit={(sub) => openForm({ kind: "sub-category", parent: category, sub })}
                                                            onDelete={(sub) => openDelete({ kind: "sub-category", parent: category, sub })}
                                                            onToggle={(sub, v) =>
                                                                handleToggle({ categoryId: category.id, subId: sub.id }, v)
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {form && (
                <CategoryFormDialog
                    key={formKey}
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    kind={form.kind}
                    parentName={form.kind === "sub-category" ? form.parent.name : undefined}
                    initial={form.kind === "category" ? form.category : form.sub}
                    onSubmit={handleSubmit}
                />
            )}

            {toDelete && (
                <DeleteDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title={`Delete ${toDelete.kind === "category" ? toDelete.category.name : toDelete.sub.name}?`}
                    description={
                        toDelete.kind === "category" ? (
                            toDelete.category._count.subCategories > 0 ? (
                                <>
                                    This also deletes its{" "}
                                    <strong className="text-foreground">
                                        {toDelete.category._count.subCategories} sub-categor
                                        {toDelete.category._count.subCategories === 1 ? "y" : "ies"}
                                    </strong>
                                    . This can&apos;t be undone.
                                </>
                            ) : (
                                "This category will be permanently removed. This can't be undone."
                            )
                        ) : (
                            `This removes it from ${toDelete.parent.name}. This can't be undone.`
                        )
                    }
                    onConfirm={handleDelete}
                />
            )}
        </>
    );
}

function SubCategoryList({
    category,
    onAdd,
    onEdit,
    onDelete,
    onToggle,
}: {
    category: Category;
    onAdd: () => void;
    onEdit: (sub: SubCategory) => void;
    onDelete: (sub: SubCategory) => void;
    onToggle: (sub: SubCategory, isActive: boolean) => void;
}) {
    const subs = category.subCategories ?? [];

    return (
        <div className="border bg-card">
            <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                    Sub-categories · {subs.length}
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAdd}
                    className="font-mono text-[11px] tracking-wider uppercase"
                >
                    <PlusIcon />
                    Add
                </Button>
            </div>
            {subs.length ? (
                <ul className="divide-y">
                    {subs.map((sub) => (
                        <li key={sub.id} className="flex items-center gap-3 px-3 py-2">
                            <Thumb src={sub.imageUrl} className="size-8" />
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">{sub.name}</div>
                                <div className="truncate font-mono text-[11px] text-muted-foreground">
                                    /{category.slug}/{sub.slug}
                                </div>
                            </div>
                            <span className="hidden font-mono text-xs text-muted-foreground sm:inline" title="Sort order">
                                #{sub.sortOrder}
                            </span>
                            <StatusToggle checked={sub.isActive} label={sub.name} onChange={(v) => onToggle(sub, v)} />
                            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(sub)} aria-label={`Edit ${sub.name}`}>
                                <PencilIcon />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onDelete(sub)}
                                aria-label={`Delete ${sub.name}`}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <Trash2Icon />
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                    No sub-categories yet.{" "}
                    <button type="button" onClick={onAdd} className="font-medium text-foreground underline underline-offset-4">
                        Add the first one
                    </button>
                </p>
            )}
        </div>
    );
}

function RowActions({
    label,
    onEdit,
    onAddSub,
    onDelete,
}: {
    label: string;
    onEdit: () => void;
    onAddSub: () => void;
    onDelete: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${label}`} />}>
                <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem onClick={onEdit}>
                    <PencilIcon />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddSub}>
                    <FolderTreeIcon />
                    Add sub-category
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2Icon />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function StatusToggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center gap-2">
            <Switch size="sm" checked={checked} onCheckedChange={onChange} aria-label={`${label} visible in store`} />
            <Badge
                className={cn(
                    "hidden rounded-none font-mono text-[10px] tracking-widest uppercase lg:inline-flex",
                    checked ? "bg-emerald-100 text-emerald-900" : "bg-neutral-200 text-neutral-700",
                )}
            >
                {checked ? "Active" : "Hidden"}
            </Badge>
        </div>
    );
}

function Thumb({ src, className }: { src: string | null; className?: string }) {
    return (
        <div className={cn("flex shrink-0 items-center justify-center overflow-hidden border bg-muted", className)}>
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL
                <img src={src} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
                <ImageIcon className="size-4 text-muted-foreground" />
            )}
        </div>
    );
}

function Stat({ label, value, loading }: { label: string; value: number; loading: boolean }) {
    return (
        <Card className="rounded-none">
            <CardContent>
                <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{label}</p>
                {loading ? (
                    <Skeleton className="mt-2 h-9 w-16 rounded-none" />
                ) : (
                    <p className="mt-1 font-display text-4xl font-black tracking-tight font-stretch-75%">{value}</p>
                )}
            </CardContent>
        </Card>
    );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-3 border border-dashed px-6 py-12 text-center">
            <FolderTreeIcon className="size-8 text-muted-foreground" />
            <div>
                <p className="font-display text-xl font-black tracking-tight uppercase font-stretch-75%">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
            {action}
        </div>
    );
}
