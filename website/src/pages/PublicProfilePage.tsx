import { useState, useEffect } from "preact/hooks";
import { CalendarDays, Loader2 } from "lucide-react";
import { ProfileHeaderSkeleton, PostCardListSkeleton } from "@/components/Skeletons";

import { Button } from "@/components/ui/button";
import Avatar from "@/components/Avatar";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";
import { user } from "@/context/auth";
import { getPublicProfile } from "@/api/accounts";
import { getPosts } from "@/api/posts";
import { usePagination } from "@/hooks/usePagination";
import type { PublicUser } from "@/api/types";

interface PublicProfilePageProps {
    username: string;
}

export default function PublicProfilePage({ username }: PublicProfilePageProps) {
    const [profile, setProfile] = useState<PublicUser | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    const {
        results: posts,
        isLoading: postsLoading,
        nextUrl,
        loadMore,
        replaceResult,
        removeResult,
    } = usePagination(() => getPosts({ author: username }), [username]);

    useEffect(() => {
        setProfileLoading(true);
        setProfileError(null);
        getPublicProfile(username)
            .then(setProfile)
            .catch(() => setProfileError("User not found."))
            .finally(() => setProfileLoading(false));
    }, [username]);

    const isOwnProfile = user.value?.username === username;

    const joinedDate = profile
        ? new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
              new Date(profile.profile.created_at),
          )
        : null;

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            {/* Profile header */}
            {profileLoading ? (
                <ProfileHeaderSkeleton />
            ) : profileError || !profile ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                    {profileError ?? "User not found."}
                </p>
            ) : (
                <div className="mb-6 rounded-lg border border-border bg-card p-6">
                    <div className="flex items-start gap-4">
                        <Avatar
                            username={profile.username}
                            avatarUrl={profile.profile.avatar_url}
                            size="lg"
                        />

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <h1 className="font-heading text-lg font-semibold">
                                    @{profile.username}
                                </h1>

                                {!isOwnProfile && user.value && (
                                    <FollowButton
                                        username={profile.username}
                                        initialIsFollowing={profile.is_following}
                                        onToggle={(following) =>
                                            setProfile((p) =>
                                                p
                                                    ? {
                                                          ...p,
                                                          profile: {
                                                              ...p.profile,
                                                              followers_count:
                                                                  p.profile.followers_count +
                                                                  (following ? 1 : -1),
                                                          },
                                                      }
                                                    : p,
                                            )
                                        }
                                    />
                                )}
                            </div>

                            {profile.profile.bio && (
                                <p className="mt-1 text-sm leading-relaxed">
                                    {profile.profile.bio}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <a
                                    href={`/users/${profile.username}/followers`}
                                    className="hover:text-foreground hover:underline"
                                >
                                    <span className="font-medium text-foreground">
                                        {profile.profile.followers_count}
                                    </span>{" "}
                                    {profile.profile.followers_count === 1
                                        ? "Follower"
                                        : "Followers"}
                                </a>
                                <a
                                    href={`/users/${profile.username}/following`}
                                    className="hover:text-foreground hover:underline"
                                >
                                    <span className="font-medium text-foreground">
                                        {profile.profile.following_count}
                                    </span>{" "}
                                    Following
                                </a>
                                <span className="flex items-center gap-1">
                                    <CalendarDays className="size-3.5" />
                                    Joined {joinedDate}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Posts */}
            {!profileError && (
                <>
                    <h2 className="mb-3 font-heading text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                        Posts
                    </h2>

                    {postsLoading && posts.length === 0 ? (
                        <PostCardListSkeleton count={3} />
                    ) : posts.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">
                            No posts yet.
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
                                        disabled={postsLoading}
                                    >
                                        {postsLoading && <Loader2 className="animate-spin" />}
                                        Load more
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
