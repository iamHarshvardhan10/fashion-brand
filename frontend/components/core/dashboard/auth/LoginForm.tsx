"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRightIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { useAppDispatch } from "@/hooks/redux";
import { safeNextPath } from "@/lib/access";
import { login } from "@/services/operations/authAPI";
import { errorMessage } from "@/utils/apiError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginForm() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        if (!email.trim() || !password) {
            setError("Enter your email and password");
            return;
        }

        setSubmitting(true);
        try {
            await dispatch(login(email.trim(), password));
            router.replace(safeNextPath(searchParams.get("next")));
            router.refresh();
        } catch (err) {
            setError(errorMessage(err, "Could not sign in, please try again"));
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="grid gap-5">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbrand.com"
                    className="h-11 rounded-none bg-card"
                    aria-invalid={Boolean(error)}
                    autoFocus
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 rounded-none bg-card pr-11"
                        aria-invalid={Boolean(error)}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute top-1/2 right-1.5 -translate-y-1/2"
                    >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </Button>
                </div>
            </div>

            {error && (
                <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                </p>
            )}

            <Button
                type="submit"
                disabled={submitting}
                className="group h-12 rounded-none font-mono text-xs tracking-[0.2em] uppercase"
            >
                {submitting ? <Loader2Icon className="animate-spin" /> : null}
                Sign in
                {!submitting && <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />}
            </Button>

            <p className="text-xs text-muted-foreground">
                Forgot your password? Ask a super admin to reset it for you.
            </p>
        </form>
    );
}
