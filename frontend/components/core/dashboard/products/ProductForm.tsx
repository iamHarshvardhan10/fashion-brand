"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, CheckCircle2Icon, CircleIcon, Loader2Icon, SparklesIcon, Trash2Icon } from "lucide-react";
import { fetchCategories, type Category } from "@/services/operations/categoryAPI";
import { fetchIndustries, type Industry } from "@/services/operations/industryAPI";
import {
    createProduct,
    deleteProduct,
    fetchProduct,
    fetchProducts,
    updateProduct,
    uploadProductImages,
    type Product,
    type ProductImage,
    type ProductStatus,
} from "@/services/operations/productAPI";
import {
    discountPercent,
    formatPaise,
    gstRates,
    hsnSuggestions,
    statusLabels,
    statusStyles,
    suggestedGst,
    tagLabels,
    toPaise,
} from "@/lib/product-options";
import { ApiError, errorMessage } from "@/utils/apiError";
import { formatDate, slugify } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import DeleteDialog from "@/components/core/dashboard/categories/DeleteDialog";
import { emptyForm, fromProduct, readiness, toPayload, validateForm, type ProductFormState } from "./form-state";
import { ChipsInput, Field, ListInput, NativeSelect, RupeeInput, Section } from "./fields";
import ImagesManager, { type LocalImage } from "./ImagesManager";
import SpecsEditor from "./SpecsEditor";
import VariantsEditor from "./VariantsEditor";

// Friendly names for API error paths in the summary banner
const FIELD_NAMES: Record<string, string> = {
    name: "Name",
    slug: "URL",
    styleCode: "Style code",
    price: "Price",
    mrp: "MRP",
    costPrice: "Cost price",
    gstRate: "GST rate",
    hsnCode: "HSN code",
    videoUrl: "Video link",
    categoryId: "Category",
    subCategoryId: "Sub-category",
    industryIds: "Industries",
    countryOfOrigin: "Country of origin",
    images: "Images",
    variants: "Variants",
    metaTitle: "Meta title",
    metaDescription: "Meta description",
};
const fieldName = (path: string) => {
    const [head, index, key] = path.split(".");
    if (head === "variants" && index) return `Variant ${Number(index) + 1}${key ? ` ${key}` : ""}`;
    if (head === "attributes" && index) return `Spec ${Number(index) + 1}`;
    if (head === "highlights" && index) return `Highlight ${Number(index) + 1}`;
    return FIELD_NAMES[head] ?? head;
};

type ProductFormProps = { product?: Product; initialNotice?: string | null };

