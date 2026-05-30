import { useState } from "preact/hooks";
import { Loader2, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/Avatar";
import { user } from "@/context/auth";
import { updateComment, deleteComment } from "@/api/posts";
import { formatRelativeTime } from "@/lib/utils";
import type { Comment } from "@/api/types";

interface CommentItemProps {
    comment: Comment;
    postId: number;
    onUpdate?: (updated: Comment) => void;
    onDelete?: (id: number) => void;
}

export default function CommentItem({ comment, postId, onUpdate, onDelete }: CommentItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAuthor = user.value?.username === comment.author.username;
    const overLimit = editContent.length > 300;

    function startEditing() {
        setEditContent(comment.content);
        setEditError(null);
        setIsEditing(true);
    }

    async function handleSave() {
        const trimmed = editContent.trim();
        if (!trimmed || trimmed.length > 300) return;
        setIsSaving(true);
        setEditError(null);
        try {
            const updated = await updateComment(postId, comment.id, trimmed);
            onUpdate?.(updated);
            setIsEditing(false);
        } catch {
            setEditError("Failed to save. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!window.confirm("Delete this comment?")) return;
        setIsDeleting(true);
        try {
            await deleteComment(postId, comment.id);
            onDelete?.(comment.id);
        } catch {
            setIsDeleting(false);
        }
    }

    return (
        <div className="flex gap-3">
            <a href={`/users/${comment.author.username}`} className="shrink-0">
                <Avatar username={comment.author.username} avatarUrl={null} size="sm" />
            </a>
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <a
                            href={`/users/${comment.author.username}`}
                            className="text-sm font-medium hover:underline"
                        >
                            @{comment.author.username}
                        </a>
                        <span className="ml-2 text-xs text-muted-foreground">
                            {formatRelativeTime(comment.created_at)}
                        </span>
                    </div>

                    {isAuthor && !isEditing && (
                        <div className="flex shrink-0 items-center gap-0.5">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={startEditing}
                                aria-label="Edit comment"
                            >
                                <Pencil />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                aria-label="Delete comment"
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

                {isEditing ? (
                    <div className="mt-1 space-y-2">
                        <Textarea
                            value={editContent}
                            onInput={(e) =>
                                setEditContent((e.target as HTMLTextAreaElement).value)
                            }
                            disabled={isSaving}
                            aria-invalid={overLimit || undefined}
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                            className="min-h-[80px]"
                        />
                        <div className="flex items-center justify-between gap-2">
                            <span
                                className={`text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}
                            >
                                {editContent.length}/300
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
                        {comment.content}
                    </p>
                )}
            </div>
        </div>
    );
}
