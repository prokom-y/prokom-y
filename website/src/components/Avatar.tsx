import { cn } from "@/lib/utils";

interface AvatarProps {
    username: string;
    avatarUrl: string | null;
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeClasses = {
    sm: "size-8 text-xs",
    md: "size-12 text-base",
    lg: "size-20 text-xl",
};

export default function Avatar({ username, avatarUrl, size = "md", className }: AvatarProps) {
    const initials = username.slice(0, 2).toUpperCase();
    const classes = cn("rounded-full shrink-0", sizeClasses[size], className);

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={username}
                className={cn(classes, "object-cover")}
                onError={(e) => {
                    // Fall back to initials div on broken image.
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
            />
        );
    }

    return (
        <div
            className={cn(
                classes,
                "flex items-center justify-center bg-primary/15 font-semibold text-primary",
            )}
        >
            {initials}
        </div>
    );
}
