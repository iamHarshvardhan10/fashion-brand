import Image from "next/image";
import Link from "next/link";
import { priceDrops } from "@/lib/home-data";
import ImageBox from "@/components/home/ImageBox";

export default function PriceDropBanner() {
    return (
        <section className="px-4 md:px-8">
            {/* Background matches the photo's studio backdrop so the model blends into the banner */}
            <div className="relative flex flex-col overflow-hidden bg-[#dfe4e5] md:block md:h-[34rem] lg:h-[38rem]">
                <h2 className="order-first px-5 pt-6 text-right font-display text-5xl leading-[0.85] font-medium tracking-tight text-neutral-950 uppercase font-stretch-80% md:absolute md:top-12 md:right-14 md:p-0 md:text-[clamp(4rem,7vw,7.5rem)]">
                    Never
                    <br />
                    before
                    <br />
                    prices
                </h2>

                <Image
                    src="/banners/price-drop.jpg"
                    alt="Model in a white tee from the season sale"
                    width={900}
                    height={1100}
                    sizes="(min-width: 768px) 500px, 80vw"
                    // Fade the sides into the banner; the bottom stays solid so the model sits on the edge
                    className="mx-auto -mt-6 h-80 w-auto mask-x-from-70% md:absolute md:bottom-0 md:left-[18%] md:mt-0 md:h-full"
                />

                <ul className="grid grid-cols-2 gap-2 p-3 md:absolute md:inset-x-14 md:bottom-10 md:grid-cols-4 md:gap-4 md:p-0">
                    {priceDrops.map((drop) => (
                        <li key={drop.href}>
                            <Link
                                href={drop.href}
                                className="flex h-full items-center gap-3 bg-white p-2 shadow-sm transition-shadow hover:shadow-md md:p-3"
                            >
                                <ImageBox src={drop.image} alt="" className="size-14 shrink-0 bg-neutral-100 md:size-20" />
                                <span className="min-w-0">
                                    <span className="block font-mono text-[10px] tracking-[0.15em] text-neutral-500 uppercase">
                                        {drop.label}
                                    </span>
                                    <span className="block font-display text-2xl leading-tight font-black whitespace-nowrap font-stretch-75% md:text-3xl">
                                        {drop.value}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
