import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import PostCard from "@/components/PostCard";
import PostComposer from "@/components/PostComposer";
import { PostCardListSkeleton } from "@/components/Skeletons";
import { getFeed } from "@/api/posts";
import { usePagination } from "@/hooks/usePagination";
import type { Post } from "@/api/types";

export default function FeedPage() {
    const { results: posts, isLoading, nextUrl, loadMore, prepend, replaceResult, removeResult } =
        usePagination(() => getFeed(), []);

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <h1 className="mb-6 font-heading text-xl font-semibold">Feed</h1>

            <PostComposer onPost={(post: Post) => prepend(post)} />

            {isLoading && posts.length === 0 ? (
                <PostCardListSkeleton count={5} />
            ) : posts.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                    Follow some users to see their posts here.
                </p>
            ) : (
                <>
                    <div className="space-y-px">
                        {posts.map((post) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onUpdate={(updated) =>
                                    replaceResult((p) => p.id === updated.id, updated)
                                }
                                onDelete={(id) => removeResult((p) => p.id === id)}
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
            )}
        </div>
    );
}
