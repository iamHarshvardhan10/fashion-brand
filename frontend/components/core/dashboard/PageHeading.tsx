import { CalendarIcon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type PageHeadingProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    // Replaces the default date-range/export buttons; pass null to show none
    actions?: React.ReactNode;
};

// Mirrors the storefront SectionHeading: mono eyebrow in brand, condensed display title.
export default function PageHeading({ eyebrow, title, description, actions }: PageHeadingProps) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
                {eyebrow && (
                    <p className="mb-2 font-mono text-xs tracking-[0.2em] text-brand uppercase">{eyebrow}</p>
                )}
                <h1 className="font-display text-4xl leading-none font-black tracking-tight uppercase font-stretch-75% md:text-5xl">
                    {title}
                </h1>
                {description && <p className="mt-3 max-w-xl text-sm text-muted-foreground">{description}</p>}
            </div>
            {actions !== undefined ? (
                actions && <div className="flex items-center gap-2">{actions}</div>
            ) : (
            <div className="flex items-center gap-2">
                {/* TODO: date range picker */}
                <Button variant="outline" size="lg" className="bg-card font-mono text-xs tracking-wider uppercase">
                    <CalendarIcon />
                    Last 30 days
                </Button>
                <Button size="lg" className="font-mono text-xs tracking-wider uppercase">
                    <DownloadIcon />
                    Export
                </Button>
            </div>
            )}
        </div>
    );
}
