"use client";

import { useState } from "react";
import { Accordion } from "@base-ui/react/accordion";
import {
    CheckIcon,
    ChevronDownIcon,
    HeartIcon,
    LinkIcon,
    MessageCircleIcon,
    RefreshCcwIcon,
    Share2Icon,
    ShoppingBagIcon,
    TruckIcon,
} from "lucide-react";
import { formatPrice } from "@/lib/home-data";
import type { ProductDetail } from "@/lib/product-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function ProductInfo({ product }: { product: ProductDetail }) {
    const [size, setSize] = useState<string | null>(null);
    const [sizeError, setSizeError] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [wishlisted, setWishlisted] = useState(false);
    const [added, setAdded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [pincode, setPincode] = useState("");
    const [delivery, setDelivery] = useState<{ ok: boolean; text: string } | null>(null);

    const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

    const addToCart = () => {
        if (!size) {
            setSizeError(true);
            return;
        }
        // TODO: call the cart API
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const checkPincode = (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^[1-9]\d{5}$/.test(pincode)) {
            setDelivery({ ok: false, text: "Enter a valid 6-digit pincode." });
            return;
        }
        // TODO: call the serviceability API
        const eta = new Date();
        eta.setDate(eta.getDate() + 4);
        setDelivery({
            ok: true,
            text: `Delivery by ${eta.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}. Cash on delivery available.`,
        });
    };

    const copyLink = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const nativeShare = () => {
        if (navigator.share) navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
        else copyLink();
    };

    return (
        <div className="space-y-6">
            {/* Title + price */}
            <div>
                {product.tag && (
                    <span className="mb-3 inline-block bg-neutral-950 px-2 py-1 font-mono text-[10px] tracking-widest text-cream uppercase">
                        {product.tag}
                    </span>
                )}
                <h1 className="font-display text-3xl leading-none font-black tracking-tight uppercase font-stretch-75% md:text-4xl">
                    {product.name}
                </h1>
                <p className="mt-2 font-mono text-xs tracking-[0.2em] text-neutral-500 uppercase">
                    {product.categoryLabel}
                </p>
                <p className="mt-5 flex items-baseline gap-3 font-mono">
                    <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
                    <span className="text-sm text-neutral-500 line-through">{formatPrice(product.mrp)}</span>
                    <span className="text-sm font-semibold text-brand">{discount}% off</span>
                </p>
                <p className="mt-1 text-xs text-neutral-500">Price incl. of all taxes</p>
            </div>

            {/* Size */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <p className={cn("text-sm font-semibold", sizeError && "text-brand")}>
                        {sizeError ? "Please select a size." : size ? `Size: ${size}` : "Select a size"}
                    </p>
                    <SizeChart sizes={product.sizes.map((s) => s.label)} />
                </div>
                <div role="radiogroup" aria-label="Size" className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                        <button
                            key={s.label}
                            type="button"
                            role="radio"
                            aria-checked={size === s.label}
                            disabled={!s.inStock}
                            onClick={() => {
                                setSize(s.label);
                                setSizeError(false);
                            }}
                            className={cn(
                                "h-10 min-w-12 border px-3 font-mono text-xs transition-colors",
                                size === s.label
                                    ? "border-neutral-950 bg-neutral-950 text-cream"
                                    : "border-neutral-300 hover:border-neutral-950",
                                sizeError && "border-brand/60",
                                "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-300 disabled:line-through disabled:hover:border-neutral-200"
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
                <label htmlFor="quantity" className="text-sm font-semibold">
                    Quantity
                </label>
                <select
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="h-9 border border-neutral-300 bg-white px-2 font-mono text-xs outline-none focus-visible:border-neutral-950"
                >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                            {String(n).padStart(2, "0")}
                        </option>
                    ))}
                </select>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
                <Button
                    onClick={addToCart}
                    className="h-12 rounded-none bg-brand font-mono text-xs tracking-[0.2em] text-cream uppercase hover:bg-brand/90"
                >
                    {added ? <CheckIcon /> : <ShoppingBagIcon />}
                    {added ? "Added" : "Add to cart"}
                </Button>
                <Button
                    variant="outline"
                    aria-pressed={wishlisted}
                    onClick={() => setWishlisted((w) => !w)}
                    className="h-12 rounded-none border-neutral-950 font-mono text-xs tracking-[0.2em] uppercase"
                >
                    <HeartIcon className={cn(wishlisted && "fill-brand text-brand")} />
                    {wishlisted ? "Wishlisted" : "Wishlist"}
                </Button>
            </div>

            {/* Share */}
            <div className="flex items-center gap-1">
                <span className="mr-2 text-sm text-neutral-500">Share</span>
                <a
                    href={`https://wa.me/?text=${encodeURIComponent(product.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Share on WhatsApp"
                    className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-neutral-100"
                >
                    <MessageCircleIcon className="size-4" />
                </a>
                <button
                    type="button"
                    onClick={copyLink}
                    aria-label="Copy link"
                    className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-neutral-100"
                >
                    {copied ? <CheckIcon className="size-4 text-brand" /> : <LinkIcon className="size-4" />}
                </button>
                <button
                    type="button"
                    onClick={nativeShare}
                    aria-label="More share options"
                    className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-neutral-100"
                >
                    <Share2Icon className="size-4" />
                </button>
                {copied && <span className="font-mono text-[10px] tracking-widest text-brand uppercase">Link copied</span>}
            </div>

            {/* Delivery */}
            <div>
                <p className="mb-3 text-sm font-semibold">Delivery details</p>
                <form onSubmit={checkPincode} className="flex h-12 items-center border border-neutral-300 focus-within:border-neutral-950">
                    <TruckIcon className="ml-3 size-4 shrink-0 text-neutral-500" />
                    <input
                        inputMode="numeric"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                        placeholder="Enter pincode"
                        aria-label="Pincode"
                        className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                    />
                    <button
                        type="submit"
                        className="h-full px-4 font-mono text-xs font-semibold tracking-[0.2em] text-brand uppercase hover:underline"
                    >
                        Check
                    </button>
                </form>
                {delivery && (
                    <p className={cn("mt-2 text-xs", delivery.ok ? "text-emerald-700" : "text-brand")}>{delivery.text}</p>
                )}
                <div className="mt-3 flex gap-3 border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                    <RefreshCcwIcon className="mt-0.5 size-4 shrink-0" />
                    <p>This product is eligible for return or exchange under our 15-day return or exchange policy.</p>
                </div>
            </div>

            {/* Details */}
            <Accordion.Root defaultValue={["details"]} className="border border-neutral-200">
                <AccordionSection value="details" title="Product details">
                    <dl className="space-y-4">
                        {product.details.map((d) => (
                            <div key={d.label}>
                                <dt className="font-semibold text-neutral-950">{d.label}</dt>
                                {d.value.map((line) => (
                                    <dd key={line}>{line}</dd>
                                ))}
                            </div>
                        ))}
                    </dl>
                </AccordionSection>
                <AccordionSection value="description" title="Product description">
                    <p>{product.description}</p>
                    <ul className="mt-3 list-disc space-y-1 pl-5">
                        {product.highlights.map((h) => (
                            <li key={h}>{h}</li>
                        ))}
                    </ul>
                </AccordionSection>
                <AccordionSection value="shipping" title="Shipping & returns">
                    <p>Free shipping on orders over ₹2,999. Orders ship within 24–48 hours.</p>
                    <p className="mt-2">Easy 15-day returns and exchanges. Items must be unworn with tags attached.</p>
                </AccordionSection>
            </Accordion.Root>
        </div>
    );
}

function AccordionSection({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
    return (
        <Accordion.Item value={value} className="border-b border-neutral-200 last:border-b-0">
            <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold">
                    {title}
                    <ChevronDownIcon className="size-4 transition-transform duration-200 group-data-panel-open:rotate-180" />
                </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="h-(--accordion-panel-height) overflow-hidden text-sm text-neutral-600 transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0">
                <div className="px-4 pb-5">{children}</div>
            </Accordion.Panel>
        </Accordion.Item>
    );
}

// TODO: replace the placeholder measurements with the real size chart
function SizeChart({ sizes }: { sizes: string[] }) {
    return (
        <Sheet>
            <SheetTrigger className="font-mono text-xs tracking-[0.15em] text-brand uppercase underline underline-offset-4">
                Size chart
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader className="px-6 pt-6">
                    <SheetTitle className="font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">
                        Size chart
                    </SheetTitle>
                </SheetHeader>
                <div className="px-6">
                    <p className="mb-4 text-xs text-neutral-500">Measurements in inches, taken flat across the garment.</p>
                    <table className="w-full border-collapse font-mono text-xs">
                        <thead>
                            <tr className="border-b border-neutral-950 text-left">
                                <th className="py-2">Size</th>
                                <th className="py-2">Chest</th>
                                <th className="py-2">Length</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sizes.map((s, i) => (
                                <tr key={s} className="border-b border-neutral-200">
                                    <td className="py-2.5 font-semibold">{s}</td>
                                    <td className="py-2.5">{36 + i * 2}</td>
                                    <td className="py-2.5">{26 + i}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SheetContent>
        </Sheet>
    );
}
