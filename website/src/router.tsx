import { useEffect } from "preact/hooks";
import { Router, Route, useLocation } from "preact-iso";

import { ProtectedRoute, GuestRoute } from "@/components/route-guards";
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
import NotFoundPage from "@/pages/_404";

// Wrapped at module level so the HOC isn't re-invoked on every parent render.
const GuestLoginPage = GuestRoute(LoginPage);
const GuestRegisterPage = GuestRoute(RegisterPage);
const ProtectedFeedPage = ProtectedRoute(FeedPage);
const ProtectedExplorePage = ProtectedRoute(ExplorePage);
const ProtectedPostDetailPage = ProtectedRoute(PostDetailPage);
const ProtectedProfilePage = ProtectedRoute(ProfilePage);
const ProtectedSearchPage = ProtectedRoute(SearchPage);
const ProtectedFollowersPage = ProtectedRoute(FollowersPage);
const ProtectedFollowingPage = ProtectedRoute(FollowingPage);

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
        <Router>
            <Route path="/" component={RootRedirect} />

            {/* Guest-only: redirect to /feed when already logged in */}
            <Route path="/login" component={GuestLoginPage} />
            <Route path="/register" component={GuestRegisterPage} />

            {/* Protected: redirect to /login when not authenticated */}
            <Route path="/feed" component={ProtectedFeedPage} />
            <Route path="/explore" component={ProtectedExplorePage} />
            <Route path="/posts/:id" component={ProtectedPostDetailPage} />
            <Route path="/profile" component={ProtectedProfilePage} />
            <Route path="/search" component={ProtectedSearchPage} />

            {/* More-specific user routes must come before /:username */}
            <Route path="/users/:username/followers" component={ProtectedFollowersPage} />
            <Route path="/users/:username/following" component={ProtectedFollowingPage} />
            <Route path="/users/:username" component={PublicProfilePage} />

            <Route default component={NotFoundPage} />
        </Router>
    );
}
