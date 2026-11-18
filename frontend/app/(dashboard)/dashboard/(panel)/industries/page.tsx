import type { Metadata } from "next";
import PageHeading from "@/components/core/dashboard/PageHeading";
import IndustryManager from "@/components/core/dashboard/industries/IndustryManager";

export const metadata: Metadata = {
    title: "Industries",
};

export default function IndustriesPage() {
    return (
        <>
            <PageHeading
                eyebrow="Catalog"
                title="Industries"
                description="The top-level menus in the store navbar, like Men, Women and Kids. Each one lists the categories you pick, and products are assigned to one or more industries."
                actions={null}
            />
            <IndustryManager />
        </>
    );
}
