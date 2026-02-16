import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
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
	const colors = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
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
		<div className="min-h-screen bg-background">
			<div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
				<div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
					<div className="mb-6 flex items-center justify-between">
						<Button
							variant="outline"
							type="button"
							onClick={() => navigate(-1)}
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Quay lại
						</Button>
					</div>

					<div className="mb-8 space-y-2">
						<h1 className="text-2xl font-semibold text-foreground">
							Thay đổi mật khẩu
						</h1>
						<p className="text-sm text-muted-foreground">
							Cập nhật mật khẩu để bảo vệ tài khoản của bạn.
						</p>
					</div>

					<form className="space-y-6" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
							<div className="relative">
								<Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="currentPassword"
									type="password"
									placeholder="Nhập mật khẩu hiện tại"
									className="pl-9"
									autoComplete="current-password"
									value={currentPassword}
									onChange={(event) => setCurrentPassword(event.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="newPassword">Mật khẩu mới</Label>
							<div className="relative">
								<Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="newPassword"
									type="password"
									placeholder="Nhập mật khẩu mới"
									className="pl-9"
									autoComplete="new-password"
									value={newPassword}
									onChange={(event) => {
										const nextValue = event.target.value;
										setNewPassword(nextValue);
										setPasswordStrength(calculatePasswordStrength(nextValue));
									}}
								/>
							</div>
							{newPassword && (
								<div className="space-y-2">
									<div className="flex items-center justify-between text-xs">
										<span className="text-muted-foreground">Độ mạnh:</span>
										<span
											className={`font-medium ${
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
									<div className="space-y-1 text-xs text-muted-foreground">
										<p className={/[a-z]/.test(newPassword) ? "text-green-600" : ""}>
											{/[a-z]/.test(newPassword) ? "✓" : "○"} Chữ thường (a-z)
										</p>
										<p className={/[A-Z]/.test(newPassword) ? "text-green-600" : ""}>
											{/[A-Z]/.test(newPassword) ? "✓" : "○"} Chữ hoa (A-Z)
										</p>
										<p className={/[0-9]/.test(newPassword) ? "text-green-600" : ""}>
											{/[0-9]/.test(newPassword) ? "✓" : "○"} Số (0-9)
										</p>
										<p
											className={
												/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newPassword)
													? "text-green-600"
													: ""
											}
										>
											{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newPassword)
												? "✓"
												: "○"} Ký tự đặc biệt (!@#$...)
										</p>
										<p
											className={
												newPassword.length >= 8 && newPassword.length <= 20
													? "text-green-600"
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
							<Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
							<div className="relative">
								<Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									id="confirmPassword"
									type="password"
									placeholder="Nhập lại mật khẩu mới"
									className="pl-9"
									autoComplete="new-password"
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
								/>
							</div>
						</div>

						{errorMessage ? (
							<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
								{errorMessage}
							</div>
						) : null}

						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
