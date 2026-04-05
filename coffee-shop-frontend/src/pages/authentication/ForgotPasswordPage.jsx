import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Mail, CheckCircle2, AlertCircle, Shield, Eye, EyeOff, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROUTES } from "@/constants";
import authenticationService from "@/services/authenticationService";
import { toast } from "sonner";

const calculatePasswordStrength = (pwd) => {
	const hasLower = /[a-z]/.test(pwd);
	const hasUpper = /[A-Z]/.test(pwd);
	const hasNumber = /[0-9]/.test(pwd);
	const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd);
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

const StepHeader = ({ current, number, title, isCompleted }) => {
	const isActive = current === number;

	return (
		<div className="flex items-center gap-3">
			{isCompleted ? (
				<CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
			) : (
				<div
					className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
						isActive ? "border-primary bg-primary text-primary-foreground" : "border-muted"
					}`}
				>
					{number}
				</div>
			)}
			<span className={`font-medium ${isActive ? "text-foreground" : isCompleted ? "text-muted-foreground" : "text-muted-foreground"}`}>
				{title}
			</span>
		</div>
	);
};

export default function ForgotPasswordPage() {
	const navigate = useNavigate();

	// Step states
	const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3
	const [completedSteps, setCompletedSteps] = useState({
		1: false,
		2: false,
	});

	// Form states
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordStrength, setPasswordStrength] = useState(0);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	// Error & loading states
	const [errorMessage, setErrorMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [userEmail, setUserEmail] = useState("");

	const handleEmailSubmit = async (e) => {
		e.preventDefault();
		if (isSubmitting) return;

		setErrorMessage("");

		if (!email.trim()) {
			setErrorMessage("Vui lòng nhập email");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await authenticationService.resetPassword(email);

			if (!response?.success) {
				throw new Error(response?.message || "Không thể gửi mã reset");
			}

			setUserEmail(email);
			setCompletedSteps((prev) => ({ ...prev, 1: true }));
			setCurrentStep(2);
			toast.success("Mã xác thực đã được gửi đến email của bạn");
		} catch (error) {
			const message = error?.response?.data?.message || error?.message || "Không thể gửi mã reset";
			setErrorMessage(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOtpSubmit = async (e) => {
		e.preventDefault();
		if (isSubmitting) return;

		setErrorMessage("");

		if (!otp.trim()) {
			setErrorMessage("Vui lòng nhập mã OTP");
			return;
		}

		if (otp.length !== 8) {
			setErrorMessage("Mã OTP phải là 8 chữ số");
			return;
		}

		setIsSubmitting(true);

		try {
			const verifyResponse = await authenticationService.verifyForgotPasswordOtp(userEmail, otp);

			if (!verifyResponse?.success) {
				throw new Error(verifyResponse?.message || "Mã OTP không hợp lệ");
			}

			setCompletedSteps((prev) => ({ ...prev, 2: true }));
			setCurrentStep(3);
			toast.success("Xác thực OTP thành công");
		} catch (error) {
			const message = error?.response?.data?.message || error?.message || "Mã OTP không hợp lệ";
			setErrorMessage(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handlePasswordSubmit = async (e) => {
		e.preventDefault();
		if (isSubmitting) return;

		setErrorMessage("");

		if (!newPassword) {
			setErrorMessage("Vui lòng nhập mật khẩu mới");
			return;
		}

		if (newPassword !== confirmPassword) {
			setErrorMessage("Mật khẩu xác nhận không khớp");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await authenticationService.resetPasswordWithOtp({
				email: userEmail,
				otp,
				newPassword,
				confirmPassword,
			});

			if (!response?.success) {
				throw new Error(response?.message || "Không thể đặt lại mật khẩu");
			}

			toast.success("Đặt lại mật khẩu thành công! Đang chuyển hướng...");

			setTimeout(() => {
				navigate(APP_ROUTES.LOGIN, { replace: true });
			}, 2000);
		} catch (error) {
			const message = error?.response?.data?.message || error?.message || "Không thể đặt lại mật khẩu";
			setErrorMessage(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handlePasswordChange = (value) => {
		setNewPassword(value);
		setPasswordStrength(calculatePasswordStrength(value));
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
								<span>Khôi phục tài khoản của bạn</span>
							</div>
							<div className="space-y-3">
								<h1 className="text-3xl font-bold text-white lg:text-5xl leading-tight">
									Coffee Shop
								</h1>
								<p className="text-base text-gray-200">
									Bạn lỡ quên mật khẩu? Đừng lo lắng, hãy làm theo các bước bên phải để khôi phục tài khoản dễ dàng.
								</p>
							</div>
							<div className="grid gap-3 text-sm text-gray-200">
								<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-amber-400" />
									Bảo mật thông tin chặt chẽ qua OTP
								</div>
								<div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-amber-400" />
									Thiết lập lại mật khẩu an toàn, nhanh chóng
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-center p-8 lg:p-12">
						<div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
							<div className="mb-12 space-y-2">
								<h1 className="text-3xl font-semibold text-foreground">Đặt lại mật khẩu</h1>
								<p className="mt-2 text-muted-foreground">Làm theo hướng dẫn bên dưới nhé!</p>
							</div>

				{/* Progress Steps */}
				<div className="mb-12 space-y-4">
					<StepHeader current={currentStep} number={1} title="Xác nhận Email" isCompleted={completedSteps[1]} />
					<StepHeader current={currentStep} number={2} title="Xác thực Mã OTP" isCompleted={completedSteps[2]} />
					<StepHeader current={currentStep} number={3} title="Đặt Mật khẩu Mới" isCompleted={false} />
				</div>

				{/* Form Container */}
				<div className="rounded-2xl border-2 border-primary bg-card p-8 shadow-lg">
					{/* Step 1: Email */}
					{currentStep === 1 && (
						<form className="space-y-6" onSubmit={handleEmailSubmit}>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="email" className="text-base">
										Email đã đăng ký
									</Label>
									<div className="relative">
										<Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="email"
											type="email"
											placeholder="you@example.com"
											className="pl-10 h-11"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											autoFocus
										/>
									</div>
								</div>

								{errorMessage && (
									<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
										<AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
										<span>{errorMessage}</span>
									</div>
								)}
							</div>

							<Button type="submit" className="w-full h-11" disabled={isSubmitting}>
								{isSubmitting ? "Đang gửi..." : "Gửi mã xác thực"}
							</Button>
						</form>
					)}

					{/* Step 2: OTP */}
					{currentStep === 2 && (
						<form className="space-y-6" onSubmit={handleOtpSubmit}>
							<div className="space-y-4">
								<p className="text-sm text-muted-foreground">
									Mã OTP đã được gửi đến <strong>{userEmail}</strong>
								</p>

								<div className="space-y-2">
									<Label htmlFor="otp" className="text-base">
										Mã OTP (8 chữ số)
									</Label>
									<div className="relative">
										<Shield className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="otp"
											type="text"
											placeholder="Nhập 8 chữ số"
											maxLength={8}
											className="pl-10 h-11 text-center text-lg tracking-widest font-mono"
											value={otp}
											onChange={(e) => {
												const value = e.target.value.replace(/\D/g, "");
												setOtp(value);
											}}
											autoFocus
										/>
									</div>
								</div>

								{errorMessage && (
									<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
										<AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
										<span>{errorMessage}</span>
									</div>
								)}
							</div>

							<Button type="submit" className="w-full h-11" disabled={isSubmitting}>
								{isSubmitting ? "Đang xác thực..." : "Xác thực OTP"}
							</Button>
						</form>
					)}

					{/* Step 3: New Password */}
					{currentStep === 3 && (
						<form className="space-y-6" onSubmit={handlePasswordSubmit}>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="newPassword" className="text-base">
										Mật khẩu mới
									</Label>
									<div className="relative">
										<Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="newPassword"
											type={showNewPassword ? "text" : "password"}
											placeholder="Nhập mật khẩu mới"
											className="pl-10 pr-10 h-11"
											value={newPassword}
											onChange={(e) => handlePasswordChange(e.target.value)}
											autoFocus
										/>
										<button
											type="button"
											onClick={() => setShowNewPassword(!showNewPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
										>
											{showNewPassword ? (
												<EyeOff className="h-5 w-5" />
											) : (
												<Eye className="h-5 w-5" />
											)}
										</button>
									</div>

									{newPassword && (
										<div className="space-y-3 mt-4">
											<div className="flex items-center justify-between text-xs">
												<span className="text-muted-foreground font-medium">Độ mạnh:</span>
												<span
													className={`font-semibold ${
														passwordStrength === 1
															? "text-red-500"
															: passwordStrength === 2
															? "text-yellow-500"
															: passwordStrength === 3
															? "text-blue-500"
															: passwordStrength === 4
															? "text-green-500"
															: ""
													}`}
												>
													{getPasswordStrengthLabel(passwordStrength)}
												</span>
											</div>
											<div className="flex h-2 gap-1 overflow-hidden rounded-full bg-muted">
												{[1, 2, 3, 4].map((level) => (
													<div
														key={level}
														className={`flex-1 transition-all ${
															passwordStrength >= level
																? getPasswordStrengthColor(passwordStrength)
																: "bg-muted"
														}`}
													/>
												))}
											</div>
											<div className="space-y-1.5 text-xs text-muted-foreground">
												<p className={/[a-z]/.test(newPassword) ? "text-green-600 font-medium" : ""}>
													{/[a-z]/.test(newPassword) ? "✓" : "○"} Chữ thường (a-z)
												</p>
												<p className={/[A-Z]/.test(newPassword) ? "text-green-600 font-medium" : ""}>
													{/[A-Z]/.test(newPassword) ? "✓" : "○"} Chữ hoa (A-Z)
												</p>
												<p className={/[0-9]/.test(newPassword) ? "text-green-600 font-medium" : ""}>
													{/[0-9]/.test(newPassword) ? "✓" : "○"} Số (0-9)
												</p>
												<p
													className={
														/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newPassword)
															? "text-green-600 font-medium"
															: ""
													}
												>
													{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newPassword)
														? "✓"
														: "○"}{" "}
													Ký tự đặc biệt (!@#$...)
												</p>
												<p
													className={
														newPassword.length >= 8 && newPassword.length <= 20
															? "text-green-600 font-medium"
															: ""
													}
												>
													{newPassword.length >= 8 && newPassword.length <= 20 ? "✓" : "○"} Độ dài 8-20 ký tự
												</p>
											</div>
										</div>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="confirmPassword" className="text-base">
										Xác nhận mật khẩu mới
									</Label>
									<div className="relative">
										<Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="confirmPassword"
											type={showConfirmPassword ? "text" : "password"}
											placeholder="Nhập lại mật khẩu mới"
											className="pl-10 pr-10 h-11"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
										>
											{showConfirmPassword ? (
												<EyeOff className="h-5 w-5" />
											) : (
												<Eye className="h-5 w-5" />
											)}
										</button>
									</div>
								</div>

								{errorMessage && (
									<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
										<AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
										<span>{errorMessage}</span>
									</div>
								)}
							</div>

							<Button type="submit" className="w-full h-11" disabled={isSubmitting}>
								{isSubmitting ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
							</Button>
						</form>
					)}
				</div>

				<div className="mt-8 text-center text-sm text-muted-foreground">
					Bạn nhớ mật khẩu rồi?{" "}
					<button
						type="button"
						className="text-primary hover:text-primary/90 font-medium transition-colors"
						onClick={() => navigate(APP_ROUTES.LOGIN)}
					>
						Đăng nhập
					</button>
				</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
