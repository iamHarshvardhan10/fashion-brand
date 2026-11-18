import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import PageHeading from "@/components/core/dashboard/PageHeading";
import ProductList from "@/components/core/dashboard/products/ProductList";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Products",
};

export default function ProductsPage() {
    return (
        <>
            <PageHeading
                eyebrow="Catalog"
                title="Products"
                description="Everything you sell: photos, sizes and colours, stock, pricing, specs and the legal details shown on each product page."
                actions={
                    <Button size="lg" render={<Link href="/dashboard/products/new" />} nativeButton={false} className="font-mono text-xs tracking-wider uppercase">
                        <PlusIcon />
                        Add product
                    </Button>
                }
            />
            <ProductList />
        </>
    );
}
