"use client";

import * as React from "react";
import Link from "next/link";
import { DROP_ENDS_AT } from "@/lib/home-data";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const target = new Date(DROP_ENDS_AT).getTime();

function useNow() {
    // null until mounted, so the server and first client render match
    const [now, setNow] = React.useState<number | null>(null);
    React.useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        const first = setTimeout(() => setNow(Date.now()), 0);
        return () => {
            clearInterval(id);
            clearTimeout(first);
        };
    }, []);
    return now;
}

export default function DropCountdown() {
    const now = useNow();
    const remaining = now === null ? null : Math.max(0, target - now);

    const units = [
        { label: "Days", value: remaining === null ? null : Math.floor(remaining / 86_400_000) },
        { label: "Hours", value: remaining === null ? null : Math.floor(remaining / 3_600_000) % 24 },
        { label: "Mins", value: remaining === null ? null : Math.floor(remaining / 60_000) % 60 },
        { label: "Secs", value: remaining === null ? null : Math.floor(remaining / 1000) % 60 },
    ];

    return (
        <section className="bg-brand px-4 py-12 text-cream md:px-8 md:py-16">
            <div className="flex flex-col items-center gap-8 text-center lg:flex-row lg:justify-between lg:text-left">
                <div>
                    <p className="mb-2 font-mono text-xs tracking-[0.2em] uppercase opacity-80">Limited drop · Once it&rsquo;s gone, it&rsquo;s gone</p>
                    <h2 className="font-display text-5xl leading-none font-black uppercase font-stretch-75% md:text-7xl">
                        {remaining === 0 ? "The drop is live" : "Drop 02 ends in"}
                    </h2>
                </div>

                {remaining !== 0 && (
                    <ol className="flex gap-2 md:gap-3" aria-live="off">
                        {units.map((unit) => (
                            <li key={unit.label} className="flex w-18 flex-col items-center bg-neutral-950 py-3 md:w-24">
                                <span className="font-display text-4xl font-black tabular-nums md:text-5xl">
                                    {unit.value === null ? "--" : String(unit.value).padStart(2, "0")}
                                </span>
                                <span className="font-mono text-[10px] tracking-[0.2em] uppercase opacity-70">{unit.label}</span>
                            </li>
                        ))}
                    </ol>
                )}

                <Link
                    href="/new-in"
                    className={cn(
                        buttonVariants({ size: "lg" }),
                        "h-12 rounded-none bg-cream px-8 font-mono text-xs tracking-[0.2em] text-neutral-950 uppercase hover:bg-white"
                    )}
                >
                    Shop the drop
                </Link>
            </div>
        </section>
    );
}
