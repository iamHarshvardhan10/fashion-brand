import Image from "next/image";
import Link from "next/link";
import { ChevronDownIcon, HeartIcon, MenuIcon, SearchIcon, ShoppingBagIcon, UserIcon } from "lucide-react";
import { getNavigation } from "@/lib/navigation";
import { industryHref } from "@/lib/nav-links";
import { cn } from "@/lib/utils";
import NavMenu from "@/components/core/NavMenu";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

// Fixed links around the industries (Men, Women ...), which come from Dashboard → Industries
const leadingLinks = [{ label: "New In", href: "/new-in" }];
const trailingLinks = [
    { label: "Collections", href: "/collections" },
    { label: "Sale", href: "/sale" },
];

const secondaryLinks = [
    { label: "My Account", href: "/account" },
    { label: "Watchlist", href: "/watchlist" },
    { label: "Help & Contact", href: "/help" },
];

const menuLinkClass = "block py-3 font-didot text-xl tracking-wide transition-colors hover:text-muted-foreground";

const offers = [
    "Free shipping on orders over ₹2,999",
    "New season drop — shop now",
    "Up to 40% off on sneakers",
    "Easy 15-day returns",
];

// TODO: replace with the real cart count
const bagCount = 0;

export default async function Navbar() {
    const industries = await getNavigation();

    return (
        <header className="sticky top-0 z-40 h-(--header-height) w-full bg-background/90 backdrop-blur">
            {/* Offer marquee */}
            <div className="group h-8 overflow-hidden bg-[#000000] text-white">
                <div className="flex w-max animate-marquee group-hover:paused motion-reduce:animate-none">
                    {[0, 1].map((copy) => (
                        <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0">
                            {offers.map((offer) => (
                                <li
                                    key={offer}
                                    className="flex h-8 items-center text-[11px] font-medium tracking-[0.2em] whitespace-nowrap uppercase"
                                >
                                    <span className="px-8">{offer}</span>
                                    <span aria-hidden>✦</span>
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>
            </div>
            <nav className="grid h-16 w-full border-b grid-cols-[1fr_auto_1fr] items-center px-2 md:px-3">
                {/* Left: hamburger menu + categories */}
                <div className="flex items-center gap-4">
                    <Sheet>
                        <SheetTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Open menu" />}>
                            <MenuIcon className="size-5" />
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80">
                            <SheetHeader className="px-6 pt-6">
                                <SheetTitle className="font-didot text-2xl tracking-widest uppercase">
                                    Menu
                                </SheetTitle>
                            </SheetHeader>
                            <ul className="flex flex-col overflow-y-auto px-6">
                                {leadingLinks.map((link) => (
                                    <li key={link.href}>
                                        <SheetClose render={<Link href={link.href} />} nativeButton={false} className={menuLinkClass}>
                                            {link.label}
                                        </SheetClose>
                                    </li>
                                ))}
                                {industries.map((industry) => (
                                    <li key={industry.id}>
                                        {industry.categories.length ? (
                                            <details className="group">
                                                <summary className={cn(menuLinkClass, "flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden")}>
                                                    {industry.name}
                                                    <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180" />
                                                </summary>
                                                <ul className="mb-2 grid gap-1 border-l pl-4">
                                                    {industry.categories.map((category) => (
                                                        <li key={category.id}>
                                                            <SheetClose
                                                                render={<Link href={industryHref(industry.slug, category.slug)} />}
                                                                nativeButton={false}
                                                                className="block py-1.5 text-sm tracking-wide uppercase transition-colors hover:text-muted-foreground"
                                                            >
                                                                {category.name}
                                                            </SheetClose>
                                                        </li>
                                                    ))}
                                                    <li>
                                                        <SheetClose
                                                            render={<Link href={industryHref(industry.slug)} />}
                                                            nativeButton={false}
                                                            className="block py-1.5 font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground"
                                                        >
                                                            Shop all {industry.name}
                                                        </SheetClose>
                                                    </li>
                                                </ul>
                                            </details>
                                        ) : (
                                            <SheetClose render={<Link href={industryHref(industry.slug)} />} nativeButton={false} className={menuLinkClass}>
                                                {industry.name}
                                            </SheetClose>
                                        )}
                                    </li>
                                ))}
                                {trailingLinks.map((link) => (
                                    <li key={link.href}>
                                        <SheetClose render={<Link href={link.href} />} nativeButton={false} className={menuLinkClass}>
                                            {link.label}
                                        </SheetClose>
                                    </li>
                                ))}
                            </ul>
                            <SheetFooter className="px-6 pb-6">
                                <Separator className="mb-2" />
                                {secondaryLinks.map((link) => (
                                    <SheetClose
                                        key={link.href}
                                        render={<Link href={link.href} />}
                                        nativeButton={false}
                                        className="py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {link.label}
                                    </SheetClose>
                                ))}
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>

                    <NavMenu industries={industries} />
                </div>

                {/* Center: logo */}
                <Link href="/" aria-label="Home" className="flex items-center justify-center">
                    <span className="relative size-12 overflow-hidden">
                        <Image
                            src="/images.png"
                            alt="Logo"
                            fill
                            priority
                            sizes="48px"
                            className="scale-[1.7] object-contain"
                        />
                    </span>
                </Link>

                {/* Right: search, watchlist, profile, bag */}
                <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                    <Sheet>
                        <SheetTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Search" />}>
                            <SearchIcon className="size-5" />
                        </SheetTrigger>
                        <SheetContent side="top" className="px-4 py-8 md:px-8">
                            <SheetTitle className="sr-only">Search</SheetTitle>
                            <form action="/search" className="mx-auto flex w-full max-w-2xl items-center gap-3">
                                <SearchIcon className="size-5 shrink-0 text-muted-foreground" />
                                <Input
                                    name="q"
                                    type="search"
                                    placeholder="Search for products, brands and more"
                                    autoFocus
                                    className="h-11 border-0 border-b rounded-none px-0 text-base shadow-none focus-visible:ring-0"
                                />
                            </form>
                        </SheetContent>
                    </Sheet>

                    <Link
                        href="/watchlist"
                        aria-label="Watchlist"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "hidden sm:inline-flex")}
                    >
                        <HeartIcon className="size-5" />
                    </Link>

                    <Link
                        href="/account"
                        aria-label="Profile"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "hidden sm:inline-flex")}
                    >
                        <UserIcon className="size-5" />
                    </Link>

                    <Link
                        href="/bag"
                        aria-label={`Bag, ${bagCount} items`}
                        className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "relative")}
                    >
                        <ShoppingBagIcon className="size-5" />
                        {bagCount > 0 && (
                            <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px]">
                                {bagCount}
                            </Badge>
                        )}
                    </Link>
                </div>
            </nav>
        </header>
    );
}
