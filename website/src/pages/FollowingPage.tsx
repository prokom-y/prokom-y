import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import UserCard from "@/components/UserCard";
import { getFollowing } from "@/api/accounts";
import { usePagination } from "@/hooks/usePagination";

interface FollowingPageProps {
    username: string;
}

export default function FollowingPage({ username }: FollowingPageProps) {
    const { results: users, isLoading, nextUrl, loadMore } = usePagination(
        () => getFollowing(username),
        [username],
    );

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-6 font-heading text-xl font-semibold">
                <a href={`/users/${username}`} className="hover:underline">
                    @{username}
                </a>{" "}
                is following
            </h1>

            {isLoading && users.length === 0 ? (
                <FollowingSkeleton />
            ) : users.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                    Not following anyone yet.
                </p>
            ) : (
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
            )}
        </div>
    );
}

function FollowingSkeleton() {
    return (
        <div className="space-y-px">
            {[1, 2, 3, 4, 5].map((i) => (
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
