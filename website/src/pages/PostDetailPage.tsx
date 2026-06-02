import { useState, useEffect } from "preact/hooks";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CommentListSkeleton } from "@/components/Skeletons";

import { Button } from "@/components/ui/button";
import PostCard from "@/components/PostCard";
import CommentForm from "@/components/CommentForm";
import CommentItem from "@/components/CommentItem";
import { getPost, getComments } from "@/api/posts";
import { usePagination } from "@/hooks/usePagination";
import type { Post } from "@/api/types";

interface PostDetailPageProps {
    id: string;
}

export default function PostDetailPage({ id }: PostDetailPageProps) {
    const postId = Number(id);

    const [post, setPost] = useState<Post | null>(null);
    const [postLoading, setPostLoading] = useState(true);
    const [postError, setPostError] = useState<string | null>(null);

    const {
        results: comments,
        isLoading: commentsLoading,
        nextUrl,
        loadMore,
        append: appendComment,
        replaceResult: replaceComment,
        removeResult: removeComment,
    } = usePagination(() => getComments(postId), [postId]);

    useEffect(() => {
        setPostLoading(true);
        setPostError(null);
        getPost(postId)
            .then(setPost)
            .catch(() => setPostError("Post not found."))
            .finally(() => setPostLoading(false));
    }, [postId]);

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            <button
                onClick={() => history.back()}
                className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="size-4" />
                Back
            </button>

            {postLoading ? (
                <PostSkeleton />
            ) : postError || !post ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                    {postError ?? "Post not found."}
                </p>
            ) : (
                <>
                    {/* Wrapper makes PostCard the sole first+last child so it gets rounded corners */}
                    <div>
                        <PostCard
                            post={post}
                            onUpdate={(updated) => setPost(updated)}
                            onDelete={() => history.back()}
                        />
                    </div>

                    {/* Comments panel */}
                    <div className="mt-4 rounded-lg border border-border bg-card p-4">
                        <h2 className="mb-4 text-sm font-semibold text-foreground">
                            {post.comments_count === 1
                                ? "1 Comment"
                                : `${post.comments_count} Comments`}
                        </h2>

                        <CommentForm
                            postId={postId}
                            onComment={(comment) => {
                                appendComment(comment);
                                setPost((p) =>
                                    p ? { ...p, comments_count: p.comments_count + 1 } : p,
                                );
                            }}
                        />

                        <div className="mt-4 space-y-4">
                            {commentsLoading && comments.length === 0 ? (
                                <CommentListSkeleton />
                            ) : comments.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    No comments yet. Be the first!
                                </p>
                            ) : (
                                comments.map((comment) => (
                                    <CommentItem
                                        key={comment.id}
                                        comment={comment}
                                        postId={postId}
                                        onUpdate={(updated) =>
                                            replaceComment((c) => c.id === updated.id, updated)
                                        }
                                        onDelete={(cid) => {
                                            removeComment((c) => c.id === cid);
                                            setPost((p) =>
                                                p
                                                    ? {
                                                          ...p,
                                                          comments_count: Math.max(
                                                              0,
                                                              p.comments_count - 1,
                                                          ),
                                                      }
                                                    : p,
                                            );
                                        }}
                                    />
                                ))
                            )}
                        </div>

                        {nextUrl && (
                            <div className="mt-4">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={loadMore}
                                    disabled={commentsLoading}
                                >
                                    {commentsLoading && <Loader2 className="animate-spin" />}
                                    Load more comments
                                </Button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function PostSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
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
            <div className="rounded-lg border border-border bg-card p-4">
                <div className="h-3 w-1/5 rounded bg-muted" />
            </div>
        </div>
    );
}
