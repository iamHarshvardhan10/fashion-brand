import Link from "next/link";
import { collectionHref, getCollections } from "@/lib/collections";
import { sized } from "@/lib/cloudinary";
import ImageBox from "@/components/home/ImageBox";

// Curated edits, managed in Dashboard → Collections → Edits
export default async function EditGrid() {
    const edits = (await getCollections("EDIT")).filter((c) => c.imageUrl);
    if (!edits.length) return null;

    return (
        <section aria-label="Featured edits" className="grid gap-1 md:grid-cols-3">
            {edits.map((edit) => (
                <Link key={edit.id} href={collectionHref(edit)} className="group block overflow-hidden">
                    <ImageBox
                        src={sized(edit.imageUrl!, 1000)}
                        alt={edit.name}
                        className="flex aspect-[3/4] flex-col justify-end bg-neutral-800 p-6 transition-transform duration-700 ease-out group-hover:scale-[1.03] md:p-8"
                    >
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                        <div className="relative text-cream">
                            <h3 className="font-display text-5xl leading-[0.9] font-black uppercase font-stretch-75% md:text-6xl">
                                {edit.name}
                            </h3>
                            {edit.description && <p className="mt-2 font-didot text-lg italic">{edit.description}</p>}
                            <span className="mt-4 inline-block border-b border-cream pb-1 font-mono text-xs tracking-[0.2em] uppercase">
                                Explore
                            </span>
                        </div>
                    </ImageBox>
                </Link>
            ))}
        </section>
    );
}
