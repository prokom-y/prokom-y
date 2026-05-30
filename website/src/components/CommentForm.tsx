import { useState } from "preact/hooks";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/Avatar";
import { user } from "@/context/auth";
import { createComment } from "@/api/posts";
import type { Comment } from "@/api/types";

interface CommentFormProps {
    postId: number;
    onComment?: (comment: Comment) => void;
}

export default function CommentForm({ postId, onComment }: CommentFormProps) {
    const currentUser = user.value!;
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const overLimit = content.length > 300;
    const isEmpty = !content.trim();

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (isEmpty || overLimit) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const comment = await createComment(postId, content.trim());
            onComment?.(comment);
            setContent("");
        } catch {
            setError("Failed to post comment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="border-t border-border pt-4">
            <div className="flex gap-3">
                <Avatar
                    username={currentUser.username}
                    avatarUrl={currentUser.profile.avatar_url}
                    size="sm"
                />
                <form onSubmit={handleSubmit} className="flex-1 space-y-2">
                    <Textarea
                        placeholder="Write a comment…"
                        value={content}
                        onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
                        disabled={isSubmitting}
                        aria-invalid={overLimit || undefined}
                        className="min-h-[80px]"
                    />
                    <div className="flex items-center justify-between gap-2">
                        <span
                            className={`text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}
                        >
                            {content.length}/300
                        </span>
                        <div className="flex items-center gap-2">
                            {error && <span className="text-xs text-destructive">{error}</span>}
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isEmpty || overLimit || isSubmitting}
                            >
                                {isSubmitting && <Loader2 className="animate-spin" />}
                                Comment
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
