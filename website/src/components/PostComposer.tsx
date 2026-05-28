import { useState } from "preact/hooks";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/Avatar";
import { user } from "@/context/auth";
import { createPost } from "@/api/posts";
import type { Post } from "@/api/types";

interface PostComposerProps {
    onPost?: (post: Post) => void;
}

export default function PostComposer({ onPost }: PostComposerProps) {
    const currentUser = user.value!;
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const overLimit = content.length > 500;
    const isEmpty = !content.trim();

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (isEmpty || overLimit) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const post = await createPost(content.trim());
            onPost?.(post);
            setContent("");
        } catch {
            setError("Failed to post. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mb-px rounded-t-lg border border-border bg-card p-4">
            <div className="flex gap-3">
                <Avatar
                    username={currentUser.username}
                    avatarUrl={currentUser.profile.avatar_url}
                    size="md"
                />

                <form onSubmit={handleSubmit} className="flex-1 space-y-3">
                    <Textarea
                        placeholder="What's happening?"
                        value={content}
                        onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
                        disabled={isSubmitting}
                        aria-invalid={overLimit || undefined}
                    />

                    <div className="flex items-center justify-between gap-2">
                        <span
                            className={`text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}
                        >
                            {content.length}/500
                        </span>
                        <div className="flex items-center gap-2">
                            {error && <span className="text-xs text-destructive">{error}</span>}
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isEmpty || overLimit || isSubmitting}
                            >
                                {isSubmitting && <Loader2 className="animate-spin" />}
                                Post
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
