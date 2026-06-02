// ─── PostCard ─────────────────────────────────────────────────────────────────

export function PostCardSkeleton() {
    return (
        <div className="animate-pulse border border-border bg-card p-4 first:rounded-t-lg last:rounded-b-lg">
            <div className="flex gap-3">
                <div className="size-12 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-1/4 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="mt-1 h-3 w-1/5 rounded bg-muted" />
                </div>
            </div>
        </div>
    );
}

export function PostCardListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-px">
            {Array.from({ length: count }, (_, i) => (
                <PostCardSkeleton key={i} />
            ))}
        </div>
    );
}

// ─── UserCard ─────────────────────────────────────────────────────────────────

export function UserCardSkeleton() {
    return (
        <div className="animate-pulse border border-border bg-card p-4 first:rounded-t-lg last:rounded-b-lg">
            <div className="flex items-center gap-3">
                <div className="size-12 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                </div>
            </div>
        </div>
    );
}

export function UserCardListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-px">
            {Array.from({ length: count }, (_, i) => (
                <UserCardSkeleton key={i} />
            ))}
        </div>
    );
}

// ─── Profile header ───────────────────────────────────────────────────────────

export function ProfileHeaderSkeleton() {
    return (
        <div className="mb-6 animate-pulse rounded-lg border border-border bg-card p-6">
            <div className="flex items-start gap-4">
                <div className="size-20 shrink-0 rounded-full bg-muted" />
                <div className="flex-1 space-y-3 py-1">
                    <div className="h-4 w-1/3 rounded bg-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="flex gap-4">
                        <div className="h-3 w-16 rounded bg-muted" />
                        <div className="h-3 w-16 rounded bg-muted" />
                        <div className="h-3 w-24 rounded bg-muted" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Comment ──────────────────────────────────────────────────────────────────

export function CommentSkeleton() {
    return (
        <div className="flex animate-pulse gap-3">
            <div className="size-8 shrink-0 rounded-full bg-muted" />
            <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-1/4 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
        </div>
    );
}

export function CommentListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }, (_, i) => (
                <CommentSkeleton key={i} />
            ))}
        </div>
    );
}
