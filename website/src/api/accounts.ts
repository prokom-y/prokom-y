import client from "./client";
import type { AuthUser, PublicUser, PaginatedResponse } from "./types";

export async function getOwnProfile(): Promise<AuthUser> {
    const { data } = await client.get<AuthUser>("/accounts/profile");
    return data;
}

export async function updateProfile(fields: {
    bio?: string;
    avatar_url?: string;
}): Promise<AuthUser> {
    const { data } = await client.patch<AuthUser>("/accounts/profile", fields);
    return data;
}

export async function getPublicProfile(username: string): Promise<PublicUser> {
    const { data } = await client.get<PublicUser>(`/accounts/users/${username}`);
    return data;
}

export async function searchUsers(q: string): Promise<PaginatedResponse<PublicUser>> {
    const { data } = await client.get<PaginatedResponse<PublicUser>>("/accounts/users/search", {
        params: { q },
    });
    return data;
}

export async function getFollowers(username: string): Promise<PaginatedResponse<PublicUser>> {
    const { data } = await client.get<PaginatedResponse<PublicUser>>(
        `/accounts/users/${username}/followers`,
    );
    return data;
}

export async function getFollowing(username: string): Promise<PaginatedResponse<PublicUser>> {
    const { data } = await client.get<PaginatedResponse<PublicUser>>(
        `/accounts/users/${username}/following`,
    );
    return data;
}

export async function followUser(username: string): Promise<void> {
    await client.post(`/accounts/users/${username}/follow`);
}

export async function unfollowUser(username: string): Promise<void> {
    await client.delete(`/accounts/users/${username}/follow`);
}
