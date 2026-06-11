import { useRef, useState } from "preact/hooks";
import { isAxiosError } from "axios";
import { CalendarDays, Heart, Loader2, MessageCircle, Pencil, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Avatar from "@/components/Avatar";
import { user } from "@/context/auth";
import { updateProfile, uploadAvatar } from "@/api/accounts";
import { getPosts } from "@/api/posts";
import { usePagination } from "@/hooks/usePagination";
import { formatRelativeTime } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ProfilePage() {
    // ProtectedRoute guarantees user is non-null by the time this renders.
    const currentUser = user.value!;

    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        results: posts,
        isLoading: postsLoading,
        nextUrl,
        loadMore,
    } = usePagination(() => getPosts({ author: currentUser.username }), [currentUser.username]);

    function startEditing() {
        setEditBio(currentUser.profile.bio ?? "");
        setAvatarFile(null);
        setAvatarPreview(null);
        setSaveError(null);
        setIsEditing(true);
    }

    function cancelEditing() {
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        setSaveError(null);
    }

    function handleFileSelect(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            setSaveError("Image must be smaller than 5 MB.");
            return;
        }
        setSaveError(null);
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    }

    async function handleSave() {
        setIsSaving(true);
        setSaveError(null);
        try {
            let updated = currentUser;
            if (avatarFile) {
                updated = await uploadAvatar(avatarFile);
            }
            if (editBio !== (currentUser.profile.bio ?? "")) {
                updated = await updateProfile({ bio: editBio });
            }
            user.value = updated;
            setIsEditing(false);
            setAvatarFile(null);
            setAvatarPreview(null);
        } catch (err) {
            setSaveError(
                isAxiosError(err) && err.response?.status === 400
                    ? "Invalid data. Please check your image and bio."
                    : "Failed to save changes. Please try again.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    const joinedDate = new Intl.DateTimeFormat("en", {
        month: "long",
        year: "numeric",
    }).format(new Date(currentUser.profile.created_at));

    return (
        <div className="mx-auto max-w-2xl px-4 py-8">
            {/* ── Profile header ── */}
            <div className="mb-6 rounded-lg border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                    <Avatar
                        username={currentUser.username}
                        avatarUrl={currentUser.profile.avatar_url}
                        size="lg"
                    />

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <h1 className="font-heading text-lg font-semibold">
                                @{currentUser.username}
                            </h1>
                            {!isEditing && (
                                <Button variant="outline" size="sm" onClick={startEditing}>
                                    <Pencil />
                                    Edit profile
                                </Button>
                            )}
                        </div>

                        {!isEditing && (
                            <>
                                {currentUser.profile.bio && (
                                    <p className="mt-1 text-sm leading-relaxed">
                                        {currentUser.profile.bio}
                                    </p>
                                )}
                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <a
                                        href={`/users/${currentUser.username}/followers`}
                                        className="hover:text-foreground hover:underline"
                                    >
                                        <span className="font-medium text-foreground">
                                            {currentUser.profile.followers_count}
                                        </span>{" "}
                                        {currentUser.profile.followers_count === 1
                                            ? "Follower"
                                            : "Followers"}
                                    </a>
                                    <a
                                        href={`/users/${currentUser.username}/following`}
                                        className="hover:text-foreground hover:underline"
                                    >
                                        <span className="font-medium text-foreground">
                                            {currentUser.profile.following_count}
                                        </span>{" "}
                                        Following
                                    </a>
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="size-3.5" />
                                        Joined {joinedDate}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Edit form (inline) ── */}
                {isEditing && (
                    <div className="mt-5 space-y-4 border-t border-border pt-5">
                        {/* Avatar upload */}
                        <div className="space-y-2">
                            <Label>Avatar</Label>
                            <div className="flex items-center gap-4">
                                <Avatar
                                    username={currentUser.username}
                                    avatarUrl={avatarPreview ?? currentUser.profile.avatar_url}
                                    size="lg"
                                />
                                <div className="space-y-1">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                        disabled={isSaving}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSaving}
                                    >
                                        <Upload className="size-4" />
                                        {avatarFile ? "Change photo" : "Upload photo"}
                                    </Button>
                                    {avatarFile && (
                                        <p className="text-xs text-muted-foreground">
                                            {avatarFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-1.5">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                placeholder="Tell the world about yourself..."
                                value={editBio}
                                onInput={(e) =>
                                    setEditBio((e.target as HTMLTextAreaElement).value)
                                }
                                disabled={isSaving}
                                maxLength={300}
                            />
                            <p className="text-right text-xs text-muted-foreground">
                                {editBio.length}/300
                            </p>
                        </div>

                        {saveError && (
                            <p role="alert" className="text-sm text-destructive">
                                {saveError}
                            </p>
                        )}

                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                {isSaving && <Loader2 className="animate-spin" />}
                                Save
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEditing}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Posts ── */}
            <h2 className="mb-3 font-heading text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Posts
            </h2>

            {postsLoading && posts.length === 0 ? (
                <PostsSkeleton />
            ) : posts.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No posts yet.</p>
            ) : (
                <div className="space-y-px">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className="border border-border bg-card p-4 first:rounded-t-lg last:rounded-b-lg"
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {post.content}
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                <a
                                    href={`/posts/${post.id}`}
                                    className="hover:text-foreground hover:underline"
                                >
                                    {formatRelativeTime(post.created_at)}
                                </a>
                                <a
                                    href={`/posts/${post.id}`}
                                    className="flex items-center gap-1 hover:text-foreground"
                                >
                                    <Heart className="size-3.5" />
                                    {post.likes_count}
                                </a>
                                <a
                                    href={`/posts/${post.id}`}
                                    className="flex items-center gap-1 hover:text-foreground"
                                >
                                    <MessageCircle className="size-3.5" />
                                    {post.comments_count}
                                </a>
                            </div>
                        </div>
                    ))}

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
                </div>
            )}
        </div>
    );
}

function PostsSkeleton() {
    return (
        <div className="space-y-px">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="animate-pulse border border-border bg-card p-4 first:rounded-t-lg last:rounded-b-lg"
                >
                    <div className="space-y-2">
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="h-3 w-4/5 rounded bg-muted" />
                        <div className="mt-3 h-3 w-1/4 rounded bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );
}
