import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROUTES, STORAGE_KEYS } from "@/constants";
import authenticationService from "@/services/authenticationService";

export default function LoginPage() {
	const navigate = useNavigate();
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (isSubmitting) return;

		setErrorMessage("");
		setIsSubmitting(true);

		try {
			const response = await authenticationService.login({
				identifier,
				password,
			});

			if (!response?.success) {
				throw new Error(response?.message || "Dang nhap that bai");
			}

			const { user, token, refreshToken } = response.data || {};
			const storage = remember ? localStorage : sessionStorage;

			if (token) {
				storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
			}
			if (refreshToken) {
				storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
			}

            // Điều hướng dựa trên vai trò người dùng
			switch (user?.role_id) {
				case 1: // Admin
					navigate(APP_ROUTES.ADMIN, { replace: true });
					break;
				case 2: // Staff
					navigate(APP_ROUTES.STAFF, { replace: true });
					break;
				case 3: // Barista
					navigate(APP_ROUTES.BARISTA, { replace: true });
					break;
                case 4: // Customer
                    navigate(APP_ROUTES.HOME, { replace: true });
                    break;
				default: // Nếu không xác định được vai trò, chuyển về trang chủ
					navigate(APP_ROUTES.HOME, { replace: true });
					break;
			}
		} catch (error) {
			const message =
				error?.response?.data?.message ||
				error?.message ||
				"Dang nhap that bai";
			setErrorMessage(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="relative min-h-screen overflow-hidden">
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-secondary/50 blur-3xl" />
					<div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
				</div>

				<div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
					<div className="flex items-center justify-center border-b border-border bg-card/60 p-10 lg:border-b-0 lg:border-r">
						<div className="max-w-md space-y-6">
							<div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
								<Coffee className="h-4 w-4 text-primary" />
								<span>Staff Portal Access</span>
							</div>
							<div className="space-y-3">
								<h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
									Coffee Shop
								</h1>
								<p className="text-base text-muted-foreground">
									Sign in to manage orders, tables, inventory, and daily operations with one workspace.
								</p>
							</div>
							<div className="grid gap-3 text-sm text-muted-foreground">
								<div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-primary" />
									Unified POS, kitchen, and service workflows
								</div>
								<div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-accent" />
									Smart scheduling and attendance tracking
								</div>
								<div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-primary" />
									Inventory alerts and staff requests in one place
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-center p-8 lg:p-12">
						<div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
							<div className="mb-8 space-y-2">
								<h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
								<p className="text-sm text-muted-foreground">
									Use your staff account to continue.
								</p>
							</div>

							<form className="space-y-6" onSubmit={handleSubmit}>
								<div className="space-y-2">
									<Label htmlFor="identifier">Email or Username</Label>
									<div className="relative">
										<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="identifier"
											type="text"
											placeholder="staff@coffeeshop.com"
											className="pl-9"
											autoComplete="username"
											value={identifier}
											onChange={(event) => setIdentifier(event.target.value)}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="password">Password</Label>
									<div className="relative">
										<Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="password"
											type="password"
											placeholder="Enter your password"
											className="pl-9"
											autoComplete="current-password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
										/>
									</div>
								</div>

								<div className="flex items-center justify-between text-sm">
									<Label htmlFor="remember" className="cursor-pointer">
										<Checkbox
											id="remember"
											checked={remember}
											onCheckedChange={(checked) => setRemember(Boolean(checked))}
										/>
										Remember me
									</Label>
									<button
										type="button"
										className="text-primary hover:text-primary/90"
									>
										Forgot password?
									</button>
								</div>

								{errorMessage ? (
									<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
										{errorMessage}
									</div>
								) : null}

								<Button type="submit" className="w-full" disabled={isSubmitting}>
									{isSubmitting ? "Signing in..." : "Sign in"}
								</Button>
							</form>

							<div className="mt-6 text-center text-sm text-muted-foreground">
								Need an account?{" "}
								<button type="button" className="text-primary hover:text-primary/90" onClick={() => navigate(APP_ROUTES.REGISTER)}>
									Register Now!
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
