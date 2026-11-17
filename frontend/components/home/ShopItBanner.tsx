import Image from "next/image";
import Link from "next/link";

export default function ShopItBanner() {
    return (
        <section className="px-4 pt-12 md:px-8 md:pt-16">
            <Link href="/under-999" className="group relative block overflow-hidden bg-neutral-900">
                <Image
                    src="/banners/shop-it-save-it.jpg"
                    alt="Model in sunglasses and a brick overshirt"
                    width={1800}
                    height={600}
                    sizes="100vw"
                    className="aspect-[2.4/1] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02] md:aspect-[3/1]"
                />
                {/* Darken the edges so the cream type stays readable */}
                <div className="absolute inset-0 bg-linear-to-r from-black/40 via-transparent to-black/40" />

                <h2 className="absolute top-1/2 left-[4%] -translate-y-1/2 -rotate-6 font-display leading-[0.85] font-black text-cream uppercase font-stretch-75%">
                    <span className="block text-[clamp(1.25rem,4vw,4rem)]">Shop it</span>
                    <span className="block text-[clamp(2rem,7.5vw,7.5rem)]">Save it</span>
                </h2>

                <p className="absolute top-1/2 right-[4%] -translate-y-1/2 text-right font-display leading-[0.85] font-black text-cream uppercase font-stretch-75%">
                    <span className="mb-1 inline-block bg-brand px-2 py-1 text-[clamp(0.7rem,1.8vw,1.75rem)] md:mb-2">
                        Collection under
                    </span>
                    <span className="block text-[clamp(2rem,7.5vw,7.5rem)]">₹999/-</span>
                </p>
            </Link>
        </section>
    );
}
