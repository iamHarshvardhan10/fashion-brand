import HeroCarousel from "@/components/home/HeroCarousel";

export default function Hero() {
    return (
        <section className="h-[calc(100svh-var(--header-height))]">
            <HeroCarousel />
        </section>
    );
}
