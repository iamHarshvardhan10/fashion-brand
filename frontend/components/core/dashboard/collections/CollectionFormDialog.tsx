"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlusIcon, Loader2Icon } from "lucide-react";
import { fetchCollection, type Collection, type CollectionFormValues } from "@/services/operations/collectionAPI";
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
import { collectionTypes, type ManagedCollectionType } from "./collection-types";
import ProductPicker, { type PickedProduct } from "./ProductPicker";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: ManagedCollectionType;
    initial?: Collection;
    onSubmit: (values: CollectionFormValues) => Promise<void>;
};

function toLocalInput(iso: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CollectionFormDialog({ open, onOpenChange, type, initial, onSubmit }: Props) {
    const config = collectionTypes[type];
    const isEdit = Boolean(initial);

    const [values, setValues] = useState({
        name: initial?.name ?? "",
        slug: initial?.slug ?? "",
        description: initial?.description ?? "",
        isActive: initial?.isActive ?? true,
        sortOrder: initial?.sortOrder ?? 0,
        endsAt: toLocalInput(initial?.endsAt ?? null),
        image: null as File | null,
    });
    const [products, setProducts] = useState<PickedProduct[]>([]);
    const [productsLoading, setProductsLoading] = useState(isEdit);
    const [slugTouched, setSlugTouched] = useState(isEdit);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // The list endpoint has counts only, so load this collection's products for editing
    useEffect(() => {
        if (!initial) return;
        let cancelled = false;
        fetchCollection(initial.id)
            .then((c) => {
                if (cancelled) return;
                setProducts(
                    (c.products ?? []).map((p) => ({ id: p.id, name: p.name, price: p.price, status: p.status, imageUrl: p.images[0]?.url ?? null })),
                );
            })
            .catch(() => !cancelled && setFormError("Could not load this collection's products"))
            .finally(() => !cancelled && setProductsLoading(false));
        return () => {
            cancelled = true;
        };
    }, [initial]);

    const preview = useMemo(() => (values.image ? URL.createObjectURL(values.image) : null), [values.image]);
    useEffect(() => () => {
        if (preview) URL.revokeObjectURL(preview);
    }, [preview]);
    const shownImage = preview ?? initial?.imageUrl ?? null;

    function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
        setValues((v) => ({ ...v, [key]: value }));
        setErrors((e) => {
            if (!e[key]) return e;
            const next = { ...e };
            delete next[key];
            return next;
        });
    }

    function validate() {
        const e: Record<string, string> = {};
        const name = values.name.trim();
        if (name.length < 2) e.name = "Name must be at least 2 characters";
        else if (name.length > 60) e.name = "Name must be at most 60 characters";
        if (values.slug.trim() && !PATTERNS.slug.test(values.slug.trim())) e.slug = "Only lowercase letters, numbers and single hyphens";
        if (values.description.trim().length > config.descriptionField.max) e.description = `At most ${config.descriptionField.max} characters`;
        if (!Number.isInteger(values.sortOrder) || values.sortOrder < 0 || values.sortOrder > 9999) e.sortOrder = "Whole number between 0 and 9999";
        if (!shownImage) e.image = "An image is required";
        return e;
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setFormError(null);
        const clientErrors = validate();
        if (Object.keys(clientErrors).length) {
            setErrors(clientErrors);
            return;
        }
        setSubmitting(true);
        try {
            await onSubmit({ ...values, productIds: products.map((p) => p.id) });
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

    function handleFile(file: File | undefined) {
        if (!file) return;
        if (!IMAGE_UPLOAD.types.includes(file.type)) return setErrors((e) => ({ ...e, image: "Image must be JPG, PNG, WEBP or AVIF" }));
        if (file.size > IMAGE_UPLOAD.maxMb * 1024 * 1024) return setErrors((e) => ({ ...e, image: `Image must be ${IMAGE_UPLOAD.maxMb} MB or smaller` }));
        set("image", file);
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none sm:max-w-3xl">
                <form onSubmit={handleSubmit} noValidate className="grid gap-5">
                    <DialogHeader>
                        <p className="font-mono text-[10px] tracking-[0.2em] text-brand uppercase">
                            {config.title} / {isEdit ? "Edit" : "New"}
                        </p>
                        <DialogTitle className="font-display text-3xl font-black tracking-tight uppercase font-stretch-75%">
                            {isEdit ? initial!.name : `Add ${config.noun}`}
                        </DialogTitle>
                        <DialogDescription>{config.description}</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
                        {/* Image + live card preview */}
                        <div className="grid content-start gap-2">
                            <Label>Image</Label>
                            <label
                                htmlFor="collection-image"
                                className={cn(
                                    "group relative isolate flex cursor-pointer flex-col justify-end overflow-hidden border bg-neutral-800 p-3",
                                    config.aspect,
                                    errors.image && "border-destructive",
                                )}
                            >
                                {shownImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- blob/Cloudinary preview
                                    <img src={shownImage} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
                                ) : (
                                    <span className="absolute inset-0 -z-20 flex items-center justify-center text-neutral-400">
                                        <ImagePlusIcon className="size-7" />
                                    </span>
                                )}
                                <span className={cn("absolute inset-0 -z-10", type === "EDIT" ? "bg-linear-to-t from-black/70 via-black/10 to-transparent" : "bg-black/20")} />
                                <span className="font-display text-xl leading-[0.9] font-black text-cream uppercase font-stretch-75%">
                                    {values.name || "Title"}
                                </span>
                                {config.descriptionField.shownOnCard && values.description && (
                                    <span className="mt-1 font-didot text-xs text-cream italic">{values.description}</span>
                                )}
                                {type === "EDIT" && (
                                    <span className="mt-2 w-fit border-b border-cream font-mono text-[8px] tracking-[0.2em] text-cream uppercase">Explore</span>
                                )}
                            </label>
                            <input
                                id="collection-image"
                                type="file"
                                accept={IMAGE_UPLOAD.types.join(",")}
                                className="sr-only"
                                onChange={(e) => {
                                    handleFile(e.target.files?.[0]);
                                    e.target.value = "";
                                }}
                            />
                            {errors.image ? (
                                <p className="text-xs text-destructive">{errors.image}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">Click to {shownImage ? "replace" : "upload"}. {config.imageHint}</p>
                            )}
                        </div>

                        <div className="grid content-start gap-4">
                            <Field label="Name" htmlFor="collection-name" error={errors.name}>
                                <Input
                                    id="collection-name"
                                    value={values.name}
                                    maxLength={60}
                                    autoFocus
                                    placeholder={type === "EDIT" ? "e.g. The Bomber Edit" : "e.g. Date Night"}
                                    aria-invalid={Boolean(errors.name)}
                                    onChange={(e) => {
                                        set("name", e.target.value);
                                        if (!slugTouched) set("slug", slugify(e.target.value));
                                    }}
                                />
                            </Field>
                            <Field label="URL" htmlFor="collection-slug" error={errors.slug} hint={isEdit ? "Changing it breaks old links." : "Generated from the name."}>
                                <div className="flex items-center rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                                    <span className="pl-2.5 font-mono text-xs text-muted-foreground">{config.urlPrefix}</span>
                                    <input
                                        id="collection-slug"
                                        value={values.slug}
                                        onChange={(e) => {
                                            setSlugTouched(true);
                                            set("slug", e.target.value.toLowerCase());
                                        }}
                                        className="h-8 min-w-0 flex-1 bg-transparent pr-2.5 font-mono text-sm outline-none"
                                    />
                                </div>
                            </Field>
                            <Field label={config.descriptionField.label} htmlFor="collection-desc" error={errors.description} hint={config.descriptionField.hint} optional>
                                {config.descriptionField.max <= 80 ? (
                                    <Input
                                        id="collection-desc"
                                        value={values.description}
                                        maxLength={config.descriptionField.max}
                                        placeholder={config.descriptionField.placeholder}
                                        onChange={(e) => set("description", e.target.value)}
                                    />
                                ) : (
                                    <Textarea
                                        id="collection-desc"
                                        rows={2}
                                        value={values.description}
                                        maxLength={config.descriptionField.max}
                                        placeholder={config.descriptionField.placeholder}
                                        onChange={(e) => set("description", e.target.value)}
                                    />
                                )}
                            </Field>
                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Order" htmlFor="collection-sort" error={errors.sortOrder} hint="Lower first">
                                    <Input
                                        id="collection-sort"
                                        type="number"
                                        min={0}
                                        value={Number.isNaN(values.sortOrder) ? "" : values.sortOrder}
                                        onChange={(e) => set("sortOrder", e.target.valueAsNumber)}
                                        className="font-mono"
                                    />
                                </Field>
                                <Field label="Show until" htmlFor="collection-ends" error={errors.endsAt} hint="Empty = always" optional className="col-span-2">
                                    <Input id="collection-ends" type="datetime-local" value={values.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
                                </Field>
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch id="collection-active" checked={values.isActive} onCheckedChange={(v) => set("isActive", v)} />
                                <Label htmlFor="collection-active">{values.isActive ? "Visible on the home page" : "Hidden"}</Label>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2 border-t pt-4">
                        <Label>Products</Label>
                        <p className="-mt-1 text-xs text-muted-foreground">
                            What shoppers see when they open this {config.noun}, in this order. Draft or archived products are kept but not shown.
                        </p>
                        {errors.productIds && <p className="text-xs text-destructive">{errors.productIds}</p>}
                        {productsLoading ? (
                            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                                <Loader2Icon className="size-4 animate-spin" />
                                Loading products…
                            </div>
                        ) : (
                            <ProductPicker value={products} onChange={setProducts} />
                        )}
                    </div>

                    {formError && (
                        <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {formError}
                        </p>
                    )}

                    <DialogFooter className="rounded-none">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="font-mono text-xs tracking-wider uppercase">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || productsLoading} className="font-mono text-xs tracking-wider uppercase">
                            {submitting && <Loader2Icon className="animate-spin" />}
                            {isEdit ? "Save changes" : `Create ${config.noun}`}
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
