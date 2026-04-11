import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coffee, Lock, Mail, Eye, EyeOff, X, AlertTriangle } from "lucide-react";
import GoogleButton from "@/components/ui/GoogleButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROUTES, STORAGE_KEYS } from "@/constants";
import authenticationService from "@/services/authenticationService";
import { cartService } from "@/services/cartService";
import receiptSettingService from "@/services/receiptSettingService";
import { toast } from "sonner";

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
	const [capsLockActive, setCapsLockActive] = useState(false);
	const [storeName, setStoreName] = useState(() => {
		return localStorage.getItem("cached_store_name") || "Coffee Shop";
	});

	useEffect(() => {
		const fetchLogo = async () => {
			try {
				const res = await receiptSettingService.getActive();
				const data = res?.data || null;
				if (data && data.store_name) {
					setStoreName(data.store_name);
					localStorage.setItem("cached_store_name", data.store_name);
				}
			} catch (e) {
				// ignore
			}
		};
		fetchLogo();
	}, []);

	// Tự động detect Caps Lock
	useEffect(() => {
		const handleGlobalKeyDown = (e) => {
			if (e.getModifierState && e.getModifierState("CapsLock")) {
				setCapsLockActive(true);
			} else {
				setCapsLockActive(false);
			}
		};
		window.addEventListener("keydown", handleGlobalKeyDown);
		window.addEventListener("keyup", handleGlobalKeyDown);
		return () => {
			window.removeEventListener("keydown", handleGlobalKeyDown);
			window.removeEventListener("keyup", handleGlobalKeyDown);
		};
	}, []);

	// Redirect if already logged in
	useEffect(() => {
		const token =
			localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
			sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
		if (token) {
			navigate("/customer/profile", { replace: true });
		}
	}, [navigate]);

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
			storage.setItem(STORAGE_KEYS.AUTH_PROVIDER, "password");
			if (storage !== localStorage) {
				localStorage.removeItem(STORAGE_KEYS.AUTH_PROVIDER);
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

			try {
				await cartService.syncAfterLogin();
			} catch (cartError) {
				console.error('Cart sync failed after login:', cartError);
				toast.error('Đồng bộ giỏ hàng không thành công. Bạn vẫn có thể tiếp tục.');
			}

			toast.success("Chào mừng bạn đã trở lại!");

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
					<div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-amber-400/20 dark:bg-amber-600/10 blur-[100px]" />
					<div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-orange-400/20 dark:bg-orange-600/10 blur-[120px]" />
				</div>

				<button
					onClick={() => navigate('/')}
					className="absolute top-6 left-6 z-50 flex items-center justify-center p-2.5 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-all hover:scale-105 hover:shadow-lg"
					title="Quay lại trang chủ"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<div className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
					{/* Cột trái: Ảnh nền & Nội dung giới thiệu */}
					<div className="hidden lg:flex relative items-center justify-center overflow-hidden p-10 animate-in fade-in duration-1000">
						<div className="absolute inset-0">
							<img
								src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1200&q=80"
								alt="Coffee Shop Background"
								className="h-full w-full object-cover transition-transform duration-[15s] hover:scale-110"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-[2px]" />
						</div>

						<div className="relative z-10 max-w-md space-y-6">
							<div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm text-white shadow-lg">
								<Coffee className="h-4 w-4 text-amber-400 animate-pulse" />
								<span className="font-medium tracking-wide">Đăng nhập dành cho mọi người</span>
							</div>
							<div className="space-y-4">
								<h1 className="text-4xl font-extrabold text-white lg:text-6xl leading-tight drop-shadow-md">
									{storeName}
								</h1>
								<p className="text-base font-medium text-gray-200 drop-shadow-sm leading-relaxed">
									Khám phá thế giới cà phê đầy hương vị. Đặt món nhanh, tích điểm thưởng và quản lý đơn hàng ngay hôm nay.
								</p>
							</div>
							<div className="grid gap-4 text-sm text-gray-200 mt-8">
								{[
									"Đặt món nhanh, theo dõi trạng thái đơn hàng",
									"Tích điểm thành viên và nhận ưu đãi cá nhân hóa",
									"Quản lý cửa hàng mượt mà cho đội ngũ nhân viên"
								].map((text, idx) => (
									<div key={idx} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-5 py-3.5 shadow-sm transition-all hover:bg-white/10">
										<div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
											<span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
										</div>
										<span className="font-medium">{text}</span>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Cột phải: Form đăng nhập (Glassmorphism) */}
					<div className="flex items-center justify-center p-6 sm:p-8 lg:p-12 relative z-10">
						<div className="w-full max-w-[420px] rounded-[28px] border border-white/50 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] animate-in fade-in zoom-in-[0.98] duration-700">
							<div className="mb-8 space-y-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '100ms' }}>
								<div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3 transition-transform hover:rotate-6">
									<Coffee className="w-8 h-8 text-amber-600 dark:text-amber-500" />
								</div>
								<h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Đăng nhập</h2>
								<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
									Trải nghiệm hành trình cà phê tuyệt đỉnh
								</p>
							</div>

							<form className="space-y-6" onSubmit={handleSubmit}>
								<div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '200ms' }}>
									<Label htmlFor="identifier" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Email hoặc tên đăng nhập</Label>
									<div className="relative group">
										<Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
										<Input
											id="identifier"
											type="text"
											placeholder="ban@coffeeshop.com"
											className="pl-11 pr-10 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium"
											autoComplete="username"
											autoFocus
											value={identifier}
											onChange={(event) => setIdentifier(event.target.value)}
										/>
										{identifier && (
											<button
												type="button"
												onClick={() => setIdentifier("")}
												className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
												title="Xóa nhanh"
											>
												<X className="h-4 w-4" />
											</button>
										)}
									</div>
								</div>

								<div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '300ms' }}>
									<Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Mật khẩu</Label>
									<div className="relative group">
										<Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											placeholder="••••••••"
											className="pl-11 pr-12 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium"
											autoComplete="current-password"
											value={password}
											onChange={(event) => setPassword(event.target.value)}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
											title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
										>
											{showPassword ? (
												<EyeOff className="h-5 w-5" />
											) : (
												<Eye className="h-5 w-5" />
											)}
										</button>
									</div>
									{capsLockActive && (
										<div className="flex items-center gap-1.5 mt-1.5 ml-1 text-amber-600 dark:text-amber-500 text-xs font-semibold animate-in fade-in zoom-in">
											<AlertTriangle className="w-3.5 h-3.5" />
											<span>Caps Lock đang bật</span>
										</div>
									)}
								</div>

								<div className="flex items-center justify-between text-sm animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '400ms' }}>
									<Label htmlFor="remember" className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400 font-medium">
										<Checkbox
											id="remember"
											checked={remember}
											onCheckedChange={(checked) => setRemember(Boolean(checked))}
											className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 rounded-md w-5 h-5"
										/>
										Ghi nhớ đăng nhập
									</Label>
									<button
										type="button"
										className="text-amber-600 dark:text-amber-500 font-bold hover:underline transition-all hover:text-amber-700"
										onClick={() => navigate(APP_ROUTES.FORGOT_PASSWORD)}
									>
										Quên mật khẩu?
									</button>
								</div>

								{errorMessage ? (
									<div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/50 px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium whitespace-pre-line flex items-start gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2">
										<AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
										<span>{errorMessage}</span>
									</div>
								) : null}

								<div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '500ms' }}>
									<Button
										type="submit"
										className="w-full h-12 rounded-xl text-base font-bold text-white shadow-lg bg-amber-600 hover:bg-amber-700 dark:hover:bg-amber-600/90 hover:shadow-amber-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
										disabled={isSubmitting}
									>
										{isSubmitting ? "Đang xử lý..." : "Đăng nhập ngay"}
									</Button>
								</div>
							</form>

							<div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '600ms' }}>
								<GoogleButton />

								<div className="mt-8 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
									Chưa có tài khoản?{" "}
									<button
										type="button"
										className="text-amber-600 dark:text-amber-500 font-bold hover:underline ml-1"
										onClick={() => navigate(APP_ROUTES.REGISTER)}
									>
										Tạo tài khoản mới
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
