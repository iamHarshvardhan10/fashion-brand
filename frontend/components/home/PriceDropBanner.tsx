import Link from "next/link";
import { getBanner } from "@/lib/banners";
import { sized } from "@/lib/cloudinary";
import ImageBox from "@/components/home/ImageBox";
import { Lines } from "@/components/home/BannerParts";

export default async function PriceDropBanner() {
    const banner = await getBanner("PRICE_DROP");
    if (!banner) return null;
    const cards = banner.items ?? [];

    return (
        <section className="px-4 md:px-8">
            {/* Background matches the photo's studio backdrop so the model blends into the banner */}
            <div
                style={{ backgroundColor: banner.backgroundColor ?? undefined }}
                className="relative flex flex-col overflow-hidden bg-neutral-200 md:block md:h-[34rem] lg:h-[38rem]"
            >
                <h2 className="order-first px-5 pt-6 text-right font-display text-5xl leading-[0.85] font-medium tracking-tight text-neutral-950 uppercase font-stretch-80% md:absolute md:top-12 md:right-14 md:p-0 md:text-[clamp(4rem,7vw,7.5rem)]">
                    <Lines text={banner.title} />
                </h2>

                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, resized via sized() */}
                <img
                    src={sized(banner.imageUrl, 1000)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    // Fade the sides into the banner; the bottom stays solid so the model sits on the edge
                    className="mx-auto -mt-6 h-80 w-auto mask-x-from-70% md:absolute md:bottom-0 md:left-[18%] md:mt-0 md:h-full"
                />

                {cards.length > 0 && (
                    <ul className="grid grid-cols-2 gap-2 p-3 md:absolute md:inset-x-14 md:bottom-10 md:grid-cols-4 md:gap-4 md:p-0">
                        {cards.map((card) => (
                            <li key={card.id}>
                                <Link
                                    href={card.linkUrl}
                                    className="flex h-full items-center gap-3 bg-white p-2 shadow-sm transition-shadow hover:shadow-md md:p-3"
                                >
                                    <ImageBox
                                        src={card.imageUrl ? sized(card.imageUrl, 200) : ""}
                                        alt=""
                                        className="size-14 shrink-0 bg-neutral-100 md:size-20"
                                    />
                                    <span className="min-w-0">
                                        <span className="block font-mono text-[10px] tracking-[0.15em] text-neutral-500 uppercase">
                                            {card.label}
                                        </span>
                                        <span className="block font-display text-2xl leading-tight font-black whitespace-nowrap font-stretch-75% md:text-3xl">
                                            {card.value}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
