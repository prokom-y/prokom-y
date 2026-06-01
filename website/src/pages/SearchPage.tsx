import { useState, useEffect, useRef } from "preact/hooks";
import { useLocation } from "preact-iso";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UserCard from "@/components/UserCard";
import PostCard from "@/components/PostCard";
import { searchUsers } from "@/api/accounts";
import { searchPosts } from "@/api/posts";
import { usePagination } from "@/hooks/usePagination";
import type { PublicUser, Post } from "@/api/types";

type Tab = "users" | "posts";

const EMPTY_USERS = { count: 0, next: null, previous: null, results: [] as PublicUser[] };
const EMPTY_POSTS = { count: 0, next: null, previous: null, results: [] as Post[] };

export default function SearchPage() {
    const { query, route } = useLocation();
    const urlQ: string = (query as Record<string, string>).q ?? "";

    const [inputValue, setInputValue] = useState(urlQ);
    const [activeTab, setActiveTab] = useState<Tab>("users");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const skipSyncRef = useRef(false);

    // Sync input when URL changes externally (back/forward navigation).
    useEffect(() => {
        if (skipSyncRef.current) {
            skipSyncRef.current = false;
        } else {
            setInputValue(urlQ);
        }
    }, [urlQ]);

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    function handleInput(value: string) {
        setInputValue(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            skipSyncRef.current = true;
            const encoded = value.trim() ? `?q=${encodeURIComponent(value.trim())}` : "";
            route(`/search${encoded}`, true);
        }, 300);
    }

    const q = urlQ.trim();

    const {
        results: users,
        isLoading: usersLoading,
        nextUrl: usersNext,
        loadMore: loadMoreUsers,
    } = usePagination(() => (q ? searchUsers(q) : Promise.resolve(EMPTY_USERS)), [q]);

    const {
        results: posts,
        isLoading: postsLoading,
        nextUrl: postsNext,
        loadMore: loadMorePosts,
        replaceResult: replacePost,
        removeResult: removePost,
    } = usePagination(() => (q ? searchPosts(q) : Promise.resolve(EMPTY_POSTS)), [q]);

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-6 font-heading text-xl font-semibold">Search</h1>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Search users and posts…"
                    value={inputValue}
                    onInput={(e) => handleInput((e.target as HTMLInputElement).value)}
                    className="pl-9"
                    autoFocus
                />
            </div>

            {/* Tab bar */}
            <div className="mb-4 flex border-b border-border">
                {(["users", "posts"] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
                            activeTab === tab
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === "users" ? (
                <UsersPanel
                    users={users}
                    isLoading={usersLoading}
                    q={q}
                    nextUrl={usersNext}
                    loadMore={loadMoreUsers}
                />
            ) : (
                <PostsPanel
                    posts={posts}
                    isLoading={postsLoading}
                    q={q}
                    nextUrl={postsNext}
                    loadMore={loadMorePosts}
                    replacePost={replacePost}
                    removePost={removePost}
                />
            )}
        </div>
    );
}

interface UsersPanelProps {
    users: PublicUser[];
    isLoading: boolean;
    q: string;
    nextUrl: string | null;
    loadMore: () => Promise<void>;
}

function UsersPanel({ users, isLoading, q, nextUrl, loadMore }: UsersPanelProps) {
    if (!q) {
        return (
            <p className="py-12 text-center text-sm text-muted-foreground">
                Type something to search for users.
            </p>
        );
    }
    if (isLoading && users.length === 0) return <UsersSkeleton />;
    if (users.length === 0) {
        return (
            <p className="py-12 text-center text-sm text-muted-foreground">
                No users found for &ldquo;{q}&rdquo;.
            </p>
        );
    }
    return (
        <>
            <div className="space-y-px">
                {users.map((u) => (
                    <UserCard key={u.id} publicUser={u} />
                ))}
            </div>

            {nextUrl && (
                <div className="pt-4">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={loadMore}
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="animate-spin" />}
                        Load more
                    </Button>
                </div>
            )}
        </>
    );
}

interface PostsPanelProps {
    posts: Post[];
    isLoading: boolean;
    q: string;
    nextUrl: string | null;
    loadMore: () => Promise<void>;
    replacePost: (predicate: (p: Post) => boolean, replacement: Post) => void;
    removePost: (predicate: (p: Post) => boolean) => void;
}

function PostsPanel({
    posts,
    isLoading,
    q,
    nextUrl,
    loadMore,
    replacePost,
    removePost,
}: PostsPanelProps) {
    if (!q) {
        return (
            <p className="py-12 text-center text-sm text-muted-foreground">
                Type something to search for posts.
            </p>
        );
    }
    if (isLoading && posts.length === 0) return <PostsSkeleton />;
    if (posts.length === 0) {
        return (
            <p className="py-12 text-center text-sm text-muted-foreground">
                No posts found for &ldquo;{q}&rdquo;.
            </p>
        );
    }
    return (
        <>
            <div className="space-y-px">
                {posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onUpdate={(updated) => replacePost((p) => p.id === updated.id, updated)}
                        onDelete={(id) => removePost((p) => p.id === id)}
                    />
                ))}
            </div>

            {nextUrl && (
                <div className="pt-4">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={loadMore}
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="animate-spin" />}
                        Load more
                    </Button>
                </div>
            )}
        </>
    );
}

function UsersSkeleton() {
    return (
        <div className="space-y-px">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="animate-pulse border border-border bg-card p-4 first:rounded-t-lg last:rounded-b-lg"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-12 shrink-0 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-1/4 rounded bg-muted" />
                            <div className="h-3 w-1/2 rounded bg-muted" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PostsSkeleton() {
    return (
        <div className="space-y-px">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="animate-pulse border border-border bg-card p-4 first:rounded-t-lg last:rounded-b-lg"
                >
                    <div className="flex gap-3">
                        <div className="size-12 shrink-0 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-3 w-1/4 rounded bg-muted" />
                            <div className="h-3 w-full rounded bg-muted" />
                            <div className="h-3 w-3/4 rounded bg-muted" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
