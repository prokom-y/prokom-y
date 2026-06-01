import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import { user } from "@/context/auth";
import type { PublicUser } from "@/api/types";

interface UserCardProps {
    publicUser: PublicUser;
}

export default function UserCard({ publicUser }: UserCardProps) {
    const isOwnProfile = user.value?.username === publicUser.username;
    const bio = publicUser.profile.bio;
    const truncatedBio = bio && bio.length > 80 ? bio.slice(0, 80) + "…" : bio;

    return (
        <div className="border border-border bg-card p-4 first:rounded-t-lg last:rounded-b-lg">
            <div className="flex items-center gap-3">
                <a href={`/users/${publicUser.username}`} className="shrink-0">
                    <Avatar
                        username={publicUser.username}
                        avatarUrl={publicUser.profile.avatar_url}
                        size="md"
                    />
                </a>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                            <a
                                href={`/users/${publicUser.username}`}
                                className="text-sm font-medium hover:underline"
                            >
                                @{publicUser.username}
                            </a>
                            <span className="ml-2 text-xs text-muted-foreground">
                                {publicUser.profile.followers_count}{" "}
                                {publicUser.profile.followers_count === 1 ? "follower" : "followers"}
                            </span>
                        </div>

                        {!isOwnProfile && user.value && (
                            <FollowButton
                                username={publicUser.username}
                                initialIsFollowing={publicUser.is_following}
                            />
                        )}
                    </div>

                    {truncatedBio && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{truncatedBio}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
