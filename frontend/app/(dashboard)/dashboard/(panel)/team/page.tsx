import type { Metadata } from "next";
import PageHeading from "@/components/core/dashboard/PageHeading";
import TeamManager from "@/components/core/dashboard/team/TeamManager";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
    return (
        <>
            <PageHeading
                eyebrow="Marketplace"
                title="Team"
                description="Super admins decide who can run the store. Admins manage the catalog; only super admins can manage the team."
                actions={null}
            />
            <TeamManager />
        </>
    );
}
