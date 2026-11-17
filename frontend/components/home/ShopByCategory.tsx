import Link from "next/link";
import { categories } from "@/lib/home-data";
import ImageBox from "@/components/home/ImageBox";
import SectionHeading from "@/components/home/SectionHeading";

export default function ShopByCategory() {
    return (
        <section className="px-4 py-12 md:px-8 md:py-16">
            <SectionHeading eyebrow="Find your fit" title="Shop by category" href="/shop" />
            {/* Swipeable row on mobile, single row of 8 on desktop */}
            <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-8 md:overflow-visible md:px-0">
                {categories.map((category) => (
                    <li key={category.href} className="w-24 shrink-0 snap-start md:w-auto">
                        <Link href={category.href} className="group flex flex-col items-center gap-3">
                            <ImageBox
                                src={category.image}
                                alt={category.label}
                                className="aspect-square w-full rounded-full ring-1 ring-neutral-950/10 transition-all duration-300 ring-offset-4 group-hover:ring-2 group-hover:ring-brand"
                            />
                            <span className="font-mono text-[11px] tracking-[0.15em] uppercase">{category.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
