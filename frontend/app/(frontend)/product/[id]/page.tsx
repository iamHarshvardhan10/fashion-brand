import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/lib/home-data";
import { getProductDetail, getRelatedProducts } from "@/lib/product-data";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import ProductCard from "@/components/home/ProductCard";
import SectionHeading from "@/components/home/SectionHeading";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";

export function generateStaticParams() {
    return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/product/[id]">): Promise<Metadata> {
    const { id } = await params;
    const product = getProductDetail(id);
    return product ? { title: product.name, description: product.description } : {};
}

export default async function ProductPage({ params }: PageProps<"/product/[id]">) {
    const { id } = await params;
    const product = getProductDetail(id);
    if (!product) notFound();

    const related = getRelatedProducts(product);

    return (
        <main className="flex-1">
            <div className="px-4 pt-4 md:px-8">
                <Breadcrumb>
                    <BreadcrumbList className="font-mono text-[11px] tracking-wider uppercase">
                        <BreadcrumbItem>
                            <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink render={<Link href={product.categoryHref} />}>
                                {product.categoryLabel}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-neutral-950">{product.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <section className="grid gap-8 px-4 py-6 md:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
                <ProductGallery images={product.images} name={product.name} />
                <div className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
                    <ProductInfo product={product} />
                </div>
            </section>

            <section className="px-4 py-12 md:px-8 md:py-16">
                <SectionHeading eyebrow="Complete the fit" title="You may also like" href={product.categoryHref} />
                <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 lg:gap-x-5">
                    {related.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </section>
        </main>
    );
}