export default function ProductForm({ product, initialNotice }: ProductFormProps) {
    const router = useRouter();
    const isEdit = Boolean(product);

    const [state, setState] = useState<ProductFormState>(() => (product ? fromProduct(product) : emptyForm()));
    const [saved, setSaved] = useState(() => JSON.stringify(state));
    const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
    const [pending, setPending] = useState<LocalImage[]>([]);
    const [current, setCurrent] = useState<Product | undefined>(product);
    const [slugTouched, setSlugTouched] = useState(isEdit);

    const [categories, setCategories] = useState<Category[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
    const [saving, setSaving] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const dirty = JSON.stringify(state) !== saved || pending.length > 0;
    const set = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
        setState((s) => ({ ...s, [key]: value }));
        setErrors((e) => {
            if (!e[key as string]) return e;
            const next = { ...e };
            delete next[key as string];
            return next;
        });
    };

    useEffect(() => {
        fetchCategories({ includeInactive: true, withSubCategories: true })
            .then(setCategories)
            .catch(() => setFormError("Could not load categories"));
        fetchIndustries()
            .then(setIndustries)
            .catch(() => setFormError("Could not load industries"));
    }, []);

    // The post-create notice arrives in the URL; drop it so a refresh doesn't show it again
    useEffect(() => {
        if (initialNotice) window.history.replaceState(null, "", window.location.pathname);
    }, [initialNotice]);

    // New products start with the legal/policy details of the most recent product, since they rarely change
    useEffect(() => {
        if (isEdit) return;
        let cancelled = false;
        fetchProducts({ sort: "newest", pageSize: 1 })
            .then(({ items }) => (items[0] ? fetchProduct(items[0].id) : null))
            .then((last) => {
                if (cancelled || !last) return;
                const prefill = (s: ProductFormState): ProductFormState => ({
                    ...s,
                    brand: s.brand || (last.brand ?? ""),
                    countryOfOrigin: last.countryOfOrigin,
                    manufacturerDetails: s.manufacturerDetails || (last.manufacturerDetails ?? ""),
                    packerDetails: s.packerDetails || (last.packerDetails ?? ""),
                    importerDetails: s.importerDetails || (last.importerDetails ?? ""),
                    isReturnable: last.isReturnable,
                    isExchangeable: last.isExchangeable,
                    returnWindowDays: String(last.returnWindowDays),
                    codAvailable: last.codAvailable,
                });
                setState(prefill);
                // Prefilled values alone shouldn't count as unsaved edits
                setSaved((snapshot) => JSON.stringify(prefill(JSON.parse(snapshot))));
                setNotice(`Legal details and policies were copied from “${last.name}”. Check them before saving.`);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [isEdit]);

    // Warn before leaving with unsaved changes
    useEffect(() => {
        if (!dirty) return;
        const handler = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    const category = categories.find((c) => c.id === state.categoryId);
    const colours = useMemo(() => [...new Set(state.variants.map((v) => v.color.trim()).filter(Boolean))], [state.variants]);
    const imageCount = isEdit ? images.length : pending.length;
    const checklist = readiness(state, imageCount);
    const requiredMissing = checklist.filter((c) => c.required && !c.done);
    const completeness = Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100);

    const price = toPaise(state.price);
    const mrp = toPaise(state.mrp);
    const cost = toPaise(state.costPrice);
    const gst = state.gstRate === "" ? null : Number(state.gstRate);
    const gstSuggestion = suggestedGst(price);
    const skuPrefix = state.styleCode || slugify(state.name).split("-").slice(0, 3).join("-") || "SKU";

    async function handleSubmit(event?: React.FormEvent) {
        event?.preventDefault();
        setFormError(null);
        setNotice(null);

        const clientErrors = validateForm(state);
        if (state.status === "ACTIVE" && requiredMissing.length) {
            clientErrors.status = `To publish, complete: ${requiredMissing.map((c) => c.label.toLowerCase()).join(", ")}`;
        }
        if (Object.keys(clientErrors).length) {
            setErrors(clientErrors);
            setFormError("Please fix the highlighted fields");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setSaving(true);
        try {
            const payload = toPayload(state);
            if (isEdit && current) {
                const updated = await updateProduct(current.id, payload);
                const next = fromProduct(updated);
                setCurrent(updated);
                setImages(updated.images);
                setState(next);
                setSaved(JSON.stringify(next));
                setErrors({});
                setNotice("Saved");
            } else {
                // A product goes live only after its images exist, so create it as a draft first
                const created = await createProduct({ ...payload, status: "DRAFT" });
                const problems: string[] = [];
                if (pending.length) {
                    try {
                        for (let i = 0; i < pending.length; i += 10) {
                            await uploadProductImages(
                                created.id,
                                pending.slice(i, i + 10).map((p) => ({ file: p.file, alt: p.alt, color: p.color || null })),
                            );
                        }
                    } catch (err) {
                        problems.push(`Some images failed to upload (${errorMessage(err)}). Add them again below.`);
                    }
                }
                if (state.status === "ACTIVE" && !problems.length) {
                    try {
                        await updateProduct(created.id, { status: "ACTIVE" });
                    } catch (err) {
                        problems.push(`Saved as a draft: ${errorMessage(err)}`);
                    }
                }
                setSaved(JSON.stringify(state)); // skip the unsaved-changes prompt
                setPending([]);
                const message = problems.length ? problems.join(" ") : "Product created";
                router.replace(`/dashboard/products/${created.id}?notice=${encodeURIComponent(message)}`);
            }
        } catch (err) {
            if (err instanceof ApiError) {
                setErrors(err.fieldErrors());
                const details = err.errors.map((e) => `${fieldName(e.field)}: ${e.message}`);
                setFormError(
                    details.length && err.message !== "Validation failed"
                        ? `${err.message}. ${details.slice(0, 4).join(" · ")}`
                        : details.length
                          ? `Please fix: ${details.slice(0, 6).join(" · ")}${details.length > 6 ? " …" : ""}`
                          : err.message,
                );
            } else {
                setFormError("Something went wrong, please try again");
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setSaving(false);
        }
    }

    const statusButtons: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

    return (
        <form onSubmit={handleSubmit} noValidate className="grid gap-6">
            {/* Header */}
            {/* Sticks under the 4rem dashboard header */}
            <div className="sticky top-16 z-[5] -mx-4 flex flex-wrap items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <Button variant="ghost" size="icon" render={<Link href="/dashboard/products" />} nativeButton={false} aria-label="Back to products">
                        <ArrowLeftIcon />
                    </Button>
                    <div className="min-w-0">
                        <p className="font-mono text-[10px] tracking-[0.2em] text-brand uppercase">{isEdit ? "Edit product" : "New product"}</p>
                        <h1 className="truncate font-display text-2xl leading-none font-black tracking-tight uppercase font-stretch-75% md:text-3xl">
                            {state.name.trim() || "Untitled product"}
                        </h1>
                    </div>
                    {current && (
                        <Badge className={cn("rounded-none font-mono text-[10px] tracking-widest uppercase", statusStyles[current.status])}>
                            {statusLabels[current.status]}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {dirty && <span className="hidden text-xs text-muted-foreground sm:inline">Unsaved changes</span>}
                    <Button type="submit" disabled={saving || (isEdit && !dirty)} className="font-mono text-xs tracking-wider uppercase">
                        {saving && <Loader2Icon className="animate-spin" />}
                        {isEdit ? "Save changes" : state.status === "ACTIVE" ? "Create & publish" : "Create draft"}
                    </Button>
                </div>
            </div>

            {formError && (
                <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {formError}
                </p>
            )}
            {notice && !formError && (
                <p role="status" className="border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    {notice}
                </p>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid min-w-0 gap-6">
                    {/* ---------- Basics ---------- */}
                    <Section id="basics" title="Basic information" description="What shoppers see first on the product page.">
                        <Field label="Product name" htmlFor="p-name" error={errors.name} counter={{ value: state.name.length, max: 120 }}>
                            <Input
                                id="p-name"
                                value={state.name}
                                maxLength={120}
                                placeholder="e.g. Oversized Heavyweight Graphic Tee"
                                aria-invalid={Boolean(errors.name)}
                                onChange={(e) => {
                                    set("name", e.target.value);
                                    if (!slugTouched) set("slug", slugify(e.target.value));
                                }}
                            />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="URL"
                                htmlFor="p-slug"
                                error={errors.slug}
                                hint={isEdit ? "Changing it breaks old links to this product." : "Generated from the name."}
                            >
                                <div className="flex items-center rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                                    <span className="pl-2.5 font-mono text-xs text-muted-foreground">/product/</span>
                                    <input
                                        id="p-slug"
                                        value={state.slug}
                                        onChange={(e) => {
                                            setSlugTouched(true);
                                            set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
                                        }}
                                        className="h-8 min-w-0 flex-1 bg-transparent pr-2.5 font-mono text-sm outline-none"
                                    />
                                </div>
                            </Field>
                            <Field label="Brand" htmlFor="p-brand" optional>
                                <Input id="p-brand" value={state.brand} maxLength={60} onChange={(e) => set("brand", e.target.value)} />
                            </Field>
                            <Field label="Style code" htmlFor="p-style" error={errors.styleCode} hint="Your internal article number. Prefixes the variant SKUs." optional>
                                <Input
                                    id="p-style"
                                    value={state.styleCode}
                                    maxLength={40}
                                    placeholder="TS-OVR-001"
                                    className="font-mono uppercase"
                                    aria-invalid={Boolean(errors.styleCode)}
                                    onChange={(e) => set("styleCode", e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                                />
                            </Field>
                            <Field label="Season / drop" htmlFor="p-season" hint="e.g. AW26, SS27, Drop 03" optional>
                                <Input id="p-season" value={state.season} maxLength={20} onChange={(e) => set("season", e.target.value)} />
                            </Field>
                        </div>
                        <Field
                            label="Description"
                            htmlFor="p-desc"
                            error={errors.description}
                            counter={{ value: state.description.length, max: 5000 }}
                            hint="Tell the story: the look, the feel, how to style it."
                        >
                            <Textarea id="p-desc" rows={5} maxLength={5000} value={state.description} onChange={(e) => set("description", e.target.value)} />
                        </Field>
                        <Field label="Highlights" hint="Short bullet points under the price. 3–5 works best." optional>
                            <ListInput
                                values={state.highlights}
                                onChange={(v) => set("highlights", v)}
                                placeholder="e.g. 240 GSM heavyweight cotton"
                                max={10}
                                maxLength={150}
                                errors={(i) => errors[`highlights.${i}`]}
                            />
                        </Field>
                    </Section>

                    {/* ---------- Media ---------- */}
                    <Section id="media" title="Media" description="Photos, video and fit information.">
                        {errors.images && <p className="text-sm text-destructive">{errors.images}</p>}
                        {isEdit && current ? (
                            <ImagesManager mode="remote" productId={current.id} images={images} onImagesChange={setImages} colours={colours} productName={state.name} />
                        ) : (
                            <ImagesManager mode="local" items={pending} onItemsChange={setPending} colours={colours} productName={state.name} />
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Model info" htmlFor="p-model" hint="Helps shoppers pick a size." optional>
                                <Input
                                    id="p-model"
                                    value={state.modelInfo}
                                    maxLength={200}
                                    placeholder={`Model is 6'1" (185 cm), wears size M`}
                                    onChange={(e) => set("modelInfo", e.target.value)}
                                />
                            </Field>
                            <Field label="Video link" htmlFor="p-video" error={errors.videoUrl} hint="https:// link to an MP4, YouTube or Instagram reel" optional>
                                <Input id="p-video" type="url" value={state.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} aria-invalid={Boolean(errors.videoUrl)} />
                            </Field>
                        </div>
                    </Section>

                    {/* ---------- Pricing ---------- */}
                    <Section id="pricing" title="Pricing & tax" description="Prices include GST. Variants can override the price.">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Field label="Selling price" htmlFor="p-price" error={errors.price}>
                                <RupeeInput id="p-price" value={state.price} onChange={(e) => set("price", e.target.value)} aria-invalid={Boolean(errors.price)} />
                            </Field>
                            <Field
                                label="MRP"
                                htmlFor="p-mrp"
                                error={errors.mrp}
                                hint={price && mrp && mrp > price ? `${discountPercent(price, mrp)}% off shown to shoppers` : "Same as price = no discount shown"}
                            >
                                <RupeeInput id="p-mrp" value={state.mrp} onChange={(e) => set("mrp", e.target.value)} aria-invalid={Boolean(errors.mrp)} />
                            </Field>
                            <Field
                                label="Cost price"
                                htmlFor="p-cost"
                                error={errors.costPrice}
                                optional
                                hint={
                                    price && cost
                                        ? `Margin ${formatPaise(price - cost)} (${Math.round(((price - cost) / price) * 100)}%) before GST & shipping`
                                        : "Private. Used for margin reports."
                                }
                            >
                                <RupeeInput id="p-cost" value={state.costPrice} onChange={(e) => set("costPrice", e.target.value)} aria-invalid={Boolean(errors.costPrice)} />
                            </Field>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="GST rate"
                                htmlFor="p-gst"
                                error={errors.gstRate}
                                hint={
                                    <>
                                        {price != null && gst != null && `Includes ${formatPaise(Math.round((price * gst) / (100 + gst)))} GST. `}
                                        {gstSuggestion != null && String(gstSuggestion) !== state.gstRate && (
                                            <button type="button" className="underline underline-offset-2" onClick={() => set("gstRate", String(gstSuggestion))}>
                                                Clothing/footwear at this price: {gstSuggestion}%
                                            </button>
                                        )}
                                    </>
                                }
                                optional
                            >
                                <NativeSelect id="p-gst" value={state.gstRate} onChange={(e) => set("gstRate", e.target.value)}>
                                    <option value="">Not set</option>
                                    {gstRates.map((r) => (
                                        <option key={r} value={r}>
                                            {r}%{r === 12 || r === 28 ? " (pre-Sep 2025 slab)" : ""}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>
                            <Field label="HSN code" htmlFor="p-hsn" error={errors.hsnCode} hint="Printed on the GST invoice." optional>
                                <Input
                                    id="p-hsn"
                                    list="hsn-codes"
                                    value={state.hsnCode}
                                    inputMode="numeric"
                                    maxLength={8}
                                    placeholder="6109"
                                    className="font-mono"
                                    aria-invalid={Boolean(errors.hsnCode)}
                                    onChange={(e) => set("hsnCode", e.target.value.replace(/\D/g, ""))}
                                />
                                <datalist id="hsn-codes">
                                    {hsnSuggestions.map((h) => (
                                        <option key={h.code} value={h.code}>
                                            {h.label}
                                        </option>
                                    ))}
                                </datalist>
                            </Field>
                        </div>
                    </Section>

                    {/* ---------- Variants ---------- */}
                    <Section id="variants" title="Variants & inventory" description="Every size and colour you sell, with its own SKU and stock.">
                        {errors.variants && <p className="text-sm text-destructive">{errors.variants}</p>}
                        <VariantsEditor
                            rows={state.variants}
                            onChange={(rows) => set("variants", rows)}
                            skuPrefix={skuPrefix}
                            basePrice={state.price}
                            baseMrp={state.mrp}
                            errors={errors}
                        />
                    </Section>

                    {/* ---------- Specs ---------- */}
                    <Section id="specs" title="Specifications" description="Shown in the “Product details” section. Consistent names make filters work.">
                        <SpecsEditor rows={state.specs} onChange={(rows) => set("specs", rows)} errors={errors} />
                    </Section>

                    {/* ---------- Shipping ---------- */}
                    <Section id="shipping" title="Shipping & ordering" description="Packed parcel size, used for courier charges.">
                        <div className="grid gap-4 sm:grid-cols-4">
                            <Field label="Weight (g)" htmlFor="p-weight" error={errors.weightGrams}>
                                <Input id="p-weight" type="number" min={1} value={state.weightGrams} placeholder="350" className="font-mono" onChange={(e) => set("weightGrams", e.target.value)} />
                            </Field>
                            <Field label="Length (cm)" htmlFor="p-len" error={errors.lengthCm}>
                                <Input id="p-len" type="number" min={1} value={state.lengthCm} placeholder="30" className="font-mono" onChange={(e) => set("lengthCm", e.target.value)} />
                            </Field>
                            <Field label="Width (cm)" htmlFor="p-wid" error={errors.widthCm}>
                                <Input id="p-wid" type="number" min={1} value={state.widthCm} placeholder="25" className="font-mono" onChange={(e) => set("widthCm", e.target.value)} />
                            </Field>
                            <Field label="Height (cm)" htmlFor="p-hgt" error={errors.heightCm}>
                                <Input id="p-hgt" type="number" min={1} value={state.heightCm} placeholder="3" className="font-mono" onChange={(e) => set("heightCm", e.target.value)} />
                            </Field>
                        </div>
                        {state.lengthCm && state.widthCm && state.heightCm && (
                            <p className="-mt-2 text-xs text-muted-foreground">
                                Volumetric weight {((Number(state.lengthCm) * Number(state.widthCm) * Number(state.heightCm)) / 5000).toFixed(2)} kg
                                (couriers charge the higher of this and the actual weight).
                            </p>
                        )}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <ToggleRow id="p-cod" label="Cash on delivery" hint="Allow COD for this product" checked={state.codAvailable} onChange={(v) => set("codAvailable", v)} />
                            <Field label="Max quantity per order" htmlFor="p-max" error={errors.maxPerOrder} hint="Limit for drops and hot items. Empty = no limit." optional>
                                <Input id="p-max" type="number" min={1} max={99} value={state.maxPerOrder} className="font-mono" onChange={(e) => set("maxPerOrder", e.target.value)} />
                            </Field>
                        </div>
                    </Section>

                    {/* ---------- Returns ---------- */}
                    <Section id="returns" title="Returns & exchange" description="Shown on the product page and enforced on return requests.">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <ToggleRow id="p-returnable" label="Returnable" checked={state.isReturnable} onChange={(v) => set("isReturnable", v)} />
                            <ToggleRow id="p-exchangeable" label="Exchangeable" checked={state.isExchangeable} onChange={(v) => set("isExchangeable", v)} />
                            <Field label="Window (days)" htmlFor="p-window" error={errors.returnWindowDays}>
                                <Input
                                    id="p-window"
                                    type="number"
                                    min={0}
                                    max={90}
                                    value={state.returnWindowDays}
                                    disabled={!state.isReturnable && !state.isExchangeable}
                                    className="font-mono"
                                    onChange={(e) => set("returnWindowDays", e.target.value)}
                                />
                            </Field>
                        </div>
                        {!state.isReturnable && !state.isExchangeable && (
                            <p className="-mt-2 text-xs text-amber-700">Shown as “No returns or exchanges” — common for innerwear, caps and perfumes.</p>
                        )}
                    </Section>

                    {/* ---------- Compliance ---------- */}
                    <Section
                        id="legal"
                        title="Legal & compliance"
                        description="Indian e-commerce rules require these on every product page: country of origin, MRP, net quantity and who made it."
                    >
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Country of origin" htmlFor="p-origin" error={errors.countryOfOrigin}>
                                <Input id="p-origin" value={state.countryOfOrigin} maxLength={60} onChange={(e) => set("countryOfOrigin", e.target.value)} />
                            </Field>
                            <Field label="Net quantity" htmlFor="p-net" hint={`"1 N" = one piece. "100 ml" for perfumes.`} optional>
                                <Input id="p-net" value={state.netQuantity} maxLength={30} onChange={(e) => set("netQuantity", e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Manufactured by" htmlFor="p-mfr" hint="Name and full address" optional>
                            <Textarea id="p-mfr" rows={2} maxLength={400} value={state.manufacturerDetails} onChange={(e) => set("manufacturerDetails", e.target.value)} />
                        </Field>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Packed / marketed by" htmlFor="p-packer" hint="If different from the manufacturer" optional>
                                <Textarea id="p-packer" rows={2} maxLength={400} value={state.packerDetails} onChange={(e) => set("packerDetails", e.target.value)} />
                            </Field>
                            <Field
                                label="Imported by"
                                htmlFor="p-importer"
                                hint={state.countryOfOrigin.trim().toLowerCase() === "india" ? "Only for imported goods" : "Required for imported goods"}
                                optional
                            >
                                <Textarea id="p-importer" rows={2} maxLength={400} value={state.importerDetails} onChange={(e) => set("importerDetails", e.target.value)} />
                            </Field>
                        </div>
                    </Section>

                    {/* ---------- SEO ---------- */}
                    <Section id="seo" title="Search & SEO" description="How the product appears on Google and in site search.">
                        <Field
                            label="Meta title"
                            htmlFor="p-mtitle"
                            error={errors.metaTitle}
                            counter={{ value: state.metaTitle.length, max: 70 }}
                            hint="Empty = product name"
                            optional
                        >
                            <Input id="p-mtitle" value={state.metaTitle} maxLength={70} placeholder={state.name} onChange={(e) => set("metaTitle", e.target.value)} />
                        </Field>
                        <Field
                            label="Meta description"
                            htmlFor="p-mdesc"
                            error={errors.metaDescription}
                            counter={{ value: state.metaDescription.length, max: 160 }}
                            hint="Empty = start of the description"
                            optional
                        >
                            <Textarea id="p-mdesc" rows={2} maxLength={160} value={state.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} />
                        </Field>
                        <Field label="Search keywords" htmlFor="p-keywords" hint="Other words shoppers use: tee, tshirt, oversize. Enter or comma to add." optional>
                            <ChipsInput id="p-keywords" values={state.searchKeywords} onChange={(v) => set("searchKeywords", v)} placeholder="Add keyword" max={20} />
                        </Field>
                        <div className="grid gap-0.5 border p-3">
                            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Google preview</p>
                            <p className="truncate text-xs text-emerald-800">yourbrand.com › product › {state.slug || "product-url"}</p>
                            <p className="truncate text-lg text-blue-800">{state.metaTitle || state.name || "Product name"}</p>
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                {state.metaDescription || state.description.slice(0, 160) || "Add a description so search engines have something to show."}
                            </p>
                        </div>
                    </Section>
                </div>

                {/* ---------- Sidebar ---------- */}
                <aside className="grid gap-6 lg:sticky lg:top-36">
                    <Card className="rounded-none">
                        <CardHeader>
                            <CardTitle className="font-mono text-[11px] tracking-[0.2em] uppercase">Status</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid grid-cols-3 border" role="radiogroup" aria-label="Status">
                                {statusButtons.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        role="radio"
                                        aria-checked={state.status === s}
                                        onClick={() => set("status", s)}
                                        className={cn(
                                            "py-2 font-mono text-[11px] tracking-wider uppercase transition-colors",
                                            state.status === s ? "bg-foreground text-background" : "hover:bg-muted",
                                        )}
                                    >
                                        {statusLabels[s]}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {state.status === "ACTIVE"
                                    ? "Visible and purchasable in the store."
                                    : state.status === "DRAFT"
                                      ? "Hidden from the store while you work on it."
                                      : "Hidden from the store. Kept for order history."}
                            </p>
                            {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}

                            <div className="grid gap-2 border-t pt-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-medium">Listing quality</span>
                                    <span className="font-mono">{completeness}%</span>
                                </div>
                                <Progress value={completeness} />
                                <ul className="grid gap-1.5 pt-1">
                                    {checklist.map((item) => (
                                        <li key={item.label} className={cn("flex items-center gap-2 text-xs", item.done ? "text-muted-foreground" : item.required ? "text-foreground" : "text-muted-foreground")}>
                                            {item.done ? <CheckCircle2Icon className="size-3.5 text-emerald-600" /> : <CircleIcon className={cn("size-3.5", item.required && "text-destructive")} />}
                                            <span className={cn(item.done && "line-through decoration-muted-foreground/40")}>{item.label}</span>
                                            {item.required && !item.done && <span className="ml-auto font-mono text-[9px] text-destructive uppercase">Required</span>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-none">
                        <CardHeader>
                            <CardTitle className="font-mono text-[11px] tracking-[0.2em] uppercase">Organisation</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Field label="Category" htmlFor="p-cat" error={errors.categoryId}>
                                <NativeSelect
                                    id="p-cat"
                                    value={state.categoryId}
                                    aria-invalid={Boolean(errors.categoryId)}
                                    onChange={(e) => {
                                        set("categoryId", e.target.value);
                                        set("subCategoryId", "");
                                    }}
                                >
                                    <option value="">Choose…</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                            {!c.isActive ? " (hidden)" : ""}
                                        </option>
                                    ))}
                                </NativeSelect>
                                {!categories.length && (
                                    <p className="text-xs text-muted-foreground">
                                        No categories yet.{" "}
                                        <Link href="/dashboard/categories" className="underline">
                                            Create one
                                        </Link>
                                    </p>
                                )}
                            </Field>
                            <Field label="Sub-category" htmlFor="p-sub" error={errors.subCategoryId} optional>
                                <NativeSelect
                                    id="p-sub"
                                    value={state.subCategoryId}
                                    disabled={!category?.subCategories?.length}
                                    onChange={(e) => set("subCategoryId", e.target.value)}
                                >
                                    <option value="">None</option>
                                    {category?.subCategories?.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </NativeSelect>
                            </Field>
                            <Field
                                label="Industries"
                                error={errors.industryIds}
                                hint={
                                    industries.length ? (
                                        "Where it shows in the navbar. Pick several for unisex products."
                                    ) : (
                                        <>
                                            No industries yet.{" "}
                                            <Link href="/dashboard/industries" className="underline">
                                                Create one
                                            </Link>
                                        </>
                                    )
                                }
                            >
                                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Industries">
                                    {industries.map((industry) => {
                                        const on = state.industryIds.includes(industry.id);
                                        return (
                                            <button
                                                key={industry.id}
                                                type="button"
                                                aria-pressed={on}
                                                onClick={() =>
                                                    set("industryIds", on ? state.industryIds.filter((x) => x !== industry.id) : [...state.industryIds, industry.id])
                                                }
                                                className={cn(
                                                    "h-8 border px-3 text-xs font-medium transition-colors",
                                                    on ? "border-foreground bg-foreground text-background" : "hover:border-foreground/50",
                                                    !industry.isActive && "border-dashed",
                                                )}
                                                title={industry.isActive ? undefined : "Hidden industry"}
                                            >
                                                {industry.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                {category && state.industryIds.some((id) => !industries.find((i) => i.id === id)?.categories.some((c) => c.id === category.id)) && (
                                    <p className="text-xs text-amber-700">
                                        {category.name} isn&apos;t listed under{" "}
                                        {industries
                                            .filter((i) => state.industryIds.includes(i.id) && !i.categories.some((c) => c.id === category.id))
                                            .map((i) => i.name)
                                            .join(", ")}{" "}
                                        in the navbar yet. Add it in Industries.
                                    </p>
                                )}
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Badge" htmlFor="p-tag">
                                    <NativeSelect id="p-tag" value={state.tag} onChange={(e) => set("tag", e.target.value as ProductFormState["tag"])}>
                                        <option value="">None</option>
                                        {Object.entries(tagLabels).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                </Field>
                            </div>
                            <ToggleRow
                                id="p-featured"
                                label="Featured"
                                hint="Shows in Trending on the home page"
                                checked={state.isFeatured}
                                onChange={(v) => set("isFeatured", v)}
                                icon={<SparklesIcon className="size-3.5" />}
                            />
                        </CardContent>
                    </Card>

                    {current && (
                        <Card className="rounded-none">
                            <CardHeader>
                                <CardTitle className="font-mono text-[11px] tracking-[0.2em] uppercase">Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                                    <dt className="text-muted-foreground">In stock</dt>
                                    <dd className="text-right font-mono">{current.totalStock} units</dd>
                                    <dt className="text-muted-foreground">Rating</dt>
                                    <dd className="text-right font-mono">{current.ratingCount ? `${current.ratingAverage.toFixed(1)} (${current.ratingCount})` : "No reviews"}</dd>
                                    <dt className="text-muted-foreground">Published</dt>
                                    <dd className="text-right">{formatDate(current.publishedAt)}</dd>
                                    <dt className="text-muted-foreground">Created</dt>
                                    <dd className="text-right">{formatDate(current.createdAt)}</dd>
                                    <dt className="text-muted-foreground">Last saved</dt>
                                    <dd className="text-right">{formatDate(current.updatedAt, true)}</dd>
                                </dl>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteOpen(true)}
                                    className="mt-4 w-full font-mono text-[11px] tracking-wider text-destructive uppercase hover:bg-destructive/10 hover:text-destructive"
                                >
                                    <Trash2Icon />
                                    Delete product
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </aside>
            </div>

            {current && (
                <DeleteDialog
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                    title={`Delete ${current.name}?`}
                    description="Deletes the product, its variants, images and stock history. Products that have been ordered can only be archived."
                    onConfirm={async () => {
                        await deleteProduct(current.id);
                        setSaved(JSON.stringify(state));
                        router.replace("/dashboard/products");
                    }}
                />
            )}
        </form>
    );
}

function ToggleRow({
    id,
    label,
    hint,
    checked,
    onChange,
    icon,
}: {
    id: string;
    label: string;
    hint?: string;
    checked: boolean;
    onChange: (value: boolean) => void;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-3 border p-3">
            <div className="grid gap-0.5">
                <Label htmlFor={id} className="flex items-center gap-1.5">
                    {icon}
                    {label}
                </Label>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onChange} />
        </div>
    );
}
