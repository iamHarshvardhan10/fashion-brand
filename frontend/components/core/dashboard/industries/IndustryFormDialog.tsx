"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, ImagePlusIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { fetchCategories, type Category } from "@/services/operations/categoryAPI";
import type { Industry, IndustryFormValues } from "@/services/operations/industryAPI";
import { ApiError } from "@/utils/apiError";
import { IMAGE_UPLOAD, PATTERNS } from "@/utils/constants";
import { slugify } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initial?: Industry;
    onSubmit: (values: IndustryFormValues) => Promise<void>;
};

export default function IndustryFormDialog({ open, onOpenChange, initial, onSubmit }: Props) {
    const isEdit = Boolean(initial);
    const [values, setValues] = useState<Omit<IndustryFormValues, "categoryIds">>({
        name: initial?.name ?? "",
        slug: initial?.slug ?? "",
        description: initial?.description ?? "",
        isActive: initial?.isActive ?? true,
        showInNav: initial?.showInNav ?? true,
        sortOrder: initial?.sortOrder ?? 0,
        image: null,
        removeImage: false,
    });
    const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categories.map((c) => c.id) ?? []);
    const [allCategories, setAllCategories] = useState<Category[] | null>(null);
    const [slugTouched, setSlugTouched] = useState(isEdit);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories({ includeInactive: true, withSubCategories: true })
            .then(setAllCategories)
            .catch(() => setFormError("Could not load categories"));
    }, []);

    const preview = useMemo(() => (values.image ? URL.createObjectURL(values.image) : null), [values.image]);
    useEffect(() => () => {
        if (preview) URL.revokeObjectURL(preview);
    }, [preview]);
    const shownImage = preview ?? (values.removeImage ? null : (initial?.imageUrl ?? null));

    const byId = new Map((allCategories ?? []).map((c) => [c.id, c]));
    const selected = categoryIds.map((id) => byId.get(id)).filter((c): c is Category => Boolean(c));
    const available = (allCategories ?? []).filter((c) => !categoryIds.includes(c.id));

    function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
        setValues((v) => ({ ...v, [key]: value }));
        setErrors((e) => {
            if (!e[key]) return e;
            const next = { ...e };
            delete next[key];
            return next;
        });
    }

    const move = (i: number, delta: number) => {
        const next = [...categoryIds];
        [next[i], next[i + delta]] = [next[i + delta], next[i]];
        setCategoryIds(next);
    };

    function handleFile(file: File | undefined) {
        if (!file) return;
        if (!IMAGE_UPLOAD.types.includes(file.type)) return setErrors((e) => ({ ...e, image: "Image must be JPG, PNG, WEBP or AVIF" }));
        if (file.size > IMAGE_UPLOAD.maxMb * 1024 * 1024) return setErrors((e) => ({ ...e, image: `Image must be ${IMAGE_UPLOAD.maxMb} MB or smaller` }));
        set("image", file);
        set("removeImage", false);
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setFormError(null);
        const e: Record<string, string> = {};
        const name = values.name.trim();
        if (name.length < 2) e.name = "Name must be at least 2 characters";
        else if (name.length > 40) e.name = "Name must be at most 40 characters";
        if (values.slug.trim() && !PATTERNS.slug.test(values.slug.trim())) e.slug = "Only lowercase letters, numbers and single hyphens";
        if (!Number.isInteger(values.sortOrder) || values.sortOrder < 0 || values.sortOrder > 9999) e.sortOrder = "Whole number between 0 and 9999";
        if (Object.keys(e).length) return setErrors(e);

        setSubmitting(true);
        try {
            await onSubmit({ ...values, categoryIds });
            onOpenChange(false);
        } catch (error) {
            if (error instanceof ApiError) {
                setErrors(error.fieldErrors());
                setFormError(error.message === "Validation failed" ? "Please fix the highlighted fields" : error.message);
            } else {
                setFormError("Something went wrong, please try again");
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none sm:max-w-3xl">
                <form onSubmit={handleSubmit} noValidate className="grid gap-5">
                    <DialogHeader>
                        <p className="font-mono text-[10px] tracking-[0.2em] text-brand uppercase">Industries / {isEdit ? "Edit" : "New"}</p>
                        <DialogTitle className="font-display text-3xl font-black tracking-tight uppercase font-stretch-75%">
                            {isEdit ? initial!.name : "Add industry"}
                        </DialogTitle>
                        <DialogDescription>A top-level menu in the navbar, e.g. Men, Women, Kids or Accessories.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Name" htmlFor="ind-name" error={errors.name}>
                            <Input
                                id="ind-name"
                                value={values.name}
                                maxLength={40}
                                autoFocus
                                placeholder="e.g. Women"
                                aria-invalid={Boolean(errors.name)}
                                onChange={(e) => {
                                    set("name", e.target.value);
                                    if (!slugTouched) set("slug", slugify(e.target.value));
                                }}
                            />
                        </Field>
                        <Field label="URL" htmlFor="ind-slug" error={errors.slug} hint={isEdit ? "Changing it breaks old links." : "Generated from the name."}>
                            <div className="flex items-center rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                                <span className="pl-2.5 font-mono text-xs text-muted-foreground">/</span>
                                <input
                                    id="ind-slug"
                                    value={values.slug}
                                    onChange={(e) => {
                                        setSlugTouched(true);
                                        set("slug", e.target.value.toLowerCase());
                                    }}
                                    className="h-8 min-w-0 flex-1 bg-transparent pr-2.5 font-mono text-sm outline-none"
                                />
                            </div>
                        </Field>
                    </div>

                    <Field label="Description" htmlFor="ind-desc" error={errors.description} hint="Shown at the top of the industry page" optional>
                        <Textarea id="ind-desc" rows={2} maxLength={500} value={values.description} onChange={(e) => set("description", e.target.value)} />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                        <Field label="Menu image" error={errors.image} optional>
                            <div className="flex items-end gap-2">
                                <label
                                    htmlFor="ind-image"
                                    className={cn(
                                        "flex aspect-[3/4] w-24 cursor-pointer items-center justify-center overflow-hidden border bg-muted hover:border-foreground/40",
                                        errors.image && "border-destructive",
                                    )}
                                >
                                    {shownImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element -- blob/Cloudinary preview
                                        <img src={shownImage} alt="" className="size-full object-cover" />
                                    ) : (
                                        <ImagePlusIcon className="size-5 text-muted-foreground" />
                                    )}
                                </label>
                                {shownImage && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            set("image", null);
                                            if (initial?.imageUrl) set("removeImage", true);
                                        }}
                                        className="font-mono text-[11px] uppercase"
                                    >
                                        <XIcon />
                                        Remove
                                    </Button>
                                )}
                            </div>
                            <input
                                id="ind-image"
                                type="file"
                                accept={IMAGE_UPLOAD.types.join(",")}
                                className="sr-only"
                                onChange={(e) => {
                                    handleFile(e.target.files?.[0]);
                                    e.target.value = "";
                                }}
                            />
                        </Field>
                        <div className="grid content-start gap-3">
                            <ToggleRow id="ind-nav" label="Show in navbar" hint="Off = page still works, but it's not in the menu" checked={values.showInNav} onChange={(v) => set("showInNav", v)} />
                            <ToggleRow id="ind-active" label="Active" hint="Off hides the industry and its page everywhere" checked={values.isActive} onChange={(v) => set("isActive", v)} />
                            <Field label="Menu order" htmlFor="ind-sort" error={errors.sortOrder} hint="Lower shows further left" className="max-w-40">
                                <Input
                                    id="ind-sort"
                                    type="number"
                                    min={0}
                                    value={Number.isNaN(values.sortOrder) ? "" : values.sortOrder}
                                    onChange={(e) => set("sortOrder", e.target.valueAsNumber)}
                                    className="font-mono"
                                />
                            </Field>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="grid gap-2 border-t pt-4">
                        <Label>Categories in this menu</Label>
                        <p className="-mt-1 text-xs text-muted-foreground">
                            Pick the categories to list under {values.name.trim() || "this industry"}, in menu order. Their sub-categories appear underneath
                            automatically. Categories are shared, so T-Shirts can be under both Men and Women.
                        </p>
                        {errors.categoryIds && <p className="text-xs text-destructive">{errors.categoryIds}</p>}
                        {!allCategories ? (
                            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                                <Loader2Icon className="size-4 animate-spin" />
                                Loading categories…
                            </div>
                        ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="grid content-start gap-1">
                                    <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">In the menu · {selected.length}</p>
                                    {selected.length ? (
                                        <ol className="grid gap-1 border p-1">
                                            {selected.map((c, i) => (
                                                <li key={c.id} className="flex items-center gap-2 bg-card px-2 py-1.5">
                                                    <span className="w-4 text-right font-mono text-[10px] text-muted-foreground">{i + 1}</span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm">
                                                            {c.name}
                                                            {!c.isActive && <span className="ml-1 text-xs text-amber-700">(hidden)</span>}
                                                        </span>
                                                        {Boolean(c.subCategories?.length) && (
                                                            <span className="block truncate text-[11px] text-muted-foreground">{c.subCategories!.map((s) => s.name).join(" · ")}</span>
                                                        )}
                                                    </span>
                                                    <Button type="button" variant="ghost" size="icon-xs" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                                                        <ArrowUpIcon />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon-xs" aria-label="Move down" disabled={i === selected.length - 1} onClick={() => move(i, 1)}>
                                                        <ArrowDownIcon />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        aria-label={`Remove ${c.name}`}
                                                        onClick={() => setCategoryIds((ids) => ids.filter((x) => x !== c.id))}
                                                        className="hover:text-destructive"
                                                    >
                                                        <XIcon />
                                                    </Button>
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <p className="border border-dashed px-3 py-5 text-center text-sm text-muted-foreground">
                                            No categories. The navbar shows a plain link instead of a dropdown.
                                        </p>
                                    )}
                                </div>
                                <div className="grid content-start gap-1">
                                    <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Available</p>
                                    {available.length ? (
                                        <ul className="grid gap-1">
                                            {available.map((c) => (
                                                <li key={c.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCategoryIds((ids) => [...ids, c.id])}
                                                        className="flex w-full items-center gap-2 border border-transparent px-2 py-1.5 text-left text-sm hover:border-border hover:bg-muted/50"
                                                    >
                                                        <PlusIcon className="size-3.5" />
                                                        {c.name}
                                                        {!c.isActive && <span className="text-xs text-amber-700">(hidden)</span>}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="px-2 py-5 text-sm text-muted-foreground">
                                            {allCategories.length ? "All categories added." : "No categories yet. Create them in Categories first."}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navbar preview */}
                    {selected.length > 0 && (
                        <div className="grid gap-2 border bg-muted/30 p-3">
                            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Navbar preview</p>
                            <div className="flex gap-6 bg-background p-4 shadow-sm">
                                <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                                    {selected.map((c) => (
                                        <div key={c.id} className="grid content-start gap-1">
                                            <p className="font-mono text-[10px] font-semibold tracking-[0.2em] uppercase">{c.name}</p>
                                            {c.subCategories?.filter((s) => s.isActive).map((s) => (
                                                <p key={s.id} className="text-xs text-muted-foreground">{s.name}</p>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                {shownImage && (
                                    // eslint-disable-next-line @next/next/no-img-element -- blob/Cloudinary preview
                                    <img src={shownImage} alt="" className="aspect-[3/4] w-20 shrink-0 object-cover" />
                                )}
                            </div>
                        </div>
                    )}

                    {formError && (
                        <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {formError}
                        </p>
                    )}

                    <DialogFooter className="rounded-none">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="font-mono text-xs tracking-wider uppercase">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="font-mono text-xs tracking-wider uppercase">
                            {submitting && <Loader2Icon className="animate-spin" />}
                            {isEdit ? "Save changes" : "Create industry"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label,
    htmlFor,
    error,
    hint,
    optional,
    className,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    optional?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("grid content-start gap-2", className)}>
            <Label htmlFor={htmlFor}>
                {label}
                {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
            </Label>
            {children}
            {error ? <p className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

function ToggleRow({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-start justify-between gap-3 border p-2.5">
            <div className="grid gap-0.5">
                <Label htmlFor={id}>{label}</Label>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onChange} />
        </div>
    );
}
