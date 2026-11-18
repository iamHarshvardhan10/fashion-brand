import type { Metadata } from "next";
import PageHeading from "@/components/core/dashboard/PageHeading";
import CollectionManager from "@/components/core/dashboard/collections/CollectionManager";
import { collectionTypes, managedCollectionTypes } from "@/components/core/dashboard/collections/collection-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
    title: "Collections",
};

export default function CollectionsPage() {
    return (
        <>
            <PageHeading
                eyebrow="Storefront"
                title="Collections"
                description="Curated edits and “shop by vibe” groups on the home page. Each one has a card image, a title and the products shoppers see when they open it."
                actions={null}
            />
            <Tabs defaultValue={managedCollectionTypes[0]} className="gap-4">
                <TabsList variant="line" className="w-auto justify-start">
                    {managedCollectionTypes.map((type) => (
                        <TabsTrigger key={type} value={type} className="flex-none px-3 font-mono text-xs tracking-wider uppercase">
                            {collectionTypes[type].tab}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {managedCollectionTypes.map((type) => (
                    <TabsContent key={type} value={type}>
                        <CollectionManager type={type} />
                    </TabsContent>
                ))}
            </Tabs>
        </>
    );
}
