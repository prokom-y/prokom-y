import client from "./client";
import type { Post, Comment, PaginatedResponse } from "./types";

export async function getPosts(params?: { author?: string }): Promise<PaginatedResponse<Post>> {
    const { data } = await client.get<PaginatedResponse<Post>>("/posts", { params });
    return data;
}

export async function getFeed(): Promise<PaginatedResponse<Post>> {
    const { data } = await client.get<PaginatedResponse<Post>>("/posts/feed");
    return data;
}

export async function searchPosts(q: string): Promise<PaginatedResponse<Post>> {
    const { data } = await client.get<PaginatedResponse<Post>>("/posts/search", { params: { q } });
    return data;
}

export async function getPost(id: number): Promise<Post> {
    const { data } = await client.get<Post>(`/posts/${id}`);
    return data;
}

export async function createPost(content: string): Promise<Post> {
    const { data } = await client.post<Post>("/posts", { content });
    return data;
}

export async function updatePost(id: number, content: string): Promise<Post> {
    const { data } = await client.patch<Post>(`/posts/${id}`, { content });
    return data;
}

export async function deletePost(id: number): Promise<void> {
    await client.delete(`/posts/${id}`);
}

export async function likePost(id: number): Promise<void> {
    await client.post(`/posts/${id}/like`);
}

export async function unlikePost(id: number): Promise<void> {
    await client.delete(`/posts/${id}/like`);
}

export async function getComments(postId: number): Promise<PaginatedResponse<Comment>> {
    const { data } = await client.get<PaginatedResponse<Comment>>(`/posts/${postId}/comments`);
    return data;
}

export async function createComment(postId: number, content: string): Promise<Comment> {
    const { data } = await client.post<Comment>(`/posts/${postId}/comments`, { content });
    return data;
}

export async function updateComment(
    postId: number,
    commentId: number,
    content: string,
): Promise<Comment> {
    const { data } = await client.patch<Comment>(`/posts/${postId}/comments/${commentId}`, {
        content,
    });
    return data;
}

export async function deleteComment(postId: number, commentId: number): Promise<void> {
    await client.delete(`/posts/${postId}/comments/${commentId}`);
}
