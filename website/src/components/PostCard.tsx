import { useState } from "preact/hooks";
import { Heart, Loader2, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/Avatar";
import { user } from "@/context/auth";
import { likePost, unlikePost, updatePost, deletePost } from "@/api/posts";
import { formatRelativeTime } from "@/lib/utils";
import type { Post } from "@/api/types";

interface PostCardProps {
    post: Post;
    onUpdate?: (updated: Post) => void;
    onDelete?: (id: number) => void;
}

export default function PostCard({ post, onUpdate, onDelete }: PostCardProps) {
    // Like state is local so optimistic updates survive prop replacements.
    const [liked, setLiked] = useState(post.is_liked);
    const [likesCount, setLikesCount] = useState(post.likes_count);

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAuthor = user.value?.username === post.author.username;

    async function toggleLike() {
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikesCount((c) => (wasLiked ? c - 1 : c + 1));
        try {
            if (wasLiked) await unlikePost(post.id);
            else await likePost(post.id);
        } catch {
            setLiked(wasLiked);
            setLikesCount((c) => (wasLiked ? c + 1 : c - 1));
            toast.error("Couldn't update like. Please try again.");
        }
    }

    function startEditing() {
        setEditContent(post.content);
        setEditError(null);
        setIsEditing(true);
    }

    async function handleSave() {
        const trimmed = editContent.trim();
        if (!trimmed || trimmed.length > 500) return;
        setIsSaving(true);
        setEditError(null);
        try {
            const updated = await updatePost(post.id, trimmed);
            onUpdate?.(updated);
            setIsEditing(false);
        } catch {
            setEditError("Failed to save. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm("Delete this post?")) return;
        setIsDeleting(true);
        try {
            await deletePost(post.id);
            onDelete?.(post.id);
        } catch {
            setIsDeleting(false);
        }
    }

    const overLimit = editContent.length > 500;

    return (
        <div className="border border-border bg-card p-4 first:rounded-t-lg last:rounded-b-lg">
            <div className="flex gap-3">
                <a href={`/users/${post.author.username}`} className="shrink-0">
                    <Avatar username={post.author.username} avatarUrl={null} size="md" />
                </a>

                <div className="min-w-0 flex-1">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <a
                                href={`/users/${post.author.username}`}
                                className="text-sm font-medium hover:underline"
                            >
                                @{post.author.username}
                            </a>
                            <span className="ml-2 text-xs text-muted-foreground">
                                {formatRelativeTime(post.created_at)}
                            </span>
                        </div>

                        {isAuthor && !isEditing && (
                            <div className="flex shrink-0 items-center gap-0.5">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={startEditing}
                                    aria-label="Edit post"
                                >
                                    <Pencil />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    aria-label="Delete post"
                                >
                                    {isDeleting ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <Trash2 />
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Content / edit form */}
                    {isEditing ? (
                        <div className="mt-2 space-y-2">
                            <Textarea
                                value={editContent}
                                onInput={(e) =>
                                    setEditContent((e.target as HTMLTextAreaElement).value)
                                }
                                disabled={isSaving}
                                aria-invalid={overLimit || undefined}
                                // eslint-disable-next-line jsx-a11y/no-autofocus
                                autoFocus
                            />
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    className={`text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}
                                >
                                    {editContent.length}/500
                                </span>
                                <div className="flex items-center gap-1">
                                    {editError && (
                                        <span className="text-xs text-destructive">{editError}</span>
                                    )}
                                    <Button
                                        size="xs"
                                        onClick={handleSave}
                                        disabled={isSaving || !editContent.trim() || overLimit}
                                    >
                                        {isSaving && <Loader2 className="animate-spin" />}
                                        Save
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="xs"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">
                            {post.content}
                        </p>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                        <div className="mt-3 flex items-center gap-4">
                            <button
                                onClick={toggleLike}
                                className={`flex items-center gap-1.5 text-xs transition-colors ${
                                    liked
                                        ? "text-red-500 hover:text-red-400"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                                aria-label={liked ? "Unlike" : "Like"}
                            >
                                <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} />
                                {likesCount}
                            </button>

                            <a
                                href={`/posts/${post.id}`}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <MessageCircle className="size-3.5" />
                                {post.comments_count}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
