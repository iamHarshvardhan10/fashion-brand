"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react";
import type { CategoryFormValues, SubCategory } from "@/services/operations/categoryAPI";
import { ApiError } from "@/utils/apiError";
import { IMAGE_UPLOAD, PATTERNS } from "@/utils/constants";
import { slugify } from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Editable = Pick<SubCategory, "name" | "slug" | "description" | "isActive" | "sortOrder" | "imageUrl">;

type CategoryFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    kind: "category" | "sub-category";
    parentName?: string; // shown for sub-categories
    initial?: Editable; // edit mode when provided
    onSubmit: (values: CategoryFormValues) => Promise<void>;
};

const SLUG_PATTERN = PATTERNS.slug;
const MAX_IMAGE_MB = IMAGE_UPLOAD.maxMb;
const ACCEPTED_IMAGES = IMAGE_UPLOAD.types;

// Mirrors backend/validations so most mistakes are caught before a round trip
function validate(values: CategoryFormValues) {
    const errors: Record<string, string> = {};
    const name = values.name.trim();
    if (name.length < 2) errors.name = "Name must be at least 2 characters";
    else if (name.length > 60) errors.name = "Name must be at most 60 characters";
    const slug = values.slug.trim();
    if (slug && !SLUG_PATTERN.test(slug)) {
        errors.slug = "Only lowercase letters, numbers and single hyphens";
    } else if (slug.length > 80) errors.slug = "Slug must be at most 80 characters";
    if (values.description.trim().length > 500) errors.description = "Description must be at most 500 characters";
    if (!Number.isInteger(values.sortOrder) || values.sortOrder < 0 || values.sortOrder > 9999) {
        errors.sortOrder = "Whole number between 0 and 9999";
    }
    return errors;
}

