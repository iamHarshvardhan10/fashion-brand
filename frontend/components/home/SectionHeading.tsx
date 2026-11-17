import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
    eyebrow?: string;
    title: string;
    href?: string;
    className?: string;
    children?: React.ReactNode;
};

export default function SectionHeading({ eyebrow, title, href, className, children }: SectionHeadingProps) {
    return (
        <div className={cn("mb-6 flex items-end justify-between gap-4 md:mb-8", className)}>
            <div>
                {eyebrow && (
                    <p className="mb-2 font-mono text-xs tracking-[0.2em] text-brand uppercase">{eyebrow}</p>
                )}
                <h2 className="font-display text-4xl leading-none font-black tracking-tight uppercase font-stretch-75% md:text-6xl">
                    {title}
                </h2>
            </div>
            {children}
            {href && (
                <Link
                    href={href}
                    className="group flex shrink-0 items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase underline-offset-8 hover:underline"
                >
                    View all
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
            )}
        </div>
    );
}
