import type { Metadata } from "next";
import ProductForm from "@/components/core/dashboard/products/ProductForm";

export const metadata: Metadata = {
    title: "New product",
};

export default function NewProductPage() {
    return <ProductForm />;
}
