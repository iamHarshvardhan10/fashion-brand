"use client";

import * as React from "react";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { sized } from "@/lib/cloudinary";
import type { Banner } from "@/services/operations/bannerAPI";

const AUTOPLAY_DELAY = 5000;

export default function HeroCarousel({ banners }: { banners: Banner[] }) {
    const [api, setApi] = React.useState<CarouselApi>();
    const [selected, setSelected] = React.useState(0);
    const multiple = banners.length > 1;
    // Slides advance on their own; hovering or focusing a slide pauses, leaving resumes.
    const [autoplay] = React.useState(() =>
        Autoplay({ delay: AUTOPLAY_DELAY, stopOnInteraction: false, stopOnMouseEnter: true })
    );

    React.useEffect(() => {
        if (!api) return;
        const onSelect = () => setSelected(api.selectedScrollSnap());
        onSelect();
        api.on("select", onSelect);
        api.on("reInit", onSelect);
        return () => {
            api.off("select", onSelect);
            api.off("reInit", onSelect);
        };
    }, [api]);

    return (
        <Carousel
            setApi={setApi}
            // Higher duration = slower, softer slide (Embla default is 25)
            opts={{ loop: multiple, duration: 45, watchDrag: multiple }}
            plugins={multiple ? [autoplay] : []}
            className="h-full min-h-0 min-w-0 overflow-hidden [&>[data-slot=carousel-content]]:h-full"
            aria-label="Featured collections"
        >
            <CarouselContent className="ml-0 h-full">
                {banners.map((banner, index) => {
                    const active = index === selected;
                    const Heading = index === 0 ? "h1" : "h2";
                    const words = banner.title.split(/\s+/).filter(Boolean);

                    return (
                        <CarouselItem
                            key={banner.id}
                            aria-label={`${index + 1} of ${banners.length}`}
                            className="relative isolate flex h-full flex-col justify-end overflow-hidden bg-neutral-900 p-5 md:p-8"
                        >
                            <picture className="absolute inset-0 -z-20">
                                {banner.mobileImageUrl && (
                                    <source media="(max-width: 767px)" srcSet={sized(banner.mobileImageUrl, 900)} />
                                )}
                                <img
                                    src={sized(banner.imageUrl, 2000)}
                                    alt=""
                                    className="size-full object-cover"
                                    loading={index === 0 ? "eager" : "lazy"}
                                    fetchPriority={index === 0 ? "high" : "auto"}
                                    decoding="async"
                                />
                            </picture>

                            {/* Darken the bottom so the headline stays readable over any photo */}
                            <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

                            {/* Text rises in once its slide has settled */}
                            <div
                                className={cn(
                                    "transition-all duration-700 ease-out motion-reduce:transition-none",
                                    active ? "translate-y-0 opacity-100 delay-300" : "translate-y-6 opacity-0"
                                )}
                            >
                                {banner.subtitle && (
                                    <p className="mb-3 font-mono text-sm tracking-[0.15em] text-cream uppercase md:text-lg">
                                        {banner.subtitle}
                                    </p>
                                )}
                                <Heading className="grid w-fit grid-cols-[auto_auto] gap-x-[0.35em] font-display text-[clamp(3.5rem,min(10vw,18svh),9.5rem)] leading-[0.85] font-black tracking-tight text-cream uppercase font-stretch-75%">
                                    {words.map((word, i) => (
                                        <span key={i}>{word}</span>
                                    ))}
                                </Heading>
                                {banner.ctaLabel && banner.linkUrl && (
                                    <Link
                                        href={banner.linkUrl}
                                        tabIndex={active ? undefined : -1}
                                        className={cn(
                                            buttonVariants({ size: "lg" }),
                                            "mt-6 rounded-none bg-cream px-6 font-mono text-xs tracking-[0.2em] text-neutral-950 uppercase hover:bg-white"
                                        )}
                                    >
                                        {banner.ctaLabel}
                                    </Link>
                                )}
                            </div>
                        </CarouselItem>
                    );
                })}
            </CarouselContent>

            {/* Slide indicators */}
            {multiple && (
                <div className="absolute right-5 bottom-5 z-10 flex gap-2 md:right-8 md:bottom-8">
                    {banners.map((banner, index) => (
                        <button
                            key={banner.id}
                            type="button"
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={index === selected}
                            onClick={() => {
                                api?.scrollTo(index);
                                autoplay.reset(); // full delay before the next auto-advance
                            }}
                            className={cn(
                                "h-1 rounded-full bg-cream/40 transition-all duration-500 ease-out hover:bg-cream/70",
                                index === selected ? "w-10 bg-cream" : "w-4"
                            )}
                        />
                    ))}
                </div>
            )}
        </Carousel>
    );
}
