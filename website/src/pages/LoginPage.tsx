import { useState } from "preact/hooks";
import { isAxiosError } from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth";

function parseError(err: unknown): string {
    if (isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 429) return "Too many sign-in attempts. Please wait a minute and try again.";
        if (status === 401 || status === 400) return "Invalid username or password.";
    }
    return "Something went wrong. Please try again.";
}

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: Event) {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            await login(username, password);
            // Redirect is handled by GuestRoute HOC once isAuthenticated becomes true.
        } catch (err) {
            setError(parseError(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <p className="font-heading text-8xl font-bold leading-none text-primary">Y</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        What's happening in the world?
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Sign in</CardTitle>
                        <CardDescription>
                            Enter your credentials to access your account.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="yourhandle"
                                    value={username}
                                    onInput={(e) =>
                                        setUsername((e.target as HTMLInputElement).value)
                                    }
                                    required
                                    disabled={isSubmitting}
                                    aria-invalid={error ? true : undefined}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        value={password}
                                        onInput={(e) =>
                                            setPassword((e.target as HTMLInputElement).value)
                                        }
                                        required
                                        disabled={isSubmitting}
                                        aria-invalid={error ? true : undefined}
                                        className="pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <p role="alert" className="text-sm text-destructive">
                                    {error}
                                </p>
                            )}

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="animate-spin" />}
                                Sign in
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="justify-center">
                        <p className="text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <a href="/register" className="font-medium text-primary hover:underline">
                                Register
                            </a>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
