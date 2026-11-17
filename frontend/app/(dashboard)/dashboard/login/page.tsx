import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { site } from "@/lib/site";
import LoginForm from "@/components/core/dashboard/auth/LoginForm";

export const metadata: Metadata = {
    title: "Sign in · Dashboard",
    robots: { index: false, follow: false },
};

const portals = [
    { label: "Super admins", text: "Run the whole store and decide who's on the team." },
    { label: "Admins", text: "Manage the catalog, orders and customers." },
];

// Lives outside the (panel) group, so it has no sidebar and no auth guard.
export default function LoginPage() {
    return (
        <main className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
            {/* Brand panel */}
            <section className="relative hidden flex-col justify-between overflow-hidden bg-neutral-950 p-10 text-cream lg:flex">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-24 -bottom-24 font-display text-[22rem] leading-none font-black text-cream/[0.04] uppercase font-stretch-75% select-none"
                >
                    {site.name.charAt(0)}
                </div>

                <Link href="/" className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center bg-brand font-display font-black uppercase">
                        {site.name.charAt(0)}
                    </span>
                    <span className="font-display text-xl font-black tracking-tight uppercase font-stretch-75%">
                        {site.name}
                    </span>
                </Link>

                <div className="relative max-w-lg">
                    <p className="mb-4 font-mono text-xs tracking-[0.25em] text-brand uppercase">Dashboard</p>
                    <h1 className="font-display text-7xl leading-[0.85] font-black tracking-tight uppercase font-stretch-75%">
                        Back of
                        <br />
                        house.
                    </h1>
                    <dl className="mt-10 grid gap-6 border-t border-cream/15 pt-8 sm:grid-cols-2">
                        {portals.map((p) => (
                            <div key={p.label}>
                                <dt className="font-mono text-[11px] tracking-[0.2em] text-cream/50 uppercase">{p.label}</dt>
                                <dd className="mt-2 text-sm leading-relaxed text-cream/80">{p.text}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <p className="font-mono text-[10px] tracking-[0.2em] text-cream/40 uppercase">
                    Authorised access only · Activity is logged
                </p>
            </section>

            {/* Form */}
            <section className="flex flex-col px-6 py-8 sm:px-12">
                <Link
                    href="/"
                    className="flex items-center gap-2 self-start font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase hover:text-foreground"
                >
                    <ArrowLeftIcon className="size-3.5" />
                    Back to store
                </Link>

                <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
                    <p className="mb-2 font-mono text-xs tracking-[0.2em] text-brand uppercase">Welcome back</p>
                    <h2 className="font-display text-5xl leading-none font-black tracking-tight uppercase font-stretch-75%">
                        Sign in
                    </h2>
                    <p className="mt-3 mb-8 text-sm text-muted-foreground">
                        For {site.name} staff only.
                    </p>

                    <Suspense>
                        <LoginForm />
                    </Suspense>
                </div>
            </section>
        </main>
    );
}
