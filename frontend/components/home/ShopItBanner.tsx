import { getBanner } from "@/lib/banners";
import { sized } from "@/lib/cloudinary";
import { BannerLink } from "@/components/home/BannerParts";

export default async function ShopItBanner() {
    const banner = await getBanner("SHOP_IT");
    if (!banner) return null;

    // First line small, the rest large ("Shop it" / "Save it")
    const [lead, ...rest] = banner.title.split("\n");

    return (
        <section className="px-4 pt-12 md:px-8 md:pt-16">
            <BannerLink href={banner.linkUrl} className="group relative block overflow-hidden bg-neutral-900">
                <picture>
                    {banner.mobileImageUrl && (
                        <source media="(max-width: 767px)" srcSet={sized(banner.mobileImageUrl, 900)} />
                    )}
                    <img
                        src={sized(banner.imageUrl, 2000)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="aspect-[2.4/1] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] md:aspect-[3/1]"
                    />
                </picture>
                {/* Darken the edges so the cream type stays readable */}
                <div className="absolute inset-0 bg-linear-to-r from-black/40 via-transparent to-black/40" />

                <h2 className="absolute top-1/2 left-[4%] -translate-y-1/2 -rotate-6 font-display leading-[0.85] font-black text-cream uppercase font-stretch-75%">
                    {rest.length ? (
                        <>
                            <span className="block text-[clamp(1.25rem,4vw,4rem)]">{lead}</span>
                            {rest.map((line, i) => (
                                <span key={i} className="block text-[clamp(2rem,7.5vw,7.5rem)]">
                                    {line}
                                </span>
                            ))}
                        </>
                    ) : (
                        <span className="block text-[clamp(2rem,7.5vw,7.5rem)]">{lead}</span>
                    )}
                </h2>

                {(banner.subtitle || banner.highlight) && (
                    <p className="absolute top-1/2 right-[4%] -translate-y-1/2 text-right font-display leading-[0.85] font-black text-cream uppercase font-stretch-75%">
                        {banner.subtitle && (
                            <span className="mb-1 inline-block bg-brand px-2 py-1 text-[clamp(0.7rem,1.8vw,1.75rem)] md:mb-2">
                                {banner.subtitle}
                            </span>
                        )}
                        {banner.highlight && (
                            <span className="block text-[clamp(2rem,7.5vw,7.5rem)]">{banner.highlight}</span>
                        )}
                    </p>
                )}
            </BannerLink>
        </section>
    );
}
