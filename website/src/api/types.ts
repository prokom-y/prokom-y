export interface Profile {
    bio: string | null;
    avatar_url: string | null;
    followers_count: number;
    following_count: number;
    created_at: string;
}

export interface AuthUser {
    id: number;
    username: string;
    email: string;
    profile: Profile;
}

export interface PublicUser {
    id: number;
    username: string;
    profile: Profile;
}

export interface PostAuthor {
    id: number;
    username: string;
}

export interface Post {
    id: number;
    author: PostAuthor;
    content: string;
    created_at: string;
    updated_at: string;
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
}

export interface Comment {
    id: number;
    author: PostAuthor;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface TokenPair {
    access: string;
    refresh: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
