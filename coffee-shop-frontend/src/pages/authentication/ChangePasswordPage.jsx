import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Eye, EyeOff, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
	const colors = ["", "bg-red-500", "bg-yellow-500", "bg-amber-500", "bg-green-500"];
	return colors[strength];
};

export default function ChangePasswordPage() {
	const navigate = useNavigate();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [passwordStrength, setPasswordStrength] = useState(0);
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [capsLockActive, setCapsLockActive] = useState(false);

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

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (isSubmitting) return;

		setErrorMessage("");

		if (!currentPassword) {
			setErrorMessage("Vui lòng nhập mật khẩu hiện tại");
			return;
		}

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
			const response = await authenticationService.changePassword({
				oldPassword: currentPassword,
				newPassword,
				confirmPassword,
			});

			if (!response?.success) {
				throw new Error(response?.message || "Đổi mật khẩu thất bại");
			}

			toast.success("Đổi mật khẩu thành công");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
			navigate(-1);
		} catch (error) {
			const message =
				error?.response?.data?.message ||
				error?.message ||
				"Đổi mật khẩu thất bại";
			setErrorMessage(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-background relative overflow-hidden">
			{/* Glow Background */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 dark:bg-amber-600/10 blur-[100px]" />
				<div className="absolute right-1/4 bottom-1/4 h-[600px] w-[600px] translate-x-1/2 translate-y-1/2 rounded-full bg-orange-400/10 dark:bg-orange-600/10 blur-[120px]" />
			</div>

			<div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12 relative z-10 w-full">
				<div className="w-full rounded-[28px] border border-white/50 dark:border-gray-800/80 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] animate-in fade-in zoom-in-[0.98] duration-700">
					
					<div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '100ms' }}>
						<button
							type="button"
							onClick={() => navigate(-1)}
							className="self-start flex items-center justify-center w-10 h-10 bg-white/50 hover:bg-white/90 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full transition-all hover:scale-105 shadow-sm border border-gray-200 dark:border-gray-700 absolute top-6 left-6"
							title="Quay lại"
						>
							<ArrowLeft className="w-5 h-5" />
						</button>
						<div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
							<Lock className="w-8 h-8 text-amber-600 dark:text-amber-500" />
						</div>
						<h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
							Thay đổi mật khẩu
						</h1>
						<p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
							Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
						</p>
					</div>

					<form className="space-y-6" onSubmit={handleSubmit}>
						{/* Current Password */}
						<div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '200ms' }}>
							<Label htmlFor="currentPassword" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Mật khẩu hiện tại</Label>
							<div className="relative group">
								<Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
								<Input
									id="currentPassword"
									type={showCurrentPassword ? "text" : "password"}
									placeholder="Nhập mật khẩu hiện tại"
									className="pl-11 pr-12 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium"
									autoComplete="current-password"
									value={currentPassword}
									onChange={(event) => setCurrentPassword(event.target.value)}
									autoFocus
								/>
								<button
									type="button"
									onClick={() => setShowCurrentPassword(!showCurrentPassword)}
									className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
								>
									{showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
							
							{capsLockActive && (
								<div className="flex items-center gap-1.5 mt-1.5 ml-1 text-amber-600 dark:text-amber-500 text-xs font-semibold animate-in fade-in zoom-in">
									<AlertTriangle className="w-3.5 h-3.5" />
									<span>Caps Lock đang bật</span>
								</div>
							)}
						</div>

						{/* New Password */}
						<div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '300ms' }}>
							<Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Mật khẩu mới</Label>
							<div className="relative group">
								<Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
								<Input
									id="newPassword"
									type={showNewPassword ? "text" : "password"}
									placeholder="Nhập mật khẩu mới"
									className="pl-11 pr-12 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium"
									autoComplete="new-password"
									value={newPassword}
									onChange={(event) => {
										const nextValue = event.target.value;
										setNewPassword(nextValue);
										setPasswordStrength(calculatePasswordStrength(nextValue));
									}}
								/>
								<button
									type="button"
									onClick={() => setShowNewPassword(!showNewPassword)}
									className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
								>
									{showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
							{newPassword && (
								<div className="space-y-2 mt-3 p-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
									<div className="flex items-center justify-between text-xs">
										<span className="text-gray-600 dark:text-gray-400 font-semibold">Độ mạnh:</span>
										<span className={`font-bold ${
											passwordStrength === 1 ? "text-red-500" :
											passwordStrength === 2 ? "text-yellow-500" :
											passwordStrength === 3 ? "text-amber-500" :
											passwordStrength === 4 ? "text-green-500" : ""
										}`}>
											{getPasswordStrengthLabel(passwordStrength)}
										</span>
									</div>
									<div className="h-1.5 flex gap-1 rounded-full overflow-hidden">
										{[1, 2, 3, 4].map((level) => (
											<div
												key={level}
												className={`flex-1 transition-all duration-300 rounded-full ${
													passwordStrength >= level
														? getPasswordStrengthColor(passwordStrength)
														: "bg-gray-200 dark:bg-gray-700"
												}`}
											/>
										))}
									</div>
									<div className="space-y-1 text-[11px] text-gray-500 dark:text-gray-400 mt-2">
										<p className={/[a-z]/.test(newPassword) ? "text-green-600 dark:text-green-500 font-medium" : ""}>
											{/[a-z]/.test(newPassword) ? "✓" : "○"} Chữ thường (a-z)
										</p>
										<p className={/[A-Z]/.test(newPassword) ? "text-green-600 dark:text-green-500 font-medium" : ""}>
											{/[A-Z]/.test(newPassword) ? "✓" : "○"} Chữ hoa (A-Z)
										</p>
										<p className={/[0-9]/.test(newPassword) ? "text-green-600 dark:text-green-500 font-medium" : ""}>
											{/[0-9]/.test(newPassword) ? "✓" : "○"} Số (0-9)
										</p>
										<p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newPassword) ? "text-green-600 dark:text-green-500 font-medium" : ""}>
											{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newPassword) ? "✓" : "○"} Ký tự đặc biệt (!@#$...)
										</p>
										<p className={newPassword.length >= 8 && newPassword.length <= 20 ? "text-green-600 dark:text-green-500 font-medium" : ""}>
											{newPassword.length >= 8 && newPassword.length <= 20 ? "✓" : "○"} Độ dài 8-20 ký tự
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Confirm Password */}
						<div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '400ms' }}>
							<Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300 font-semibold ml-1">Xác nhận mật khẩu mới</Label>
							<div className="relative group">
								<Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
								<Input
									id="confirmPassword"
									type={showConfirmPassword ? "text" : "password"}
									placeholder="Nhập lại mật khẩu mới"
									className="pl-11 pr-12 h-12 rounded-xl bg-white/50 dark:bg-black/20 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:border-amber-500 transition-all font-medium"
									autoComplete="new-password"
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
								>
									{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
						</div>

						{errorMessage ? (
							<div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium flex items-start gap-2.5 shadow-sm animate-in zoom-in">
								<AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
								<span>{errorMessage}</span>
							</div>
						) : null}

						<div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '500ms' }}>
							<Button type="submit" className="w-full h-12 rounded-xl text-base font-bold text-white shadow-lg bg-amber-600 hover:bg-amber-700 transition-all hover:-translate-y-0.5" disabled={isSubmitting}>
								{isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
