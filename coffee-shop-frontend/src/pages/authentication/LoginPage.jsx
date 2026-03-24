import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coffee, Lock, Mail, Eye, EyeOff } from "lucide-react";
import GoogleButton from "@/components/ui/GoogleButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROUTES, STORAGE_KEYS } from "@/constants";
import authenticationService from "@/services/authenticationService";

const REMEMBER_ME_KEYS = {
	IDENTIFIER: "coffee_shop_remember_identifier",
	PASSWORD: "coffee_shop_remember_password",
};

export default function LoginPage() {
	const navigate = useNavigate();
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	// Load saved credentials on component mount
	useEffect(() => {
		const savedIdentifier = localStorage.getItem(REMEMBER_ME_KEYS.IDENTIFIER);
		const savedPassword = localStorage.getItem(REMEMBER_ME_KEYS.PASSWORD);

		if (savedIdentifier && savedPassword) {
			setIdentifier(savedIdentifier);
			setPassword(savedPassword);
			setRemember(true);
		}
	}, []);

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

			// Save credentials if remember is checked
			if (remember) {
				localStorage.setItem(REMEMBER_ME_KEYS.IDENTIFIER, identifier);
				localStorage.setItem(REMEMBER_ME_KEYS.PASSWORD, password);
			} else {
				// Clear saved credentials if remember is unchecked
				localStorage.removeItem(REMEMBER_ME_KEYS.IDENTIFIER);
				localStorage.removeItem(REMEMBER_ME_KEYS.PASSWORD);
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

				<button 
					onClick={() => navigate('/')} 
					className="absolute top-6 left-6 z-50 flex items-center justify-center p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-all hover:scale-105"
					title="Quay lại trang chủ"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
					<div className="hidden lg:flex relative items-center justify-center overflow-hidden p-10">
						<div className="absolute inset-0">
							<img 
								src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1200&q=80" 
								alt="Coffee Shop Background" 
								className="h-full w-full object-cover"
							/>
							<div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
						</div>
						
						<div className="relative z-10 max-w-md space-y-6">
							<div className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-sm text-white">
								<Coffee className="h-4 w-4 text-amber-400" />
								<span>Đăng nhập dành cho mọi người</span>
							</div>
							<div className="space-y-3">
								<h1 className="text-3xl font-bold text-white lg:text-5xl leading-tight">
									Coffee Shop
								</h1>
								<p className="text-base text-gray-200">
									Đăng nhập để đặt món, theo dõi đơn hàng, hoặc quản lý vận hành cửa hàng trong cùng một hệ thống.
								</p>
							</div>
							<div className="grid gap-3 text-sm text-gray-200">
								<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-amber-400" />
									Đặt món nhanh, theo dõi trạng thái đơn hàng
								</div>
								<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-amber-400" />
									Tích điểm thành viên và nhận ưu đãi cá nhân hóa
								</div>
								<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-amber-400" />
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
											type={showPassword ? "text" : "password"}
											placeholder="Nhập mật khẩu"
											className="pl-9 pr-10"
											autoComplete="current-password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
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
