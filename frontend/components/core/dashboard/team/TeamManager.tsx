"use client";

import { useEffect, useState } from "react";
import {
    EyeIcon,
    EyeOffIcon,
    Loader2Icon,
    MoreHorizontalIcon,
    PauseIcon,
    PlayIcon,
    ShieldCheckIcon,
    ShieldIcon,
    UserPlusIcon,
} from "lucide-react";
import { roleLabels } from "@/lib/access";
import {
    createTeamMember,
    fetchTeam,
    updateTeamMember,
    type StaffRole,
    type TeamMember,
} from "@/services/operations/teamAPI";
import { ApiError } from "@/utils/apiError";
import { formatDate } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/core/dashboard/auth/AuthProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const roleInfo: Record<StaffRole, { icon: typeof ShieldIcon; text: string }> = {
    SUPER_ADMIN: { icon: ShieldCheckIcon, text: "Everything, including managing the team" },
    ADMIN: { icon: ShieldIcon, text: "Catalog, orders and customers" },
};

export default function TeamManager() {
    const { user: me } = useAuth();
    const [members, setMembers] = useState<TeamMember[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [addKey, setAddKey] = useState(0);

    async function reload() {
        try {
            setMembers(await fetchTeam());
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not load the team");
        }
    }

    useEffect(() => {
        let cancelled = false;
        fetchTeam()
            .then((m) => !cancelled && setMembers(m))
            .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "Could not load the team"));
        return () => {
            cancelled = true;
        };
    }, []);

    async function update(member: TeamMember, data: Parameters<typeof updateTeamMember>[1]) {
        setBusyId(member.id);
        setActionError(null);
        try {
            const updated = await updateTeamMember(member.id, data);
            setMembers((list) => list?.map((m) => (m.id === updated.id ? updated : m)) ?? null);
        } catch (err) {
            setActionError(err instanceof ApiError ? err.message : "Could not update team member");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <>
            <Card className="rounded-none">
                <CardHeader>
                    <CardTitle className="font-display text-2xl font-black tracking-tight uppercase font-stretch-75%">
                        Staff accounts
                    </CardTitle>
                    <CardDescription>
                        Only people listed here can sign in to the dashboard.
                    </CardDescription>
                    <CardAction>
                        <Button
                            size="lg"
                            onClick={() => {
                                setAddKey((k) => k + 1);
                                setAddOpen(true);
                            }}
                            className="font-mono text-xs tracking-wider uppercase"
                        >
                            <UserPlusIcon />
                            Add member
                        </Button>
                    </CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                    {actionError && (
                        <p role="alert" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            {actionError}
                        </p>
                    )}
                    {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                    ) : !members ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-none" />
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="font-mono text-[11px] tracking-[0.15em] uppercase">
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                                    <TableHead className="hidden md:table-cell">Last sign-in</TableHead>
                                    <TableHead className="w-12 text-right">
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((m) => {
                                    const isMe = m.id === me.id;
                                    const RoleIcon = roleInfo[m.role as StaffRole]?.icon ?? ShieldIcon;
                                    return (
                                        <TableRow key={m.id} className={cn(m.status === "SUSPENDED" && "text-muted-foreground")}>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {m.name}
                                                    {isMe && (
                                                        <span className="ml-2 font-mono text-[10px] tracking-widest text-brand uppercase">You</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{m.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1.5 text-sm">
                                                    <RoleIcon className="size-4" />
                                                    {roleLabels[m.role]}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge
                                                    className={cn(
                                                        "rounded-none font-mono text-[10px] tracking-widest uppercase",
                                                        m.status === "ACTIVE" ? "bg-emerald-100 text-emerald-900" : "bg-neutral-200 text-neutral-700",
                                                    )}
                                                >
                                                    {m.status === "ACTIVE" ? "Active" : "Suspended"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden text-muted-foreground md:table-cell">
                                                {m.lastLoginAt ? formatDate(m.lastLoginAt, true) : "Never"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isMe ? null : busyId === m.id ? (
                                                    <Loader2Icon className="ml-auto size-4 animate-spin" />
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.name}`} />}
                                                        >
                                                            <MoreHorizontalIcon />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="min-w-48">
                                                            {m.role === "ADMIN" ? (
                                                                <DropdownMenuItem onClick={() => update(m, { role: "SUPER_ADMIN" })}>
                                                                    <ShieldCheckIcon />
                                                                    Make super admin
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => update(m, { role: "ADMIN" })}>
                                                                    <ShieldIcon />
                                                                    Make admin
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            {m.status === "ACTIVE" ? (
                                                                <DropdownMenuItem variant="destructive" onClick={() => update(m, { status: "SUSPENDED" })}>
                                                                    <PauseIcon />
                                                                    Suspend access
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => update(m, { status: "ACTIVE" })}>
                                                                    <PlayIcon />
                                                                    Reactivate
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AddMemberDialog key={addKey} open={addOpen} onOpenChange={setAddOpen} onCreated={reload} />
        </>
    );
}

function AddMemberDialog({
    open,
    onOpenChange,
    onCreated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated: () => Promise<void>;
}) {
    const [values, setValues] = useState({ name: "", email: "", password: "", role: "ADMIN" as StaffRole });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const set = (field: keyof typeof values, value: string) => {
        setValues((v) => ({ ...v, [field]: value }));
        setErrors((e) => ({ ...e, [field]: "" }));
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError(null);
        setSubmitting(true);
        try {
            await createTeamMember({ ...values, email: values.email.trim(), name: values.name.trim() });
            await onCreated();
            onOpenChange(false);
        } catch (err) {
            if (err instanceof ApiError) {
                setErrors(err.fieldErrors());
                setFormError(err.message === "Validation failed" ? "Please fix the highlighted fields" : err.message);
            } else setFormError("Could not add team member");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
            <DialogContent className="rounded-none sm:max-w-md">
                <form onSubmit={handleSubmit} noValidate className="grid gap-5">
                    <DialogHeader>
                        <p className="font-mono text-[10px] tracking-[0.2em] text-brand uppercase">Team</p>
                        <DialogTitle className="font-display text-3xl font-black tracking-tight uppercase font-stretch-75%">
                            Add member
                        </DialogTitle>
                        <DialogDescription>
                            Share the temporary password with them securely and ask them to change it after signing in.
                        </DialogDescription>
                    </DialogHeader>

                    {(["name", "email"] as const).map((f) => (
                        <div key={f} className="grid gap-2">
                            <Label htmlFor={`tm-${f}`}>{f === "name" ? "Full name" : "Work email"}</Label>
                            <Input
                                id={`tm-${f}`}
                                type={f === "email" ? "email" : "text"}
                                value={values[f]}
                                onChange={(e) => set(f, e.target.value)}
                                aria-invalid={Boolean(errors[f])}
                                autoFocus={f === "name"}
                            />
                            {errors[f] && <p className="text-xs text-destructive">{errors[f]}</p>}
                        </div>
                    ))}

                    <div className="grid gap-2">
                        <Label htmlFor="tm-password">Temporary password</Label>
                        <div className="relative">
                            <Input
                                id="tm-password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={values.password}
                                onChange={(e) => set("password", e.target.value)}
                                aria-invalid={Boolean(errors.password)}
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute top-1/2 right-1 -translate-y-1/2"
                            >
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </Button>
                        </div>
                        {errors.password ? (
                            <p className="text-xs text-destructive">{errors.password}</p>
                        ) : (
                            <p className="text-xs text-muted-foreground">8+ characters with a letter and a number</p>
                        )}
                    </div>

                    <fieldset className="grid gap-2">
                        <legend className="mb-2 text-sm font-medium">Role</legend>
                        {(Object.keys(roleInfo) as StaffRole[]).map((role) => {
                            const Icon = roleInfo[role].icon;
                            return (
                                <label
                                    key={role}
                                    className={cn(
                                        "flex cursor-pointer items-start gap-3 border p-3 transition-colors",
                                        values.role === role ? "border-neutral-950 bg-muted/50" : "hover:bg-muted/30",
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role}
                                        checked={values.role === role}
                                        onChange={() => set("role", role)}
                                        className="mt-1 accent-brand"
                                    />
                                    <span>
                                        <span className="flex items-center gap-1.5 text-sm font-medium">
                                            <Icon className="size-4" />
                                            {roleLabels[role]}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{roleInfo[role].text}</span>
                                    </span>
                                </label>
                            );
                        })}
                    </fieldset>

                    {formError && (
                        <p role="alert" className="text-sm text-destructive">
                            {formError}
                        </p>
                    )}

                    <DialogFooter className="rounded-none">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                            className="font-mono text-xs tracking-wider uppercase"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting} className="font-mono text-xs tracking-wider uppercase">
                            {submitting && <Loader2Icon className="animate-spin" />}
                            Add member
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
