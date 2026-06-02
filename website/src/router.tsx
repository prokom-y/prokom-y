import { useEffect } from "preact/hooks";
import { Router, Route, useLocation } from "preact-iso";
import type { ComponentChildren } from "preact";

import { ProtectedRoute, GuestRoute } from "@/components/route-guards";
import AppLayout from "@/components/AppLayout";
import { isAuthenticated, isLoading } from "@/context/auth";

import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import FeedPage from "@/pages/FeedPage";
import ExplorePage from "@/pages/ExplorePage";
import PostDetailPage from "@/pages/PostDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import SearchPage from "@/pages/SearchPage";
import PublicProfilePage from "@/pages/PublicProfilePage";
import FollowersPage from "@/pages/FollowersPage";
import FollowingPage from "@/pages/FollowingPage";
import AboutPage from "@/pages/AboutPage";
import NotFoundPage from "@/pages/_404";

// Wrapped at module level so HOCs aren't re-invoked on every parent render.
const GuestLoginPage = GuestRoute(LoginPage);
const GuestRegisterPage = GuestRoute(RegisterPage);
const ProtectedFeedPage = ProtectedRoute(FeedPage);
const ProtectedExplorePage = ProtectedRoute(ExplorePage);
const ProtectedPostDetailPage = ProtectedRoute(PostDetailPage);
const ProtectedProfilePage = ProtectedRoute(ProfilePage);
const ProtectedSearchPage = ProtectedRoute(SearchPage);
const ProtectedFollowersPage = ProtectedRoute(FollowersPage);
const ProtectedFollowingPage = ProtectedRoute(FollowingPage);

// Auth pages are full-screen and don't need the app shell.
const AUTH_PATHS = new Set(["/login", "/register"]);

function ConditionalLayout({ children }: { children: ComponentChildren }) {
    const { path } = useLocation();
    if (AUTH_PATHS.has(path)) return <>{children}</>;
    return <AppLayout>{children}</AppLayout>;
}

function RootRedirect() {
    const { route } = useLocation();
    useEffect(() => {
        if (!isLoading.value) {
            route(isAuthenticated.value ? "/feed" : "/login");
        }
    }, [isLoading.value, isAuthenticated.value]);
    return null;
}

export function AppRouter() {
    return (
        <ConditionalLayout>
            <Router>
                <Route path="/" component={RootRedirect} />

                {/* Guest-only */}
                <Route path="/login" component={GuestLoginPage} />
                <Route path="/register" component={GuestRegisterPage} />

                {/* Protected */}
                <Route path="/feed" component={ProtectedFeedPage} />
                <Route path="/explore" component={ProtectedExplorePage} />
                <Route path="/posts/:id" component={ProtectedPostDetailPage} />
                <Route path="/profile" component={ProtectedProfilePage} />
                <Route path="/search" component={ProtectedSearchPage} />

                {/* Public */}
                <Route path="/about" component={AboutPage} />
                <Route path="/users/:username/followers" component={ProtectedFollowersPage} />
                <Route path="/users/:username/following" component={ProtectedFollowingPage} />
                <Route path="/users/:username" component={PublicProfilePage} />

                <Route default component={NotFoundPage} />
            </Router>
        </ConditionalLayout>
    );
}
