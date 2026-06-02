import { useState } from "preact/hooks";
import { useLocation } from "preact-iso";
import { LogOut, Menu, X } from "lucide-react";
import type { ComponentChildren } from "preact";

import { Button } from "@/components/ui/button";
import Avatar from "@/components/Avatar";
import { user, isAuthenticated } from "@/context/auth";
import { useAuth } from "@/context/auth";

const NAV_LINKS = [
    { href: "/feed", label: "Feed" },
    { href: "/explore", label: "Explore" },
    { href: "/search", label: "Search" },
    { href: "/profile", label: "Profile" },
] as const;

export default function AppLayout({ children }: { children: ComponentChildren }) {
    const { path } = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const { logout } = useAuth();
    const currentUser = user.value;

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
                <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
                    {/* Logo */}
                    <a
                        href={isAuthenticated.value ? "/feed" : "/login"}
                        className="font-heading text-2xl font-bold text-primary"
                    >
                        Y
                    </a>

                    {/* Desktop nav */}
                    {isAuthenticated.value && (
                        <nav className="hidden items-center gap-1 md:flex">
                            {NAV_LINKS.map(({ href, label }) => (
                                <a
                                    key={href}
                                    href={href}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        path === href
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    {label}
                                </a>
                            ))}
                        </nav>
                    )}

                    {/* Right section */}
                    <div className="flex items-center gap-2">
                        {isAuthenticated.value && currentUser ? (
                            <>
                                <a
                                    href="/profile"
                                    className="hidden items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted md:flex"
                                >
                                    <Avatar
                                        username={currentUser.username}
                                        avatarUrl={currentUser.profile.avatar_url}
                                        size="sm"
                                    />
                                    <span className="text-sm font-medium">
                                        @{currentUser.username}
                                    </span>
                                </a>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={logout}
                                    aria-label="Log out"
                                    className="hidden md:inline-flex"
                                >
                                    <LogOut />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => setMenuOpen((v) => !v)}
                                    aria-label="Toggle menu"
                                    className="md:hidden"
                                >
                                    {menuOpen ? <X /> : <Menu />}
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <a href="/login">
                                    <Button variant="ghost" size="sm">
                                        Sign in
                                    </Button>
                                </a>
                                <a href="/register">
                                    <Button size="sm">Sign up</Button>
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile dropdown */}
                {menuOpen && isAuthenticated.value && currentUser && (
                    <div className="border-t border-border bg-background px-4 pb-3 md:hidden">
                        <div className="flex items-center gap-2 border-b border-border py-3">
                            <Avatar
                                username={currentUser.username}
                                avatarUrl={currentUser.profile.avatar_url}
                                size="sm"
                            />
                            <span className="text-sm font-medium">@{currentUser.username}</span>
                        </div>
                        <nav className="mt-2 flex flex-col gap-0.5">
                            {NAV_LINKS.map(({ href, label }) => (
                                <a
                                    key={href}
                                    href={href}
                                    onClick={() => setMenuOpen(false)}
                                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                        path === href
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    {label}
                                </a>
                            ))}
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    logout();
                                }}
                                className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <LogOut className="size-4" />
                                Log out
                            </button>
                        </nav>
                    </div>
                )}
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-border py-6 text-xs text-muted-foreground">
                <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between">
                    <span>© {new Date().getFullYear()} Y. All rights reserved.</span>
                    <div className="flex items-center gap-4">
                        <a href="/about" className="transition-colors hover:text-foreground">
                            About
                        </a>
                        <a
                            href="https://github.com/prokom-y/prokom-y"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-colors hover:text-foreground"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
