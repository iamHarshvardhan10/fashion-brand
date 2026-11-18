"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlusIcon, Loader2Icon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import type { Banner, BannerFormValues, BannerItemFormValues } from "@/services/operations/bannerAPI";
import { bannerSlots, type SlotConfig, type SlotPlacement } from "@/lib/banner-slots";
import { ApiError } from "@/utils/apiError";
import { IMAGE_UPLOAD } from "@/utils/constants";
import { cn } from "@/lib/utils";
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

type BannerFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    placement: SlotPlacement;
    initial?: Banner; // edit mode when provided
    onSubmit: (values: BannerFormValues) => Promise<void>;
};

type TextKey = keyof SlotConfig["fields"];

const MAX_IMAGE_MB = IMAGE_UPLOAD.maxMb;
const ACCEPTED_IMAGES = IMAGE_UPLOAD.types;
const LINK_PATTERN = /^(\/(?!\/)|https?:\/\/)/i;
const HEX_PATTERN = /^#[0-9a-f]{6}$/i;
const TEXT_LIMITS: Record<TextKey, number> = { title: 80, subtitle: 60, highlight: 30, ctaLabel: 30, linkUrl: 300 };

// ISO instant -> value for <input type="datetime-local"> in the browser's timezone
function toLocalInput(iso: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function imageError(file: File) {
    if (!ACCEPTED_IMAGES.includes(file.type)) return "Image must be JPG, PNG, WEBP or AVIF";
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Image must be ${MAX_IMAGE_MB} MB or smaller`;
    return null;
}

const emptyCard = (): BannerItemFormValues => ({ label: "", value: "", linkUrl: "", image: null, imageUrl: null, removeImage: false });

// Mirrors backend/validations/banner.validation.js, limited to the fields this slot uses
function validate(values: BannerFormValues, slot: SlotConfig, hasImage: boolean) {
    const errors: Record<string, string> = {};
    const title = values.title.trim();
    if (title.length < 2) errors.title = "Headline must be at least 2 characters";
    else if (title.length > 80) errors.title = "Headline must be at most 80 characters";
    else if (title.split(/\n+/).length > 4) errors.title = "Headline can have at most 4 lines";
    for (const key of ["subtitle", "highlight", "ctaLabel"] as const) {
        if (slot.fields[key] && values[key].trim().length > TEXT_LIMITS[key]) {
            errors[key] = `${slot.fields[key]!.label} must be at most ${TEXT_LIMITS[key]} characters`;
        }
    }
    const link = values.linkUrl.trim();
    if (link && !LINK_PATTERN.test(link)) errors.linkUrl = "Link must start with / or http(s)://";
    else if (values.ctaLabel.trim() && !link) errors.linkUrl = "Add a link for the button";
    if (slot.backgroundColor && values.backgroundColor && !HEX_PATTERN.test(values.backgroundColor)) {
        errors.backgroundColor = "Use a hex colour like #e8e9eb";
    }
    if (slot.items) {
        values.items.forEach((card, i) => {
            if (!card.label.trim()) errors[`items.${i}.label`] = "Required";
            if (!card.value.trim()) errors[`items.${i}.value`] = "Required";
            if (!LINK_PATTERN.test(card.linkUrl.trim())) errors[`items.${i}.linkUrl`] = "Start with / or http(s)://";
        });
    }
    if (!Number.isInteger(values.sortOrder) || values.sortOrder < 0 || values.sortOrder > 9999) {
        errors.sortOrder = "Whole number between 0 and 9999";
    }
    if (values.startsAt && values.endsAt && new Date(values.endsAt) <= new Date(values.startsAt)) {
        errors.endsAt = "End must be after the start";
    }
    if (!hasImage) errors.image = "An image is required";
    return errors;
}

export default function BannerFormDialog({ open, onOpenChange, placement, initial, onSubmit }: BannerFormDialogProps) {
    const isEdit = Boolean(initial);
    const slot = bannerSlots[placement];

    const [values, setValues] = useState<BannerFormValues>({
        title: initial?.title ?? "",
        subtitle: initial?.subtitle ?? "",
        highlight: initial?.highlight ?? "",
        ctaLabel: initial?.ctaLabel ?? "",
        linkUrl: initial?.linkUrl ?? "",
        backgroundColor: initial?.backgroundColor ?? slot.backgroundColor?.default ?? "",
        items: (initial?.items ?? []).map((item) => ({
            id: item.id,
            label: item.label,
            value: item.value,
            linkUrl: item.linkUrl,
            image: null,
            imageUrl: item.imageUrl,
            removeImage: false,
        })),
        isActive: initial?.isActive ?? true,
        sortOrder: initial?.sortOrder ?? 0,
        startsAt: toLocalInput(initial?.startsAt ?? null),
        endsAt: toLocalInput(initial?.endsAt ?? null),
        image: null,
        mobileImage: null,
        removeMobileImage: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const imagePreview = useObjectUrl(values.image);
    const mobilePreview = useObjectUrl(values.mobileImage);
    const shownImage = imagePreview ?? initial?.imageUrl ?? null;
    const shownMobile = mobilePreview ?? (values.removeMobileImage ? null : (initial?.mobileImageUrl ?? null));

    function clearError(...keys: string[]) {
        setErrors((e) => {
            if (!keys.some((k) => e[k])) return e;
            const next = { ...e };
            for (const k of keys) delete next[k];
            return next;
        });
    }

    function set<K extends keyof BannerFormValues>(key: K, value: BannerFormValues[K]) {
        setValues((v) => ({ ...v, [key]: value }));
        clearError(key);
    }

    function setCard(index: number, patch: Partial<BannerItemFormValues>) {
        setValues((v) => ({ ...v, items: v.items.map((card, i) => (i === index ? { ...card, ...patch } : card)) }));
        clearError(...Object.keys(patch).map((k) => `items.${index}.${k}`));
    }

    function removeCard(index: number) {
        setValues((v) => ({ ...v, items: v.items.filter((_, i) => i !== index) }));
        // Card errors are keyed by position, so they no longer line up
        setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith("items."))));
    }

    function handleFile(key: "image" | "mobileImage", file: File | undefined) {
        if (!file) return;
        const error = imageError(file);
        if (error) return setErrors((e) => ({ ...e, [key]: error }));
        set(key, file);
        if (key === "mobileImage") set("removeMobileImage", false);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);
        const clientErrors = validate(values, slot, Boolean(shownImage));
        if (Object.keys(clientErrors).length) {
            setErrors(clientErrors);
            setFormError("Please fix the highlighted fields");
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

    function textField(key: TextKey) {
        const field = slot.fields[key];
        if (!field) return null;
        const id = `banner-${key}`;
        const common = {
            id,
            value: values[key],
            placeholder: field.placeholder,
            "aria-invalid": Boolean(errors[key]),
        };
        const optional = key !== "title" && !(key === "linkUrl" && values.ctaLabel.trim());
        return (
            <Field key={key} label={field.label} htmlFor={id} error={errors[key]} hint={field.hint} optional={optional}>
                {field.multiline ? (
                    <Textarea {...common} rows={3} maxLength={TEXT_LIMITS[key]} onChange={(e) => set(key, e.target.value)} />
                ) : (
                    <Input
                        {...common}
                        maxLength={TEXT_LIMITS[key]}
                        className={cn(key === "linkUrl" && "font-mono")}
                        onChange={(e) => set(key, e.target.value)}
                    />
                )}
            </Field>
        );
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-none sm:max-w-2xl">
                <form onSubmit={handleSubmit} noValidate className="grid gap-5">
                    <DialogHeader>
                        <p className="font-mono text-[10px] tracking-[0.2em] text-brand uppercase">
                            {slot.title} / {isEdit ? "Edit" : "New"}
                        </p>
                        <DialogTitle className="font-display text-3xl font-black tracking-tight uppercase font-stretch-75%">
                            {isEdit ? initial!.title.replace(/\n/g, " ") : `Add ${slot.tab.toLowerCase()} banner`}
                        </DialogTitle>
                        <DialogDescription>{slot.description}</DialogDescription>
                    </DialogHeader>

                    <SlotPreview placement={placement} values={values} image={shownImage} />

                    <div className={cn("grid gap-4", slot.mobileImage && "sm:grid-cols-2")}>
                        <ImageField
                            id="banner-image"
                            label={slot.image.label}
                            hint={slot.image.hint}
                            src={shownImage}
                            error={errors.image}
                            onFile={(f) => handleFile("image", f)}
                        />
                        {slot.mobileImage && (
                            <ImageField
                                id="banner-mobile-image"
                                label="Mobile image"
                                hint="Portrait. Falls back to the desktop image"
                                optional
                                src={shownMobile}
                                error={errors.mobileImage}
                                onFile={(f) => handleFile("mobileImage", f)}
                                onClear={() => {
                                    set("mobileImage", null);
                                    if (initial?.mobileImageUrl) set("removeMobileImage", true);
                                }}
                            />
                        )}
                    </div>

                    {slot.backgroundColor && (
                        <Field label="Background colour" htmlFor="banner-bg" error={errors.backgroundColor} hint={slot.backgroundColor.hint}>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    aria-label="Pick background colour"
                                    value={HEX_PATTERN.test(values.backgroundColor) ? values.backgroundColor : slot.backgroundColor.default}
                                    onChange={(e) => set("backgroundColor", e.target.value)}
                                    className="h-8 w-12 cursor-pointer border bg-transparent p-0.5"
                                />
                                <Input
                                    id="banner-bg"
                                    value={values.backgroundColor}
                                    onChange={(e) => set("backgroundColor", e.target.value.trim())}
                                    placeholder={slot.backgroundColor.default}
                                    className="max-w-32 font-mono"
                                    aria-invalid={Boolean(errors.backgroundColor)}
                                />
                            </div>
                        </Field>
                    )}

                    {(["subtitle", "title"] as const).map(textField)}

                    {(slot.fields.highlight || slot.fields.ctaLabel || slot.fields.linkUrl) && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {(["highlight", "ctaLabel", "linkUrl"] as const).map(textField)}
                        </div>
                    )}

                    {slot.items && (
                        <CardsEditor
                            cards={values.items}
                            max={slot.items.max}
                            errors={errors}
                            onAdd={() => set("items", [...values.items, emptyCard()])}
                            onChange={setCard}
                            onRemove={removeCard}
                            onImageError={(i, message) => setErrors((e) => ({ ...e, [`items.${i}.image`]: message }))}
                        />
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Show from" htmlFor="banner-starts" error={errors.startsAt} hint="Empty = right away" optional>
                            <Input
                                id="banner-starts"
                                type="datetime-local"
                                value={values.startsAt}
                                onChange={(e) => set("startsAt", e.target.value)}
                                aria-invalid={Boolean(errors.startsAt)}
                            />
                        </Field>
                        <Field label="Show until" htmlFor="banner-ends" error={errors.endsAt} hint="Empty = no end date" optional>
                            <Input
                                id="banner-ends"
                                type="datetime-local"
                                value={values.endsAt}
                                onChange={(e) => set("endsAt", e.target.value)}
                                aria-invalid={Boolean(errors.endsAt)}
                            />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field
                            label={slot.carousel ? "Slide order" : "Priority"}
                            htmlFor="banner-sort"
                            error={errors.sortOrder}
                            hint={slot.carousel ? "Lower shows first" : "Lowest live one is shown"}
                        >
                            <Input
                                id="banner-sort"
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
                            <Label htmlFor="banner-active">Visible in store</Label>
                            <div className="flex h-8 items-center gap-3">
                                <Switch
                                    id="banner-active"
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
                            {isEdit ? "Save changes" : "Create banner"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function useObjectUrl(file: File | null) {
    const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
    useEffect(() => () => {
        if (url) URL.revokeObjectURL(url);
    }, [url]);
    return url;
}

// ---------- Price cards ----------

function CardsEditor({
    cards,
    max,
    errors,
    onAdd,
    onChange,
    onRemove,
    onImageError,
}: {
    cards: BannerItemFormValues[];
    max: number;
    errors: Record<string, string>;
    onAdd: () => void;
    onChange: (index: number, patch: Partial<BannerItemFormValues>) => void;
    onRemove: (index: number) => void;
    onImageError: (index: number, message: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between">
                <Label>
                    Price cards <span className="font-normal text-muted-foreground">({cards.length}/{max})</span>
                </Label>
                {cards.length < max && (
                    <Button type="button" variant="ghost" size="sm" onClick={onAdd} className="font-mono text-[11px] tracking-wider uppercase">
                        <PlusIcon />
                        Add card
                    </Button>
                )}
            </div>
            {errors.items && <p className="text-xs text-destructive">{errors.items}</p>}
            {cards.length ? (
                <ul className="grid gap-2">
                    {cards.map((card, i) => (
                        <CardRow
                            key={card.id ?? `new-${i}`}
                            index={i}
                            card={card}
                            errors={errors}
                            onChange={(patch) => onChange(i, patch)}
                            onRemove={() => onRemove(i)}
                            onImageError={(message) => onImageError(i, message)}
                        />
                    ))}
                </ul>
            ) : (
                <p className="border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                    No cards. Add up to {max}, e.g. “Tees from ₹699” linking to /tshirts.
                </p>
            )}
        </div>
    );
}

function CardRow({
    index,
    card,
    errors,
    onChange,
    onRemove,
    onImageError,
}: {
    index: number;
    card: BannerItemFormValues;
    errors: Record<string, string>;
    onChange: (patch: Partial<BannerItemFormValues>) => void;
    onRemove: () => void;
    onImageError: (message: string) => void;
}) {
    const preview = useObjectUrl(card.image);
    const src = preview ?? (card.removeImage ? null : card.imageUrl);
    const err = (key: string) => errors[`items.${index}.${key}`];
    const inputId = `card-image-${index}`;

    return (
        <li className="flex gap-3 border bg-card p-2">
            <div className="grid shrink-0 justify-items-center gap-1">
                <label
                    htmlFor={inputId}
                    className={cn(
                        "flex size-16 cursor-pointer items-center justify-center overflow-hidden border bg-muted hover:border-foreground/40",
                        err("image") && "border-destructive"
                    )}
                    title="Upload card image"
                >
                    {src ? (
                        // eslint-disable-next-line @next/next/no-img-element -- blob/Cloudinary preview
                        <img src={src} alt="" className="size-full object-cover" />
                    ) : (
                        <ImagePlusIcon className="size-4 text-muted-foreground" />
                    )}
                </label>
                <input
                    id={inputId}
                    type="file"
                    accept={ACCEPTED_IMAGES.join(",")}
                    className="sr-only"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        const error = imageError(file);
                        if (error) return onImageError(error);
                        onChange({ image: file, removeImage: false });
                    }}
                />
                {src && (
                    <button
                        type="button"
                        onClick={() => onChange({ image: null, removeImage: Boolean(card.imageUrl) })}
                        className="font-mono text-[10px] text-muted-foreground uppercase hover:text-destructive"
                    >
                        Remove
                    </button>
                )}
            </div>
            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
                <CardInput label="Label" placeholder="Tees from" value={card.label} max={30} error={err("label")} onChange={(v) => onChange({ label: v })} />
                <CardInput label="Value" placeholder="₹699" value={card.value} max={20} error={err("value")} onChange={(v) => onChange({ value: v })} />
                <CardInput label="Link" placeholder="/tshirts" value={card.linkUrl} max={300} mono error={err("linkUrl")} onChange={(v) => onChange({ linkUrl: v })} />
                {err("image") && <p className="text-xs text-destructive sm:col-span-3">{err("image")}</p>}
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onRemove}
                aria-label={`Remove card ${index + 1}`}
                className="text-muted-foreground hover:text-destructive"
            >
                <Trash2Icon />
            </Button>
        </li>
    );
}

function CardInput({
    label,
    placeholder,
    value,
    max,
    mono,
    error,
    onChange,
}: {
    label: string;
    placeholder: string;
    value: string;
    max: number;
    mono?: boolean;
    error?: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="grid gap-1">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{label}</span>
            <Input
                value={value}
                placeholder={placeholder}
                maxLength={max}
                onChange={(e) => onChange(e.target.value)}
                className={cn("h-8", mono && "font-mono")}
                aria-invalid={Boolean(error)}
            />
            {error && <span className="text-xs text-destructive">{error}</span>}
        </label>
    );
}

// ---------- Preview ----------

const lines = (text: string, fallback: string) => {
    const parts = text.trim().split(/\n+/).filter(Boolean);
    return parts.length ? parts : [fallback];
};

// Rough, scaled-down version of each storefront layout so editors see what they're making
function SlotPreview({ placement, values, image }: { placement: SlotPlacement; values: BannerFormValues; image: string | null }) {
    const bg = HEX_PATTERN.test(values.backgroundColor) ? values.backgroundColor : undefined;
    const display = "font-display leading-[0.85] tracking-tight uppercase font-stretch-75%";
    const img = (className: string) =>
        image ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob/Cloudinary preview
            <img src={image} alt="" className={className} />
        ) : null;

    if (placement === "BESTSELLERS") {
        return (
            <div style={{ backgroundColor: bg }} className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 overflow-hidden bg-neutral-200 px-3 pt-4">
                <p className={cn(display, "self-center text-right text-2xl font-medium text-neutral-950")}>
                    {lines(values.title, "Headline").map((l, i) => <span key={i} className="block">{l}</span>)}
                </p>
                {img("h-36 w-auto mask-x-from-75% mask-t-from-65%") ?? <div className="h-36 w-24 bg-neutral-300" />}
                <p className={cn(display, "self-center text-2xl font-bold text-neutral-950")}>
                    {values.subtitle} <span className="text-brand">{values.highlight || "Offer"}</span>
                    {values.ctaLabel && (
                        <span className="mt-2 block font-mono text-[8px] font-normal tracking-[0.2em] text-neutral-700">{values.ctaLabel}</span>
                    )}
                </p>
            </div>
        );
    }

    if (placement === "SHOP_IT") {
        const [lead, ...rest] = lines(values.title, "Headline");
        return (
            <div className="relative aspect-[3/1] overflow-hidden bg-neutral-900">
                {img("absolute inset-0 size-full object-cover")}
                <div className="absolute inset-0 bg-linear-to-r from-black/40 via-transparent to-black/40" />
                <p className={cn(display, "absolute top-1/2 left-[4%] -translate-y-1/2 -rotate-6 font-black text-cream")}>
                    <span className={cn("block", rest.length ? "text-sm" : "text-3xl")}>{lead}</span>
                    {rest.map((l, i) => <span key={i} className="block text-3xl">{l}</span>)}
                </p>
                <p className={cn(display, "absolute top-1/2 right-[4%] -translate-y-1/2 text-right font-black text-cream")}>
                    {values.subtitle && <span className="mb-1 inline-block bg-brand px-1.5 py-0.5 text-[10px]">{values.subtitle}</span>}
                    <span className="block text-3xl">{values.highlight || "Price"}</span>
                </p>
            </div>
        );
    }

    if (placement === "PRICE_DROP") {
        return (
            <div style={{ backgroundColor: bg }} className="relative h-56 overflow-hidden bg-neutral-200">
                {img("absolute bottom-0 left-[18%] h-full w-auto mask-x-from-70%") ?? <div className="absolute bottom-0 left-[18%] h-full w-28 bg-neutral-300" />}
                <p className={cn(display, "absolute top-4 right-5 text-right text-4xl font-medium text-neutral-950")}>
                    {lines(values.title, "Headline").map((l, i) => <span key={i} className="block">{l}</span>)}
                </p>
                {values.items.length > 0 && (
                    <div className="absolute inset-x-4 bottom-3 grid grid-cols-4 gap-1.5">
                        {values.items.map((card, i) => (
                            <div key={i} className="min-w-0 bg-white p-1.5 shadow-sm">
                                <p className="truncate font-mono text-[7px] tracking-wider text-neutral-500 uppercase">{card.label || "Label"}</p>
                                <p className="truncate font-display text-sm font-black font-stretch-75%">{card.value || "Value"}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // HERO
    const words = values.title.trim().split(/\s+/).filter(Boolean);
    return (
        <div className="relative isolate flex aspect-[16/7] flex-col justify-end overflow-hidden bg-neutral-900 p-4">
            {img("absolute inset-0 -z-20 size-full object-cover")}
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
            {values.subtitle.trim() && (
                <p className="mb-1 font-mono text-[10px] tracking-[0.15em] text-cream uppercase">{values.subtitle}</p>
            )}
            <p className={cn(display, "grid w-fit grid-cols-[auto_auto] gap-x-[0.35em] text-3xl font-black text-cream")}>
                {words.length ? words.map((w, i) => <span key={i}>{w}</span>) : <span className="opacity-40">Headline</span>}
            </p>
            {values.ctaLabel.trim() && (
                <span className="mt-2 w-fit bg-cream px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-neutral-950 uppercase">
                    {values.ctaLabel}
                </span>
            )}
        </div>
    );
}

// ---------- Shared fields ----------

function ImageField({
    id,
    label,
    hint,
    src,
    error,
    optional,
    onFile,
    onClear,
}: {
    id: string;
    label: string;
    hint: string;
    src: string | null;
    error?: string;
    optional?: boolean;
    onFile: (file: File | undefined) => void;
    onClear?: () => void;
}) {
    return (
        <Field label={label} error={error} hint={hint} optional={optional}>
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden border bg-muted",
                        error && "border-destructive"
                    )}
                >
                    {src ? (
                        // eslint-disable-next-line @next/next/no-img-element -- blob/Cloudinary preview
                        <img src={src} alt="" className="size-full object-cover" />
                    ) : (
                        <ImagePlusIcon className="size-5 text-muted-foreground" />
                    )}
                </div>
                <div className="flex flex-wrap gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="font-mono text-[11px] tracking-wider uppercase"
                        render={<label htmlFor={id} />}
                        nativeButton={false}
                    >
                        {src ? "Replace" : "Upload"}
                    </Button>
                    <input
                        id={id}
                        type="file"
                        accept={ACCEPTED_IMAGES.join(",")}
                        className="sr-only"
                        onChange={(e) => {
                            onFile(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                    />
                    {src && onClear && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="font-mono text-[11px] tracking-wider uppercase"
                            onClick={onClear}
                        >
                            <XIcon />
                            Remove
                        </Button>
                    )}
                </div>
            </div>
        </Field>
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
        <div className="grid content-start gap-2">
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
