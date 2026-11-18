"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { industryHref, type NavIndustry } from "@/lib/nav-links";
import { cn } from "@/lib/utils";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const topLevel = "h-9 rounded-none bg-transparent px-0 text-xs font-medium tracking-[0.2em] uppercase hover:bg-transparent focus:bg-transparent data-popup-open:bg-transparent data-open:bg-transparent";

// Desktop navbar: one dropdown per industry (Men, Women ...) listing its categories and sub-categories.
// Managed in Dashboard → Industries.
export default function NavMenu({ industries }: { industries: NavIndustry[] }) {
    if (!industries.length) return null;

    return (
        <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-6">
                {industries.map((industry) =>
                    industry.categories.length ? (
                        <NavigationMenuItem key={industry.id}>
                            <NavigationMenuTrigger className={cn(topLevel, "underline-offset-8 data-popup-open:underline")}>
                                {industry.name}
                            </NavigationMenuTrigger>
                            <NavigationMenuContent className="p-0">
                                <IndustryPanel industry={industry} />
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    ) : (
                        // No categories yet: a plain link to the industry page
                        <NavigationMenuItem key={industry.id}>
                            <NavigationMenuLink
                                render={<Link href={industryHref(industry.slug)} />}
                                className={cn(topLevel, "p-0 underline-offset-8 hover:underline")}
                            >
                                {industry.name}
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    ),
                )}
            </NavigationMenuList>
        </NavigationMenu>
    );
}

function IndustryPanel({ industry }: { industry: NavIndustry }) {
    const columns = Math.min(industry.categories.length, 4);
    return (
        <div className="flex gap-8 p-6">
            <div className="grid gap-x-10 gap-y-6" style={{ gridTemplateColumns: `repeat(${columns}, minmax(9rem, auto))` }}>
                {industry.categories.map((category) => (
                    <div key={category.id} className="grid content-start gap-2">
                        <NavigationMenuLink
                            render={<Link href={industryHref(industry.slug, category.slug)} />}
                            className="p-0 font-mono text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-transparent hover:underline focus:bg-transparent"
                        >
                            {category.name}
                        </NavigationMenuLink>
                        {category.subCategories.map((sub) => (
                            <NavigationMenuLink
                                key={sub.id}
                                render={<Link href={industryHref(industry.slug, category.slug, sub.slug)} />}
                                className="p-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent"
                            >
                                {sub.name}
                            </NavigationMenuLink>
                        ))}
                    </div>
                ))}
                <NavigationMenuLink
                    render={<Link href={industryHref(industry.slug)} />}
                    className="col-span-full w-fit gap-2 border-t p-0 pt-4 font-mono text-[11px] tracking-[0.2em] uppercase hover:bg-transparent hover:underline focus:bg-transparent"
                >
                    Shop all {industry.name}
                    <ArrowRightIcon className="size-3.5" />
                </NavigationMenuLink>
            </div>

            {industry.imageUrl && (
                <NavigationMenuLink
                    render={<Link href={industryHref(industry.slug)} />}
                    className="relative block w-44 shrink-0 overflow-hidden rounded-none p-0 hover:bg-transparent"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL */}
                    <img
                        src={industry.imageUrl.replace("/upload/", "/upload/f_auto,q_auto,w_400/")}
                        alt=""
                        className="aspect-[3/4] w-full object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent p-3 font-display text-lg leading-none font-black text-cream uppercase font-stretch-75%">
                        {industry.name}
                    </span>
                </NavigationMenuLink>
            )}
        </div>
    );
}
