import BestsellersBanner from "@/components/home/BestsellersBanner";
import EditGrid from "@/components/home/EditGrid";
import Hero from "@/components/home/Hero";
import NewArrivals from "@/components/home/NewArrivals";
import PriceDropBanner from "@/components/home/PriceDropBanner";
import ShopByCategory from "@/components/home/ShopByCategory";
import ShopItBanner from "@/components/home/ShopItBanner";
import TrendingCarousel from "@/components/home/TrendingCarousel";
import VibeGrid from "@/components/home/VibeGrid";

export default function Home() {
    return (
        <main>
            <Hero />
            <ShopByCategory />
            <BestsellersBanner />
            <EditGrid />
            <ShopItBanner />
            <NewArrivals />
            <PriceDropBanner />
            <VibeGrid />
            <TrendingCarousel />
        </main>
    );
}
