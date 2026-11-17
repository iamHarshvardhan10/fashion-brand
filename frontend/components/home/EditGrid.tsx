import Link from "next/link";
import { edits } from "@/lib/home-data";
import ImageBox from "@/components/home/ImageBox";

export default function EditGrid() {
    return (
        <section aria-label="Featured edits" className="grid gap-1 md:grid-cols-3">
            {edits.map((edit) => (
                <Link key={edit.href} href={edit.href} className="group block overflow-hidden">
                    <ImageBox
                        src={edit.image}
                        alt={edit.title}
                        className="flex aspect-[3/4] flex-col justify-end bg-neutral-800 p-6 transition-transform duration-700 ease-out group-hover:scale-[1.03] md:p-8"
                    >
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                        <div className="relative text-cream">
                            <h3 className="font-display text-5xl leading-[0.9] font-black uppercase font-stretch-75% md:text-6xl">
                                {edit.title}
                            </h3>
                            <p className="mt-2 font-didot text-lg italic">{edit.text}</p>
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
