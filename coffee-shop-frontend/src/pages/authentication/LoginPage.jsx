import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, Lock, Mail } from "lucide-react";
import GoogleButton from "@/components/ui/GoogleButton";
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
				throw new Error(response?.message || "Đăng nhập thất bại");
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
			const errorData = error?.response?.data;
			const validationMessages = Array.isArray(errorData?.errors)
				? errorData.errors
						.map((item) => item?.message)
						.filter(Boolean)
				: [];
			const message =
				(validationMessages.length > 0
					? validationMessages.join("\n")
					: errorData?.message || error?.message) ||
				"Đăng nhập thất bại";
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
								<span>Đăng nhập dành cho mọi người</span>
							</div>
							<div className="space-y-3">
								<h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
									Coffee Shop
								</h1>
								<p className="text-base text-muted-foreground">
									Đăng nhập để đặt món, theo dõi đơn hàng, hoặc quản lý vận hành cửa hàng trong cùng một hệ thống.
								</p>
							</div>
							<div className="grid gap-3 text-sm text-muted-foreground">
								<div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-primary" />
									Đặt món nhanh, theo dõi trạng thái đơn hàng
								</div>
								<div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-accent" />
									Tích điểm thành viên và nhận ưu đãi cá nhân hóa
								</div>
								<div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-primary" />
									Quản lý POS, bếp, kho và lịch làm việc cho đội ngũ
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-center p-8 lg:p-12">
						<div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
							<div className="mb-8 space-y-2">
								<h2 className="text-2xl font-semibold text-foreground">Chào mừng trở lại</h2>
								<p className="text-sm text-muted-foreground">
									Dùng tài khoản của bạn để tiếp tục.
								</p>
							</div>

							<form className="space-y-6" onSubmit={handleSubmit}>
								<div className="space-y-2">
									<Label htmlFor="identifier">Email hoặc tên đăng nhập</Label>
									<div className="relative">
										<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="identifier"
											type="text"
											placeholder="ban@coffeeshop.com"
											className="pl-9"
											autoComplete="username"
											value={identifier}
											onChange={(event) => setIdentifier(event.target.value)}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="password">Mật khẩu</Label>
									<div className="relative">
										<Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="password"
											type="password"
											placeholder="Nhập mật khẩu"
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
										Ghi nhớ đăng nhập
									</Label>
									<button
										type="button"
										className="text-primary hover:text-primary/90"
										onClick={() => navigate(APP_ROUTES.FORGOT_PASSWORD)}
									>
										Quên mật khẩu?
									</button>
								</div>

								{errorMessage ? (
									<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive whitespace-pre-line">
										{errorMessage}
									</div>
								) : null}

								<Button type="submit" className="w-full" disabled={isSubmitting}>
									{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
								</Button>
							</form>
							<GoogleButton />	
							<div className="mt-6 text-center text-sm text-muted-foreground">
								Chưa có tài khoản?{" "}
								<button type="button" className="text-primary hover:text-primary/90" onClick={() => navigate(APP_ROUTES.REGISTER)}>
									Đăng ký ngay!
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
