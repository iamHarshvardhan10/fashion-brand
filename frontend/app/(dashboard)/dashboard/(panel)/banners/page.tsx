import type { Metadata } from "next";
import PageHeading from "@/components/core/dashboard/PageHeading";
import BannerManager from "@/components/core/dashboard/banners/BannerManager";
import { bannerSlots, slotPlacements } from "@/lib/banner-slots";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
    title: "Banners",
};

export default function BannersPage() {
    return (
        <>
            <PageHeading
                eyebrow="Storefront"
                title="Banners"
                description="Everything promotional on the home page. Replace images and copy, schedule campaigns, or switch a banner off to hide its section."
                actions={null}
            />
            <Tabs defaultValue={slotPlacements[0]} className="gap-4">
                <TabsList variant="line" className="w-auto justify-start overflow-x-auto [scrollbar-width:none]">
                    {slotPlacements.map((placement) => (
                        <TabsTrigger
                            key={placement}
                            value={placement}
                            className="flex-none px-3 font-mono text-xs tracking-wider uppercase"
                        >
                            {bannerSlots[placement].tab}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {slotPlacements.map((placement) => (
                    <TabsContent key={placement} value={placement}>
                        <BannerManager placement={placement} />
                    </TabsContent>
                ))}
            </Tabs>
        </>
    );
}
