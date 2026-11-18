import { Suspense } from "react";
import type { Metadata } from "next";
import ProductEditor from "@/components/core/dashboard/products/ProductEditor";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
    title: "Edit product",
};

// The id and notice are read on the client (useParams/useSearchParams), so the page stays a static shell
export default function EditProductPage() {
    return (
        <Suspense fallback={<Skeleton className="h-96 rounded-none" />}>
            <ProductEditor />
        </Suspense>
    );
}
