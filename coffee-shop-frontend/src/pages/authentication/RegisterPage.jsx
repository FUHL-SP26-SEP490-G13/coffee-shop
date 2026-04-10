import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coffee, Lock, Mail, User, Phone, CheckCircle2, AlertCircle, Shield, Eye, EyeOff, X, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APP_ROUTES, STORAGE_KEYS } from "@/constants";
import authenticationService from "@/services/authenticationService";

export default function RegisterPage() {
	const navigate = useNavigate();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [validationErrors, setValidationErrors] = useState({});
	const [passwordStrength, setPasswordStrength] = useState(0);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [showOtpModal, setShowOtpModal] = useState(false);
	const [otp, setOtp] = useState("");
	const [otpError, setOtpError] = useState("");
	const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
	const [registrationData, setRegistrationData] = useState(null);
	const [capsLockActive, setCapsLockActive] = useState(false);

	// Detect Caps Lock globally
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

	// Hàm tính độ mạnh password
	const calculatePasswordStrength = (pwd) => {
		const hasLower = /[a-z]/.test(pwd);
		const hasUpper = /[A-Z]/.test(pwd);
		const hasNumber = /[0-9]/.test(pwd);
		const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
		const lengthValid = pwd.length >= 8 && pwd.length <= 20;

		let strength = 0;
		if (hasLower) strength += 1;
		if (hasUpper) strength += 1;
		if (hasNumber) strength += 1;
		if (hasSpecial) strength += 1;
		if (lengthValid) strength += 1;

		return Math.min(strength, 4);
	};

	const getPasswordStrengthLabel = (strength) => {
		const labels = ["", "Yếu", "Trung bình", "Khá mạnh", "Rất mạnh"];
		return labels[strength];
	};

	const getPasswordStrengthColor = (strength) => {
		const colors = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
		return colors[strength];
	};

	const isValidPasswordStrict = (pwd) => {
		if (pwd.length < 8 || pwd.length > 20) return false;
		if (!/[a-z]/.test(pwd)) return false;
		if (!/[A-Z]/.test(pwd)) return false;
		if (!/[0-9]/.test(pwd)) return false;
		if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return false;
		return true;
	};

	const isValidEmail = (emailAddress) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(emailAddress);
	};

	const isValidPhone = (phoneNumber) => {
		const cleaned = phoneNumber.replace(/\s/g, "");
		const phoneRegex = /^(\+84|0)[0-9]{9,11}$/;
		return phoneRegex.test(cleaned) && cleaned.length <= 12;
	};

	const isValidUsername = (user) => {
		return user.length >= 3 && /^[a-zA-Z0-9_]+$/.test(user);
	};

	const validateForm = () => {
		const errors = {};

		if (!firstName.trim()) {
			errors.firstName = "Họ không được để trống";
		}
		if (!lastName.trim()) {
			errors.lastName = "Tên không được để trống";
		}
		if (!email.trim()) {
			errors.email = "Email không được để trống";
		} else if (!isValidEmail(email)) {
			errors.email = "Email không hợp lệ";
		}
		if (!phone.trim()) {
			errors.phone = "Số điện thoại không được để trống";
		} else if (!isValidPhone(phone)) {
			errors.phone = "Số điện thoại không hợp lệ";
		}
		if (!username.trim()) {
			errors.username = "Username không được trống";
		} else if (!isValidUsername(username)) {
			errors.username = "Username ≥ 3 ký tự, chỉ chứa chữ/số/_";
		}
		if (!password) {
			errors.password = "Mật khẩu không được để trống";
		} else if (!isValidPasswordStrict(password)) {
			errors.password = "Mật khẩu 8-20 ký tự, có chữ hoa, thường, số, ký tự đặc biệt";
		}
		if (!confirmPassword) {
			errors.confirmPassword = "Xác nhận mật khẩu không được trống";
		} else if (password !== confirmPassword) {
			errors.confirmPassword = "Mật khẩu xác nhận không khớp";
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (isSubmitting) return;

		setErrorMessage("");
		setSuccessMessage("");

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		try {
			const registerResponse = await authenticationService.register({
				first_name: firstName,
				last_name: lastName,
				email: email.toLowerCase(),
				phone: phone.replace(/\s/g, ""),
				username: username,
				password,
				password_confirm: confirmPassword,
			});

			if (!registerResponse?.success) {
				throw new Error(registerResponse?.message || "Đăng ký thất bại");
			}

			const userId = registerResponse.data.user.id;
			
			const data = {
				first_name: firstName,
				last_name: lastName,
				email: email.toLowerCase(),
				phone: phone.replace(/\s/g, ""),
				username: username,
				password,
				password_confirm: confirmPassword,
				userId: userId,
			};
			setRegistrationData(data);
			
			const otpResponse = await authenticationService.sendOTP(userId);
			
			if (!otpResponse?.success) {
				throw new Error(otpResponse?.message || "Không thể gửi mã OTP");
			}
			
			setShowOtpModal(true);
			setSuccessMessage("Mã OTP đã được gửi đến email của bạn");
		} catch (error) {
			const message =
				error?.response?.data?.message ||
				error?.message ||
				"Đăng ký thất bại";
			setErrorMessage(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleVerifyOtp = async () => {
		if (!otp || otp.length !== 8) {
			setOtpError("Vui lòng nhập mã OTP 8 chữ số");
			return;
		}

		setIsVerifyingOtp(true);
		setOtpError("");

		try {
			const response = await authenticationService.verifyEmail(registrationData.userId, otp);

			if (!response?.success) {
				throw new Error(response?.message || "Xác thực OTP thất bại");
			}

			setShowOtpModal(false);
			setSuccessMessage("Xác thực email thành công! Đang chuyển hướng...");

			setTimeout(() => {
				navigate(APP_ROUTES.LOGIN, { replace: true });
			}, 2000);
		} catch (error) {
			const message =
				error?.response?.data?.message ||
				error?.message ||
				"Mã OTP không hợp lệ";
			setOtpError(message);
		} finally {
			setIsVerifyingOtp(false);
		}
	};

	const handleResendOtp = async () => {
		try {
			const response = await authenticationService.sendOTP(registrationData.userId);
			
			if (!response?.success) {
				throw new Error(response?.message || "Không thể gửi lại mã OTP");
			}
			
			setSuccessMessage("Mã OTP mới đã được gửi đến email của bạn");
			setOtp("");
			setOtpError("");
		} catch (error) {
			const message =
				error?.response?.data?.message ||
				error?.message ||
				"Không thể gửi lại mã OTP. Vui lòng thử lại sau.";
			setOtpError(message);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="relative min-h-screen overflow-hidden">
				{/* Hiệu ứng Glow nền */}
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
					<div className="hidden lg:flex relative items-center justify-center overflow-hidden p-10 animate-in fade-in duration-1000">
						<div className="absolute inset-0">
							<img 
								src="https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&w=1200&q=80" 
								alt="Coffee Shop Background" 
								className="h-full w-full object-cover transition-transform duration-[15s] hover:scale-110"
							/>
							<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-[2px]" />
						</div>

						<div className="relative z-10 max-w-md space-y-6">
							<div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-5 py-2 text-sm text-white shadow-lg">
								<Coffee className="h-4 w-4 text-amber-400 animate-pulse" />
								<span className="font-medium tracking-wide">Coffee Shop Member</span>
							</div>
							<div className="space-y-4">
								<h1 className="text-4xl font-extrabold text-white lg:text-5xl leading-tight drop-shadow-md">
									Tham gia cộng đồng
								</h1>
								<p className="text-base font-medium text-gray-200 drop-shadow-sm leading-relaxed">
									Đăng ký tài khoản để tận hưởng những ưu đãi đặc biệt, theo dõi đơn hàng và nhận thông báo về các khuyến mãi mới.
								</p>
							</div>
							<div className="grid gap-4 text-sm text-gray-200 mt-8">
								{[
									"Mua hàng trực tuyến và tích điểm thưởng",
									"Nhận thông báo về khuyến mãi độc quyền",
									"Quản lý lịch sử đơn hàng mượt mà"
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

					<div className="flex items-center justify-center p-6 sm:p-8 lg:p-12 relative z-10 py-16">
						<div className="w-full max-w-[480px] rounded-[28px] border border-white/50 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] animate-in fade-in zoom-in-[0.98] duration-700">
							<div className="mb-8 space-y-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '100ms' }}>
								<div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner -rotate-3 transition-transform hover:rotate-3">
									<User className="w-8 h-8 text-amber-600 dark:text-amber-500" />
								</div>
								<h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Tạo tài khoản mới</h2>
								<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
									Nhập thông tin của bạn bên dưới để bắt đầu
								</p>
							</div>

							<form className="space-y-4" onSubmit={handleSubmit}>
								{/* Name */}
								<div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '200ms' }}>
									<div className="space-y-2">
										<Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Họ</Label>
										<div className="relative group">
											<User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
											<Input
												id="firstName"
												type="text"
												placeholder="Họ của bạn"
												className={`pl-11 pr-3 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium ${validationErrors.firstName ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50" : ""}`}
												value={firstName}
												autoFocus
												onChange={(e) => {
													setFirstName(e.target.value);
													if (validationErrors.firstName) setValidationErrors({...validationErrors, firstName: ""});
												}}
											/>
										</div>
										{validationErrors.firstName && (
											<p className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs font-semibold text-red-500 animate-in fade-in zoom-in">
												<AlertCircle className="h-3.5 w-3.5" />
												{validationErrors.firstName}
											</p>
										)}
									</div>
									<div className="space-y-2">
										<Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Tên</Label>
										<div className="relative group">
											<User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
											<Input
												id="lastName"
												type="text"
												placeholder="Tên của bạn"
												className={`pl-11 pr-3 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium ${validationErrors.lastName ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50" : ""}`}
												value={lastName}
												onChange={(e) => {
													setLastName(e.target.value);
													if (validationErrors.lastName) setValidationErrors({...validationErrors, lastName: ""});
												}}
											/>
										</div>
										{validationErrors.lastName && (
											<p className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs font-semibold text-red-500 animate-in fade-in zoom-in">
												<AlertCircle className="h-3.5 w-3.5" />
												{validationErrors.lastName}
											</p>
										)}
									</div>
								</div>

								{/* Email */}
								<div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '300ms' }}>
									<Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Email</Label>
									<div className="relative group">
										<Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
										<Input
											id="email"
											type="email"
											placeholder="you@example.com"
											className={`pl-11 pr-10 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium ${validationErrors.email ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50" : ""}`}
											autoComplete="email"
											value={email}
											onChange={(e) => {
												setEmail(e.target.value);
												if (validationErrors.email) setValidationErrors({...validationErrors, email: ""});
											}}
										/>
										{email && (
											<button
												type="button"
												onClick={() => setEmail("")}
												className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
											>
												<X className="h-4 w-4" />
											</button>
										)}
									</div>
									{validationErrors.email && (
										<p className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs font-semibold text-red-500 animate-in fade-in zoom-in">
											<AlertCircle className="h-3.5 w-3.5" />
											{validationErrors.email}
										</p>
									)}
								</div>

								{/* Phone */}
								<div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '400ms' }}>
									<Label htmlFor="phone" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Số điện thoại</Label>
									<div className="relative group">
										<Phone className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
										<Input
											id="phone"
											type="tel"
											placeholder="0912345678"
											className={`pl-11 pr-10 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium ${validationErrors.phone ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50" : ""}`}
											autoComplete="tel"
											value={phone}
											onChange={(e) => {
												setPhone(e.target.value);
												if (validationErrors.phone) setValidationErrors({...validationErrors, phone: ""});
											}}
										/>
									</div>
									{validationErrors.phone && (
										<p className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs font-semibold text-red-500 animate-in fade-in zoom-in">
											<AlertCircle className="h-3.5 w-3.5" />
											{validationErrors.phone}
										</p>
									)}
								</div>

								{/* Username */}
								<div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '500ms' }}>
									<Label htmlFor="username" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Tên đăng nhập (Username)</Label>
									<div className="relative group">
										<User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
										<Input
											id="username"
											type="text"
											placeholder="username123"
											className={`pl-11 pr-10 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium ${validationErrors.username ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50" : ""}`}
											autoComplete="username"
											value={username}
											onChange={(e) => {
												setUsername(e.target.value);
												if (validationErrors.username) setValidationErrors({...validationErrors, username: ""});
											}}
										/>
									</div>
									{validationErrors.username && (
										<p className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs font-semibold text-red-500 animate-in fade-in zoom-in">
											<AlertCircle className="h-3.5 w-3.5" />
											{validationErrors.username}
										</p>
									)}
								</div>

								{/* Password */}
								<div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '600ms' }}>
									<Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Mật khẩu</Label>
									<div className="relative group">
										<Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											placeholder="Nhập mật khẩu"
											className={`pl-11 pr-12 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium ${validationErrors.password ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50" : ""}`}
											autoComplete="new-password"
											value={password}
											onChange={(e) => {
												const pwd = e.target.value;
												setPassword(pwd);
												setPasswordStrength(calculatePasswordStrength(pwd));
												if (validationErrors.password) setValidationErrors({...validationErrors, password: ""});
											}}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
										>
											{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
										</button>
									</div>

									{capsLockActive && (
										<div className="flex items-center gap-1.5 mt-1.5 ml-1 text-amber-600 dark:text-amber-500 text-xs font-semibold animate-in fade-in zoom-in">
											<AlertTriangle className="w-3.5 h-3.5" />
											<span>Caps Lock đang bật</span>
										</div>
									)}

									{password && (
										<div className="space-y-2 mt-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
											<div className="flex items-center justify-between text-xs">
												<span className="text-gray-600 dark:text-gray-400 font-semibold">Độ mạnh mật khẩu:</span>
												<span className={`font-bold ${
													passwordStrength === 1 ? "text-red-500" :
													passwordStrength === 2 ? "text-yellow-500" :
													passwordStrength === 3 ? "text-blue-500" :
													passwordStrength === 4 ? "text-green-500" : ""
												}`}>
													{getPasswordStrengthLabel(passwordStrength)}
												</span>
											</div>
											<div className="h-1.5 flex gap-1 bg-transparent rounded-full overflow-hidden">
												{[1, 2, 3, 4].map((level) => (
													<div
														key={level}
														className={`flex-1 rounded-full transition-all duration-300 ${
															passwordStrength >= level
																? getPasswordStrengthColor(passwordStrength)
																: "bg-gray-200 dark:bg-gray-700"
														}`}
													/>
												))}
											</div>
											<div className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1 mt-2">
												<p className={/[a-z]/.test(password) ? "text-green-600 dark:text-green-500 font-medium" : ""}>
													{/[a-z]/.test(password) ? "✓" : "○"} Chữ thường (a-z)
												</p>
												<p className={/[A-Z]/.test(password) ? "text-green-600 dark:text-green-500 font-medium" : ""}>
													{/[A-Z]/.test(password) ? "✓" : "○"} Chữ hoa (A-Z)
												</p>
												<p className={/[0-9]/.test(password) ? "text-green-600 dark:text-green-500 font-medium" : ""}>
													{/[0-9]/.test(password) ? "✓" : "○"} Số (0-9)
												</p>
												<p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "text-green-600 dark:text-green-500 font-medium" : ""}>
													{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "✓" : "○"} Ký tự đặc biệt (!@#$...)
												</p>
												<p className={password.length >= 8 && password.length <= 20 ? "text-green-600 dark:text-green-500 font-medium" : ""}>
													{password.length >= 8 && password.length <= 20 ? "✓" : "○"} Độ dài 8-20 ký tự
												</p>
											</div>
										</div>
									)}

									{validationErrors.password && (
										<p className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs font-semibold text-red-500 animate-in fade-in zoom-in">
											<AlertCircle className="h-3.5 w-3.5" />
											{validationErrors.password}
										</p>
									)}
								</div>

								{/* Confirm Password */}
								<div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '700ms' }}>
									<Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Xác nhận mật khẩu</Label>
									<div className="relative group">
										<Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
										<Input
											id="confirmPassword"
											type={showConfirmPassword ? "text" : "password"}
											placeholder="Nhập lại mật khẩu"
											className={`pl-11 pr-12 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium ${validationErrors.confirmPassword ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50" : ""}`}
											autoComplete="new-password"
											value={confirmPassword}
											onChange={(e) => {
												setConfirmPassword(e.target.value);
												if (validationErrors.confirmPassword) setValidationErrors({...validationErrors, confirmPassword: ""});
											}}
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
										>
											{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
										</button>
									</div>
									{validationErrors.confirmPassword && (
										<p className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs font-semibold text-red-500 animate-in fade-in zoom-in">
											<AlertCircle className="h-3.5 w-3.5" />
											{validationErrors.confirmPassword}
										</p>
									)}
								</div>

								{/* Error Message Global */}
								{errorMessage && (
									<div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/50 px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium flex items-start gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2">
										<AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
										<span>{errorMessage}</span>
									</div>
								)}

								{/* Success Message Global */}
								{successMessage && (
									<div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/50 px-4 py-3 text-sm text-green-600 dark:text-green-400 font-medium flex items-start gap-2.5 shadow-sm animate-in fade-in slide-in-from-top-2">
										<CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
										<span>{successMessage}</span>
									</div>
								)}

								<div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '800ms' }}>
									<Button
										type="submit"
										className="w-full h-12 rounded-xl text-base font-bold text-white shadow-lg bg-amber-600 hover:bg-amber-700 dark:hover:bg-amber-600/90 hover:shadow-amber-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0"
										disabled={isSubmitting}
									>
										{isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản ngay"}
									</Button>
								</div>
							</form>

							<div className="mt-8 text-center text-sm font-medium text-gray-600 dark:text-gray-400 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '900ms' }}>
								Đã có tài khoản?{" "}
								<button
									type="button"
									className="text-amber-600 dark:text-amber-500 font-bold hover:underline transition-all hover:text-amber-700 ml-1"
									onClick={() => navigate(APP_ROUTES.LOGIN)}
								>
									Đăng nhập ngay
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* OTP Verification Modal */}
			<Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
				<DialogContent className="sm:max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-3xl p-8">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3 text-2xl font-bold">
							<Shield className="h-6 w-6 text-amber-500" />
							Xác thực Email
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-base mt-2">
							Nhập mã OTP gồm 8 chữ số đã được gửi đến email <strong>{email}</strong>
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 mt-4">
						<div className="space-y-3">
							<Label htmlFor="otp" className="text-base font-semibold text-gray-700 dark:text-gray-300">Mã Xác Thực (OTP)</Label>
							<Input
								id="otp"
								type="text"
								placeholder="--------"
								maxLength={8}
								value={otp}
								onChange={(e) => {
									const value = e.target.value.replace(/\D/g, '');
									setOtp(value);
									if (otpError) setOtpError("");
								}}
								className={`h-14 text-center text-3xl tracking-[0.5em] font-mono rounded-xl bg-gray-50 dark:bg-black/20 focus-visible:ring-2 focus-visible:ring-amber-500/50 ${otpError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
							/>
							{otpError && (
								<p className="flex items-center justify-center gap-1.5 text-sm font-medium text-red-500 animate-in zoom-in">
									<AlertCircle className="h-4 w-4" />
									{otpError}
								</p>
							)}
						</div>

						<div className="flex flex-col gap-3">
							<Button
								onClick={handleVerifyOtp}
								disabled={isVerifyingOtp || !otp || otp.length !== 8}
								className="w-full h-12 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700"
							>
								{isVerifyingOtp ? "Đang xác thực..." : "Xác nhận mã OTP"}
							</Button>
							
							<Button
								variant="outline"
								onClick={handleResendOtp}
								disabled={isVerifyingOtp}
								className="w-full h-12 rounded-xl font-semibold text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
							>
								Gửi lại mã OTP mới
							</Button>
						</div>

						<p className="text-sm text-center text-gray-500 dark:text-gray-400 max-w-[80%] mx-auto">
							Không nhận được mã? Kiểm tra thư mục rác (spam) hoặc nhấn Gửi lại ở trên.
						</p>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