export default function CategoryFormDialog({
    open,
    onOpenChange,
    kind,
    parentName,
    initial,
    onSubmit,
}: CategoryFormDialogProps) {
    const isEdit = Boolean(initial);
    const label = kind === "category" ? "category" : "sub-category";

    const [values, setValues] = useState<CategoryFormValues>({
        name: initial?.name ?? "",
        slug: initial?.slug ?? "",
        description: initial?.description ?? "",
        isActive: initial?.isActive ?? true,
        sortOrder: initial?.sortOrder ?? 0,
        image: null,
        removeImage: false,
    });
    // In create mode the slug follows the name until the user edits it
    const [slugTouched, setSlugTouched] = useState(isEdit);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const previewUrl = useMemo(() => (values.image ? URL.createObjectURL(values.image) : null), [values.image]);
    useEffect(() => () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    const shownImage = previewUrl ?? (values.removeImage ? null : (initial?.imageUrl ?? null));

    function set<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
        setValues((v) => ({ ...v, [key]: value }));
        setErrors((e) => {
            if (!e[key]) return e;
            const next = { ...e };
            delete next[key];
            return next;
        });
    }

    function handleName(name: string) {
        set("name", name);
        if (!slugTouched) set("slug", slugify(name));
    }

    function handleFile(file: File | undefined) {
        if (!file) return;
        if (!ACCEPTED_IMAGES.includes(file.type)) {
            setErrors((e) => ({ ...e, image: "Image must be JPG, PNG, WEBP or AVIF" }));
            return;
        }
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
            setErrors((e) => ({ ...e, image: `Image must be ${MAX_IMAGE_MB} MB or smaller` }));
            return;
        }
        set("image", file);
        set("removeImage", false);
    }

    function clearImage() {
        set("image", null);
        if (initial?.imageUrl) set("removeImage", true);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);
        const clientErrors = validate(values);
        if (Object.keys(clientErrors).length) {
            setErrors(clientErrors);
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(values);
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
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none sm:max-w-lg">
                <form onSubmit={handleSubmit} noValidate className="grid gap-5">
                    <DialogHeader>
                        <p className="font-mono text-[10px] tracking-[0.2em] text-brand uppercase">
                            {parentName ? `${parentName} / ` : ""}
                            {isEdit ? "Edit" : "New"} {label}
                        </p>
                        <DialogTitle className="font-display text-3xl font-black tracking-tight uppercase font-stretch-75%">
                            {isEdit ? initial!.name : `Add ${label}`}
                        </DialogTitle>
                        <DialogDescription>
                            {kind === "category"
                                ? "Categories appear in the storefront navigation and on the home page."
                                : "Sub-categories help shoppers narrow down products inside a category."}
                        </DialogDescription>
                    </DialogHeader>

                    <Field label="Name" htmlFor="cat-name" error={errors.name}>
                        <Input
                            id="cat-name"
                            value={values.name}
                            onChange={(e) => handleName(e.target.value)}
                            placeholder={kind === "category" ? "e.g. T-Shirts" : "e.g. Oversized Tees"}
                            aria-invalid={Boolean(errors.name)}
                            autoFocus
                        />
                    </Field>

                    <Field
                        label="Slug"
                        htmlFor="cat-slug"
                        error={errors.slug}
                        hint={
                            isEdit
                                ? "Changing the slug changes the page URL."
                                : "Used in the URL. Generated from the name if left empty."
                        }
                    >
                        <Input
                            id="cat-slug"
                            value={values.slug}
                            onChange={(e) => {
                                setSlugTouched(true);
                                set("slug", e.target.value.toLowerCase());
                            }}
                            placeholder="t-shirts"
                            className="font-mono"
                            aria-invalid={Boolean(errors.slug)}
                        />
                    </Field>

                    <Field label="Description" htmlFor="cat-description" error={errors.description} optional>
                        <Textarea
                            id="cat-description"
                            value={values.description}
                            onChange={(e) => set("description", e.target.value)}
                            rows={3}
                            maxLength={500}
                            aria-invalid={Boolean(errors.description)}
                        />
                    </Field>

                    <Field label="Image" error={errors.image} optional>
                        <div className="flex items-center gap-4">
                            <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden border bg-muted">
                                {shownImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- blob/Cloudinary previews
                                    <img src={shownImage} alt="" className="size-full object-cover" />
                                ) : (
                                    <ImagePlusIcon className="size-6 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="font-mono text-[11px] tracking-wider uppercase"
                                    render={<label htmlFor="cat-image" />}
                                    nativeButton={false}
                                >
                                    {shownImage ? "Replace" : "Upload"}
                                </Button>
                                <input
                                    id="cat-image"
                                    type="file"
                                    accept={ACCEPTED_IMAGES.join(",")}
                                    className="sr-only"
                                    onChange={(e) => {
                                        handleFile(e.target.files?.[0]);
                                        e.target.value = "";
                                    }}
                                />
                                {shownImage && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="font-mono text-[11px] tracking-wider uppercase"
                                        onClick={clearImage}
                                    >
                                        <XIcon />
                                        Remove
                                    </Button>
                                )}
                                <p className="w-full text-xs text-muted-foreground">JPG, PNG, WEBP or AVIF, up to 5 MB</p>
                            </div>
                        </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Sort order" htmlFor="cat-sort" error={errors.sortOrder} hint="Lower shows first">
                            <Input
                                id="cat-sort"
                                type="number"
                                min={0}
                                max={9999}
                                step={1}
                                value={Number.isNaN(values.sortOrder) ? "" : values.sortOrder}
                                onChange={(e) => set("sortOrder", e.target.valueAsNumber)}
                                className="font-mono"
                                aria-invalid={Boolean(errors.sortOrder)}
                            />
                        </Field>
                        <div className="grid content-start gap-2">
                            <Label htmlFor="cat-active">Visible in store</Label>
                            <div className="flex h-8 items-center gap-3">
                                <Switch
                                    id="cat-active"
                                    checked={values.isActive}
                                    onCheckedChange={(checked) => set("isActive", checked)}
                                />
                                <span className="font-mono text-xs text-muted-foreground uppercase">
                                    {values.isActive ? "Active" : "Hidden"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {formError && (
                        <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {formError}
                        </p>
                    )}

                    <DialogFooter className="rounded-none">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                            className="font-mono text-xs tracking-wider uppercase"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="font-mono text-xs tracking-wider uppercase">
                            {submitting && <Loader2Icon className="animate-spin" />}
                            {isEdit ? "Save changes" : `Create ${label}`}
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
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    optional?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={htmlFor}>
                {label}
                {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
            </Label>
            {children}
            {error ? (
                <p className="text-xs text-destructive">{error}</p>
            ) : (
                hint && <p className="text-xs text-muted-foreground">{hint}</p>
            )}
        </div>
    );
}
