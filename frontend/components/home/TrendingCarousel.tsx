"use client";

import { products } from "@/lib/home-data";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ProductCard from "@/components/home/ProductCard";
import SectionHeading from "@/components/home/SectionHeading";

// Bestsellers first, then everything else
const trending = [...products].sort((a, b) => Number(b.tag === "Bestseller") - Number(a.tag === "Bestseller"));

export default function TrendingCarousel() {
    return (
        <section className="overflow-hidden px-4 py-12 md:px-8 md:py-16">
            <Carousel opts={{ align: "start", duration: 35 }}>
                <SectionHeading eyebrow="Everyone's adding these" title="Trending now">
                    <div className="ml-auto hidden gap-2 md:flex">
                        <CarouselPrevious className="static size-10 translate-none rounded-none" />
                        <CarouselNext className="static size-10 translate-none rounded-none" />
                    </div>
                </SectionHeading>
                <CarouselContent className="-ml-3 lg:-ml-5">
                    {trending.map((product) => (
                        <CarouselItem key={product.id} className="basis-[45%] pl-3 md:basis-1/3 lg:basis-1/4 lg:pl-5">
                            <ProductCard product={product} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>
    );
}
