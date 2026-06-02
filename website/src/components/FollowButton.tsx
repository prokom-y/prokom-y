import { useState } from "preact/hooks";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { followUser, unfollowUser } from "@/api/accounts";

interface FollowButtonProps {
    username: string;
    initialIsFollowing: boolean;
    onToggle?: (isFollowing: boolean) => void;
}

export default function FollowButton({ username, initialIsFollowing, onToggle }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false);

    async function toggle() {
        const prev = isFollowing;
        setIsFollowing(!prev);
        onToggle?.(!prev);
        setIsLoading(true);
        try {
            if (prev) await unfollowUser(username);
            else await followUser(username);
        } catch {
            setIsFollowing(prev);
            onToggle?.(prev);
            toast.error(`Couldn't ${prev ? "unfollow" : "follow"} @${username}. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            onClick={toggle}
            disabled={isLoading}
        >
            {isLoading && <Loader2 className="animate-spin" />}
            {isFollowing ? "Unfollow" : "Follow"}
        </Button>
    );
}
