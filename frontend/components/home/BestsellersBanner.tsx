import Image from "next/image";
import Link from "next/link";

export default function BestsellersBanner() {
    return (
        <section className="px-4 pb-12 md:px-8 md:pb-16">
            {/* Background matches the photo's wall colour so the model blends into the banner */}
            <Link
                href="/bestsellers"
                className="group grid grid-cols-[1fr_auto_1fr] items-end gap-3 overflow-hidden bg-[#e8e9eb] px-3 pt-6 md:gap-8 md:pt-10"
            >
                <h2 className="self-center text-right font-display text-[clamp(1.1rem,4.2vw,4.25rem)] leading-[0.9] font-medium tracking-tight text-neutral-950 uppercase font-stretch-80%">
                    Last few
                    <br />
                    bestsellers
                    <br />
                    left
                </h2>

                <Image
                    src="/banners/bestsellers.jpg"
                    alt="Model wearing a light blue shirt from the bestsellers collection"
                    width={740}
                    height={960}
                    sizes="(min-width: 768px) 300px, 35vw"
                    // Fade the sides and top into the banner; the bottom stays solid so the model sits on the edge
                    className="h-44 w-auto transition-transform duration-700 ease-out mask-x-from-75% mask-t-from-65% group-hover:scale-[1.03] sm:h-60 md:h-80 lg:h-96"
                />

                <p className="self-center font-display text-[clamp(1.1rem,4.2vw,4.25rem)] leading-[0.9] font-bold tracking-tight text-neutral-950 uppercase font-stretch-80%">
                    Up to <span className="text-brand">30% off</span>
                    <span className="mt-3 block font-mono text-[clamp(0.55rem,1vw,0.75rem)] font-normal tracking-[0.2em] text-neutral-700 [word-spacing:normal] underline-offset-8 group-hover:underline md:mt-5">
                        Shop bestsellers
                    </span>
                </p>
            </Link>
        </section>
    );
}
