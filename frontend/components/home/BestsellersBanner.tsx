import { getBanner } from "@/lib/banners";
import { sized } from "@/lib/cloudinary";
import { BannerLink, Lines } from "@/components/home/BannerParts";

export default async function BestsellersBanner() {
    const banner = await getBanner("BESTSELLERS");
    if (!banner) return null;

    return (
        <section className="px-4 pb-12 md:px-8 md:pb-16">
            {/* Background matches the photo's wall colour so the model blends into the banner */}
            <BannerLink
                href={banner.linkUrl}
                style={{ backgroundColor: banner.backgroundColor ?? undefined }}
                className="group grid grid-cols-[1fr_auto_1fr] items-end gap-3 overflow-hidden bg-neutral-200 px-3 pt-6 md:gap-8 md:pt-10"
            >
                <h2 className="self-center text-right font-display text-[clamp(1.1rem,4.2vw,4.25rem)] leading-[0.9] font-medium tracking-tight text-neutral-950 uppercase font-stretch-80%">
                    <Lines text={banner.title} />
                </h2>

                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, resized via sized() */}
                <img
                    src={sized(banner.imageUrl, 800)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    // Fade the sides and top into the banner; the bottom stays solid so the model sits on the edge
                    className="h-44 w-auto transition-transform duration-700 ease-out mask-x-from-75% mask-t-from-65% group-hover:scale-[1.03] sm:h-60 md:h-80 lg:h-96"
                />

                <p className="self-center font-display text-[clamp(1.1rem,4.2vw,4.25rem)] leading-[0.9] font-bold tracking-tight text-neutral-950 uppercase font-stretch-80%">
                    {banner.subtitle}
                    {banner.subtitle && banner.highlight && " "}
                    {banner.highlight && <span className="text-brand">{banner.highlight}</span>}
                    {banner.ctaLabel && (
                        <span className="mt-3 block font-mono text-[clamp(0.55rem,1vw,0.75rem)] font-normal tracking-[0.2em] text-neutral-700 [word-spacing:normal] underline-offset-8 group-hover:underline md:mt-5">
                            {banner.ctaLabel}
                        </span>
                    )}
                </p>
            </BannerLink>
        </section>
    );
}
