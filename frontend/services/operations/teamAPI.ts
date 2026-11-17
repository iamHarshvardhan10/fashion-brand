import type { Role } from "@/lib/access";
import { teamEndpoints } from "../api";
import { apiConnector } from "../apiConnector";

const { USERS_API, USER_DETAILS_API } = teamEndpoints;

export type StaffRole = Extract<Role, "SUPER_ADMIN" | "ADMIN">;

export type TeamMember = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
    status: "ACTIVE" | "SUSPENDED";
    lastLoginAt: string | null;
    createdAt: string;
};

export type NewTeamMember = { name: string; email: string; password: string; role: StaffRole };
export type TeamMemberUpdate = { role?: StaffRole; status?: "ACTIVE" | "SUSPENDED" };

// Super admin only
export async function fetchTeam() {
    const response = await apiConnector<TeamMember[]>("GET", USERS_API, undefined, undefined, { staffOnly: true });
    return response.data.data;
}

export async function createTeamMember(data: NewTeamMember) {
    const response = await apiConnector<TeamMember>("POST", USERS_API, data);
    return response.data.data;
}

export async function updateTeamMember(id: string, data: TeamMemberUpdate) {
    const response = await apiConnector<TeamMember>("PATCH", USER_DETAILS_API(id), data);
    return response.data.data;
}
