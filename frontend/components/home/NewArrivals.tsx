"use client";

import { products, productTabs } from "@/lib/home-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/home/ProductCard";
import SectionHeading from "@/components/home/SectionHeading";

export default function NewArrivals() {
    return (
        <section className="px-4 py-12 md:px-8 md:py-16">
            <SectionHeading eyebrow="Just landed" title="New arrivals" href="/new-in" />

            <Tabs defaultValue="all" className="gap-6">
                <TabsList variant="line" className="-mx-4 w-auto justify-start overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
                    {productTabs.map((tab) => (
                        <TabsTrigger
                            key={tab.value}
                            value={tab.value}
                            className="flex-none px-3 font-mono text-xs tracking-[0.15em] uppercase after:bg-brand"
                        >
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {productTabs.map((tab) => {
                    const list = products
                        .filter((product) => tab.value === "all" || product.category === tab.value)
                        .slice(0, 8);
                    return (
                        <TabsContent key={tab.value} value={tab.value}>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
                                {list.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </section>
    );
}
