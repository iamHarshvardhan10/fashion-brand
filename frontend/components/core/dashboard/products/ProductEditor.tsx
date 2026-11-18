"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { fetchProduct, type Product } from "@/services/operations/productAPI";
import { errorMessage } from "@/utils/apiError";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductForm from "./ProductForm";

// Loads the product named in the URL and hands it to the form
export default function ProductEditor() {
    const { id } = useParams<{ id: string }>();
    const notice = useSearchParams().get("notice");
    const [product, setProduct] = useState<Product | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetchProduct(id)
            .then((p) => !cancelled && setProduct(p))
            .catch((err) => !cancelled && setError(errorMessage(err, "Could not load this product")));
        return () => {
            cancelled = true;
        };
    }, [id]);

    if (error) {
        return (
            <div className="flex flex-col items-center gap-3 border border-dashed px-6 py-16 text-center">
                <p className="font-display text-2xl font-black uppercase font-stretch-75%">{error}</p>
                <Button variant="outline" render={<Link href="/dashboard/products" />} nativeButton={false}>
                    Back to products
                </Button>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-64 rounded-none" />
                    ))}
                </div>
                <Skeleton className="h-96 rounded-none" />
            </div>
        );
    }

    return <ProductForm key={product.id} product={product} initialNotice={notice} />;
}
