import Link from "next/link";
import { collectionHref, getCollections } from "@/lib/collections";
import { sized } from "@/lib/cloudinary";
import ImageBox from "@/components/home/ImageBox";
import SectionHeading from "@/components/home/SectionHeading";

// "Shop by vibe" tiles, managed in Dashboard → Collections → Vibes
export default async function VibeGrid() {
    const vibes = (await getCollections("VIBE")).filter((c) => c.imageUrl);
    if (!vibes.length) return null;

    return (
        <section className="px-4 py-12 md:px-8 md:py-16">
            <SectionHeading eyebrow="Dress for the plan" title="Shop by vibe" />
            <ul className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
                {vibes.map((vibe) => (
                    <li key={vibe.id}>
                        <Link href={collectionHref(vibe)} className="group block overflow-hidden">
                            <ImageBox
                                src={sized(vibe.imageUrl!, 900)}
                                alt={vibe.name}
                                className="flex aspect-[4/3] items-end bg-neutral-700 p-4 md:p-6"
                            >
                                <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/40" />
                                <h3 className="relative font-display text-2xl leading-none font-black text-cream uppercase font-stretch-75% md:text-4xl">
                                    {vibe.name}
                                </h3>
                            </ImageBox>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
