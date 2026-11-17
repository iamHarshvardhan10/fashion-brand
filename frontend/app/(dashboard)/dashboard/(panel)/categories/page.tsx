import type { Metadata } from "next";
import PageHeading from "@/components/core/dashboard/PageHeading";
import CategoryManager from "@/components/core/dashboard/categories/CategoryManager";

export const metadata: Metadata = {
    title: "Categories",
};

export default function CategoriesPage() {
    return (
        <>
            <PageHeading
                eyebrow="Catalog"
                title="Categories"
                description="Organise the store into categories and sub-categories. Hidden ones stay saved but don't appear on the storefront."
                actions={null}
            />
            <CategoryManager />
        </>
    );
}
