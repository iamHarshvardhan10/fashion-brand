import Link from "next/link";
import { HeartIcon } from "lucide-react";
import { formatPrice, type Product } from "@/lib/home-data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ImageBox from "@/components/home/ImageBox";

export default function ProductCard({ product, className }: { product: Product; className?: string }) {
    const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);

    return (
        <article className={cn("group relative", className)}>
            <Link href={`/product/${product.id}`} className="block">
                <ImageBox
                    src={product.image}
                    alt={product.name}
                    className="aspect-[3/4] bg-neutral-100 transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="mt-3 space-y-1">
                    <h3 className="truncate text-sm">{product.name}</h3>
                    <p className="flex items-baseline gap-2 font-mono text-sm">
                        <span className="font-semibold">{formatPrice(product.price)}</span>
                        <span className="text-xs text-neutral-500 line-through">{formatPrice(product.mrp)}</span>
                        <span className="text-xs font-semibold text-brand">{discount}% off</span>
                    </p>
                </div>
            </Link>

            {product.tag && (
                <Badge className="absolute top-2 left-2 rounded-none bg-neutral-950 font-mono text-[10px] tracking-widest text-cream uppercase">
                    {product.tag}
                </Badge>
            )}
            {/* TODO: wire up to the watchlist */}
            <Button
                variant="ghost"
                size="icon"
                aria-label={`Add ${product.name} to watchlist`}
                className="absolute top-1.5 right-1.5 rounded-full bg-white/80 backdrop-blur hover:bg-white"
            >
                <HeartIcon />
            </Button>
        </article>
    );
}
