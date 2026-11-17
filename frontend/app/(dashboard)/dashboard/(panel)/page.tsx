import CategoryChart from "@/components/core/dashboard/CategoryChart";
import LowStock from "@/components/core/dashboard/LowStock";
import PageHeading from "@/components/core/dashboard/PageHeading";
import RecentOrders from "@/components/core/dashboard/RecentOrders";
import RevenueChart from "@/components/core/dashboard/RevenueChart";
import StatCards from "@/components/core/dashboard/StatCards";
import TopProducts from "@/components/core/dashboard/TopProducts";
// Whole-store view for super admins and admins
export default function DashboardPage() {
    return (
        <>
            <PageHeading eyebrow="Overview" title="Dashboard" />
            <StatCards />
            <div className="grid gap-6 xl:grid-cols-3">
                <RevenueChart className="xl:col-span-2" />
                <CategoryChart />
            </div>
            <div className="grid gap-6 xl:grid-cols-3">
                <RecentOrders className="xl:col-span-2" />
                <div className="flex flex-col gap-6">
                    <TopProducts />
                    <LowStock />
                </div>
            </div>
        </>
    );
}
