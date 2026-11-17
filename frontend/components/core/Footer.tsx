import Link from "next/link";
import { cacheLife } from "next/cache";
import { BadgeCheckIcon, RotateCcwIcon, SmartphoneIcon } from "lucide-react";
import { site } from "@/lib/site";
import { Separator } from "@/components/ui/separator";
import FooterAbout from "@/components/core/FooterAbout";

// TODO: replace placeholders (store links, social URLs) with the real ones
const onlineShopping = [
    { label: "Men", href: "/men" },
    { label: "Women", href: "/women" },
    { label: "Sneakers", href: "/sneakers" },
    { label: "Accessories", href: "/accessories" },
    { label: "New In", href: "/new-in" },
    { label: "Sale", href: "/sale" },
    { label: "Gift Cards", href: "/gift-cards" },
    { label: "Inner Circle", href: "/membership" },
];

const usefulLinks = [
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Site Map", href: "/sitemap" },
    { label: "Corporate Information", href: "/corporate" },
    { label: "Stores", href: "/stores" },
    { label: "Size Guide", href: "/size-guide" },
];

const customerPolicies = [
    { label: "Contact Us", href: "/help" },
    { label: "FAQ", href: "/faq" },
    { label: "T&C", href: "/terms-and-conditions" },
    { label: "Terms of Use", href: "/terms" },
    { label: "Track Orders", href: "/track-order" },
    { label: "Shipping", href: "/shipping" },
    { label: "Cancellation", href: "/cancellation" },
    { label: "Returns", href: "/returns" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Grievance Redressal", href: "/grievance" },
];

const popularSearches = [
    "Oversized T-Shirts", "Graphic Tees", "Baggy Jeans", "Cargo Pants", "Linen Shirts", "Cuban Collar Shirts",
    "Bomber Jackets", "Denim Jackets", "Hoodies", "Sweatshirts", "Polo T-Shirts", "Co-ord Sets",
    "Chinos", "Korean Pants", "Shorts", "Sneakers", "Chunky Sneakers", "Loafers", "Belts", "Caps",
    "Perfumes", "Socks", "Backpacks", "Sunglasses",
];

const socials = [
    {
        label: "Facebook",
        href: "https://facebook.com",
        icon: <path fill="currentColor" d="M13.5 21v-7.5H16l.5-3h-3V8.6c0-.9.3-1.6 1.6-1.6h1.6V4.3c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.2H7.5v3h2.8V21h3.2z" />,
    },
    {
        label: "X",
        href: "https://x.com",
        icon: <path fill="currentColor" d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.3L5.3 21H2.2l7.2-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />,
    },
    {
        label: "YouTube",
        href: "https://youtube.com",
        icon: (
            <>
                <rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor" />
                <path d="M10 9v6l5-3z" className="fill-[#fafbfc]" />
            </>
        ),
    },
    {
        label: "Instagram",
        href: "https://instagram.com",
        icon: (
            <>
                <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
            </>
        ),
    },
];

// Cached so the page can still be prerendered; refreshes at most daily
async function CopyrightYear() {
    "use cache";
    cacheLife("days");
    return new Date().getFullYear();
}

function FooterHeading({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <h3 className={`mb-4 font-mono text-[11px] font-bold tracking-[0.15em] text-neutral-950 uppercase ${className ?? ""}`}>
            {children}
        </h3>
    );
}

function LinkList({ links }: { links: { label: string; href: string }[] }) {
    return (
        <ul className="space-y-1.5 text-sm">
            {links.map((link) => (
                <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-brand">
                        {link.label}
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export default function Footer() {
    return (
        <footer className="border-t bg-[#fafbfc] text-[#696b79]">
            <div className="mx-auto max-w-7xl px-4 pt-12 pb-10 md:px-8">
                {/* Link columns */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1fr_1fr_1.3fr_1.6fr]">
                    <nav aria-label="Online shopping">
                        <FooterHeading>Online Shopping</FooterHeading>
                        <LinkList links={onlineShopping} />
                        <FooterHeading className="mt-6">Useful Links</FooterHeading>
                        <LinkList links={usefulLinks} />
                    </nav>

                    <nav aria-label="Customer policies">
                        <FooterHeading>Customer Policies</FooterHeading>
                        <LinkList links={customerPolicies} />
                    </nav>

                    <div className="col-span-2 sm:col-span-1">
                        <FooterHeading>Experience our app on mobile</FooterHeading>
                        {/* TODO: point these at the real store listings, or remove if there is no app */}
                        <div className="flex flex-wrap gap-2">
                            {["Google Play", "App Store"].map((store) => (
                                <a
                                    key={store}
                                    href="#"
                                    className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 text-cream transition-colors hover:bg-brand"
                                >
                                    <SmartphoneIcon className="size-5" strokeWidth={1.5} />
                                    <span className="leading-tight">
                                        <span className="block text-[9px] uppercase opacity-70">Get it on</span>
                                        <span className="block text-sm font-semibold">{store}</span>
                                    </span>
                                </a>
                            ))}
                        </div>

                        <FooterHeading className="mt-8">Keep in touch</FooterHeading>
                        <ul className="flex gap-4">
                            {socials.map((social) => (
                                <li key={social.label}>
                                    <a
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={social.label}
                                        className="block text-neutral-700 transition-colors hover:text-brand"
                                    >
                                        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
                                            {social.icon}
                                        </svg>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Guarantees */}
                    <ul className="col-span-2 space-y-6 sm:col-span-1">
                        <li className="flex items-center gap-4">
                            <BadgeCheckIcon className="size-12 shrink-0 text-brand" strokeWidth={1.25} />
                            <p className="text-sm">
                                <strong className="text-neutral-950">100% ORIGINAL</strong> guarantee for all products
                                at {site.domain}
                            </p>
                        </li>
                        <li className="flex items-center gap-4">
                            <RotateCcwIcon className="size-12 shrink-0 text-brand" strokeWidth={1.25} />
                            <p className="text-sm">
                                <strong className="text-neutral-950">Return within 15 days</strong> of receiving your
                                order
                            </p>
                        </li>
                    </ul>
                </div>

                {/* Popular searches */}
                <div className="mt-12">
                    <div className="mb-4 flex items-center gap-4">
                        <h3 className="shrink-0 font-mono text-[11px] font-bold tracking-[0.15em] text-neutral-950 uppercase">
                            Popular searches
                        </h3>
                        <Separator className="flex-1 bg-neutral-950/15" />
                    </div>
                    <ul className="flex flex-wrap text-sm leading-8">
                        {popularSearches.map((term, i) => (
                            <li key={term} className="whitespace-nowrap">
                                <Link
                                    href={`/search?q=${encodeURIComponent(term)}`}
                                    className="transition-colors hover:text-brand"
                                >
                                    {term}
                                </Link>
                                {i < popularSearches.length - 1 && <span aria-hidden className="mx-2 text-neutral-400">|</span>}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Contact · copyright · parent company */}
                <div className="mt-10 flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
                    <p>
                        In case of any concern,{" "}
                        <Link href="/help" className="font-semibold text-brand hover:underline">
                            Contact Us
                        </Link>
                    </p>
                    <p>
                        &copy; <CopyrightYear /> {site.domain}. All rights reserved.
                    </p>
                    {site.parentCompany && <p>{site.parentCompany}</p>}
                </div>

                <Separator className="my-8 bg-neutral-950/15" />

                {/* Registered office */}
                <div className="flex flex-col gap-6 text-sm md:flex-row md:items-end md:justify-between">
                    <div>
                        <h3 className="mb-4 font-semibold text-neutral-950">Registered Office Address</h3>
                        <address className="leading-relaxed not-italic">
                            {site.address.map((line) => (
                                <span key={line} className="block">{line}</span>
                            ))}
                        </address>
                    </div>
                    <div className="leading-relaxed md:min-w-64">
                        <p>CIN: {site.cin}</p>
                        <p>
                            Telephone:{" "}
                            <a href={`tel:${site.telephone.replace(/[^\d+]/g, "")}`} className="font-semibold text-brand hover:underline">
                                {site.telephone}
                            </a>
                        </p>
                    </div>
                </div>

                <Separator className="my-8 bg-neutral-950/15" />

                <FooterAbout />
            </div>
        </footer>
    );
}
