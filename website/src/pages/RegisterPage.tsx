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
import { register as apiRegister } from "@/api/auth";

type FieldErrors = Partial<Record<"username" | "email" | "password", string>>;

function validateFields(
    username: string,
    email: string,
    password: string,
): FieldErrors {
    const errors: FieldErrors = {};
    if (!username.trim()) errors.username = "Username is required.";
    if (!email.trim()) {
        errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Enter a valid email address.";
    }
    if (!password) {
        errors.password = "Password is required.";
    } else if (password.length < 8) {
        errors.password = "Password must be at least 8 characters.";
    }
    return errors;
}

function parseServerErrors(err: unknown): {
    field: FieldErrors;
    general: string | null;
} {
    if (!isAxiosError(err)) {
        return {
            field: {},
            general: "Something went wrong. Please try again.",
        };
    }

    const status = err.response?.status;
    const data = err.response?.data;

    if (status === 429) {
        return {
            field: {},
            general: "Registration limit reached. Please try again later.",
        };
    }

    if (status === 400 && data && typeof data === "object") {
        const first = (v: unknown) => (Array.isArray(v) ? v[0] : String(v));
        const field: FieldErrors = {};
        if (data.username) field.username = first(data.username);
        if (data.email) field.email = first(data.email);
        if (data.password) field.password = first(data.password);

        const general: string | null =
            data.detail ??
            (data.non_field_errors ? first(data.non_field_errors) : null) ??
            null;

        if (Object.keys(field).length > 0 || general) return { field, general };
    }

    return { field: {}, general: "Something went wrong. Please try again." };
}

export default function RegisterPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [generalError, setGeneralError] = useState<string | null>(null);

    async function handleSubmit(e: Event) {
        e.preventDefault();

        const clientErrors = validateFields(username, email, password);
        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            return;
        }

        setIsSubmitting(true);
        setFieldErrors({});
        setGeneralError(null);

        try {
            await apiRegister(username, email, password);

            // Registration succeeded - auto-login so the user lands on /feed.
            try {
                await login(username, password);
                // GuestRoute HOC redirects to /feed once isAuthenticated becomes true.
            } catch {
                // Unlikely edge case: account was created but the immediate login
                // failed (e.g. transient server error). Surface a recovery message.
                setGeneralError("Account created. Please sign in to continue.");
            }
        } catch (err) {
            const { field, general } = parseServerErrors(err);
            setFieldErrors(field);
            setGeneralError(general);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center">
                    <p className="font-heading text-8xl font-bold leading-none text-primary">
                        Y
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Join the conversation today.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Create an account</CardTitle>
                        <CardDescription>
                            Fill in the details below to get started.
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
                                        setUsername(
                                            (e.target as HTMLInputElement)
                                                .value,
                                        )
                                    }
                                    required
                                    disabled={isSubmitting}
                                    aria-invalid={
                                        !!fieldErrors.username || undefined
                                    }
                                />
                                {fieldErrors.username && (
                                    <p className="text-xs text-destructive">
                                        {fieldErrors.username}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onInput={(e) =>
                                        setEmail(
                                            (e.target as HTMLInputElement)
                                                .value,
                                        )
                                    }
                                    required
                                    disabled={isSubmitting}
                                    aria-invalid={
                                        !!fieldErrors.email || undefined
                                    }
                                />
                                {fieldErrors.email && (
                                    <p className="text-xs text-destructive">
                                        {fieldErrors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        autoComplete="new-password"
                                        placeholder="Min. 8 characters"
                                        value={password}
                                        onInput={(e) =>
                                            setPassword(
                                                (e.target as HTMLInputElement)
                                                    .value,
                                            )
                                        }
                                        required
                                        disabled={isSubmitting}
                                        aria-invalid={
                                            !!fieldErrors.password || undefined
                                        }
                                        className="pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((v) => !v)
                                        }
                                        tabIndex={-1}
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                        className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="size-4" />
                                        ) : (
                                            <Eye className="size-4" />
                                        )}
                                    </button>
                                </div>
                                {fieldErrors.password ? (
                                    <p className="text-xs text-destructive">
                                        {fieldErrors.password}
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        At least 8 characters.
                                    </p>
                                )}
                            </div>

                            {generalError && (
                                <p
                                    role="alert"
                                    className="text-sm text-destructive"
                                >
                                    {generalError}
                                </p>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && (
                                    <Loader2 className="animate-spin" />
                                )}
                                Create account
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="justify-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <a
                                href="/login"
                                className="font-medium text-primary hover:underline"
                            >
                                Sign in
                            </a>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
