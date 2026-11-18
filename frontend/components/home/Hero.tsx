import HeroCarousel from "@/components/home/HeroCarousel";
import { getBanners } from "@/lib/banners";

export default async function Hero() {
    const banners = await getBanners("HERO");
    if (!banners.length) return null;

    return (
        <section className="h-[calc(100svh-var(--header-height))]">
            <HeroCarousel banners={banners} />
        </section>
    );
}
