import { useState } from "preact/hooks";
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
    const [imgFailed, setImgFailed] = useState(false);
    const initials = username.slice(0, 2).toUpperCase();
    const base = cn("rounded-full shrink-0", sizeClasses[size], className);

    if (avatarUrl && !imgFailed) {
        return (
            <img
                src={avatarUrl}
                alt={username}
                className={cn(base, "object-cover")}
                onError={() => setImgFailed(true)}
            />
        );
    }

    return (
        <div
            className={cn(
                base,
                "flex items-center justify-center bg-primary/15 font-semibold text-primary",
            )}
        >
            {initials}
        </div>
    );
}
