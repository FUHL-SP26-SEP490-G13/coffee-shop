import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, Lock, Mail, User, Phone, CheckCircle2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_ROUTES } from "@/constants";
import authenticationService from "@/services/authenticationService";

export default function RegisterPage() {
	const navigate = useNavigate();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [username, setUsername] = useState("");
	const [gender, setGender] = useState("");
	const [dob, setDob] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [validationErrors, setValidationErrors] = useState({});
	const [passwordStrength, setPasswordStrength] = useState(0);

	// Hàm tính độ mạnh password
	const calculatePasswordStrength = (pwd) => {
		// Kiểm tra yêu cầu bắt buộc
		const hasLower = /[a-z]/.test(pwd);
		const hasUpper = /[A-Z]/.test(pwd);
		const hasNumber = /[0-9]/.test(pwd);
		const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
		const lengthValid = pwd.length >= 8 && pwd.length <= 20;

		// Đếm số yêu cầu được đáp ứng
		let strength = 0;
		if (hasLower) strength += 1;
		if (hasUpper) strength += 1;
		if (hasNumber) strength += 1;
		if (hasSpecial) strength += 1;

		// Kiểm tra độ dài
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

	// Hàm kiểm tra mật khẩu hợp lệ (bắt buộc tất cả yêu cầu)
	const isValidPasswordStrict = (pwd) => {
		if (pwd.length < 8 || pwd.length > 20) return false;
		if (!/[a-z]/.test(pwd)) return false;
		if (!/[A-Z]/.test(pwd)) return false;
		if (!/[0-9]/.test(pwd)) return false;
		if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return false;
		return true;
	};

	// Hàm kiểm tra validate email
	const isValidEmail = (emailAddress) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(emailAddress);
	};

	// Hàm kiểm tra số điện thoại (tối đa 12 ký tự)
	const isValidPhone = (phoneNumber) => {
		const cleaned = phoneNumber.replace(/\s/g, "");
		// Tối đa 12 ký tự, bắt đầu bằng 0 hoặc +, chứa chữ số
		const phoneRegex = /^(\+84|0)[0-9]{9,11}$/;
		return phoneRegex.test(cleaned) && cleaned.length <= 12;
	};

	// Hàm kiểm tra username
	const isValidUsername = (user) => {
		return user.length >= 3 && /^[a-zA-Z0-9_]+$/.test(user);
	};

	// Hàm validate form
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
			errors.phone = "Số điện thoại không hợp lệ (tối đa 12 ký tự, 0xxx hoặc +84xxx)";
		}

		if (!username.trim()) {
			errors.username = "Username không được để trống";
		} else if (!isValidUsername(username)) {
			errors.username = "Username phải >= 3 ký tự, chỉ chứa chữ/số/_";
		}

		if (gender !== "0" && gender !== "1") {
			errors.gender = "Vui lòng chọn giới tính";
		}

		if (!dob) {
			errors.dob = "Ngày sinh không được để trống";
		}

		if (!password) {
			errors.password = "Mật khẩu không được để trống";
		} else if (!isValidPasswordStrict(password)) {
			errors.password = "Mật khẩu phải 8-20 ký tự, có chữ hoa, thường, số và ký tự đặc biệt";
		}

		if (!confirmPassword) {
			errors.confirmPassword = "Xác nhận mật khẩu không được để trống";
		} else if (password !== confirmPassword) {
			errors.confirmPassword = "Mật khẩu xác nhận không khớp";
		}

		setValidationErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (isSubmitting) return;

		// Reset messages
		setErrorMessage("");
		setSuccessMessage("");

		// Validate form
		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await authenticationService.register({
				first_name: firstName,
				last_name: lastName,
				email: email.toLowerCase(),
				phone: phone.replace(/\s/g, ""),
				username: username,
				gender: Number(gender),
				dob,
				password,
				password_confirm: confirmPassword,
			});

			if (!response?.success) {
				throw new Error(response?.message || "Đăng ký thất bại");
			}

			setSuccessMessage("Đăng ký thành công! Đang chuyển hướng...");

			// Delay trước khi chuyển hướng
			setTimeout(() => {
				navigate(APP_ROUTES.LOGIN, { replace: true });
			}, 2000);
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
								<span>Coffee Shop Member</span>
							</div>
							<div className="space-y-3">
								<h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
									Tham gia cộng đồng
								</h1>
								<p className="text-base text-muted-foreground">
									Đăng ký tài khoản để tận hưởng những ưu đãi đặc biệt, theo dõi đơn hàng và nhận thông báo về các khuyến mãi mới.
								</p>
							</div>
							<div className="grid gap-3 text-sm text-muted-foreground">
								<div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-primary" />
									Mua hàng trực tuyến và tích điểm thưởng
								</div>
								<div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-accent" />
									Nhận thông báo về khuyến mãi độc quyền
								</div>
								<div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
									<span className="h-2 w-2 rounded-full bg-primary" />
									Quản lý lịch sử đơn hàng và yêu thích
								</div>
							</div>
						</div>
					</div>

					<div className="flex items-center justify-center p-8 lg:p-12">
						<div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
							<div className="mb-8 space-y-2">
								<h2 className="text-2xl font-semibold text-foreground">Tạo tài khoản mới</h2>
								<p className="text-sm text-muted-foreground">
									Nhập thông tin của bạn để bắt đầu
								</p>
							</div>

							<form className="space-y-4" onSubmit={handleSubmit}>
								{/* First Name Input */}
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-2">
										<Label htmlFor="firstName">Họ</Label>
										<div className="relative">
											<User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
											<Input
												id="firstName"
												type="text"
												placeholder="Nguyễn"
												className={`pl-9 ${
													validationErrors.firstName
														? "border-destructive"
														: ""
												}`}
												value={firstName}
												onChange={(event) => {
													setFirstName(event.target.value);
													if (validationErrors.firstName) {
														setValidationErrors({
															...validationErrors,
															firstName: "",
														});
													}
												}}
											/>
										</div>
										{validationErrors.firstName && (
											<p className="flex items-center gap-2 text-xs text-destructive">
												<AlertCircle className="h-3 w-3" />
												{validationErrors.firstName}
											</p>
										)}
									</div>

									{/* Last Name Input */}
									<div className="space-y-2">
										<Label htmlFor="lastName">Tên</Label>
										<div className="relative">
											<User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
											<Input
												id="lastName"
												type="text"
												placeholder="Anh"
												className={`pl-9 ${
													validationErrors.lastName
														? "border-destructive"
														: ""
												}`}
												value={lastName}
												onChange={(event) => {
													setLastName(event.target.value);
													if (validationErrors.lastName) {
														setValidationErrors({
															...validationErrors,
															lastName: "",
														});
													}
												}}
											/>
										</div>
										{validationErrors.lastName && (
											<p className="flex items-center gap-2 text-xs text-destructive">
												<AlertCircle className="h-3 w-3" />
												{validationErrors.lastName}
											</p>
										)}
									</div>
								</div>

								{/* Email Input */}
								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<div className="relative">
										<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="email"
											type="email"
											placeholder="you@example.com"
											className={`pl-9 ${
												validationErrors.email
													? "border-destructive"
													: ""
											}`}
											autoComplete="email"
											value={email}
											onChange={(event) => {
												setEmail(event.target.value);
												if (validationErrors.email) {
													setValidationErrors({
														...validationErrors,
														email: "",
													});
												}
											}}
										/>
									</div>
									{validationErrors.email && (
										<p className="flex items-center gap-2 text-xs text-destructive">
											<AlertCircle className="h-3 w-3" />
											{validationErrors.email}
										</p>
									)}
								</div>

								{/* Phone Input */}
								<div className="space-y-2">
									<Label htmlFor="phone">Số điện thoại</Label>
									<div className="relative">
										<Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="phone"
											type="tel"
											placeholder="0912345678 hoặc +84912345678"
											className={`pl-9 ${
												validationErrors.phone
													? "border-destructive"
													: ""
											}`}
											autoComplete="tel"
											value={phone}
											onChange={(event) => {
												setPhone(event.target.value);
												if (validationErrors.phone) {
													setValidationErrors({
														...validationErrors,
														phone: "",
													});
												}
											}}
										/>
									</div>
									{validationErrors.phone && (
										<p className="flex items-center gap-2 text-xs text-destructive">
											<AlertCircle className="h-3 w-3" />
											{validationErrors.phone}
										</p>
									)}
								</div>

								{/* Username Input */}
								<div className="space-y-2">
									<Label htmlFor="username">Username</Label>
									<div className="relative">
										<User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="username"
											type="text"
											placeholder="username123"
											className={`pl-9 ${
												validationErrors.username
													? "border-destructive"
													: ""
											}`}
											autoComplete="username"
											value={username}
											onChange={(event) => {
												setUsername(event.target.value);
												if (validationErrors.username) {
													setValidationErrors({
														...validationErrors,
														username: "",
													});
												}
											}}
										/>
									</div>
									{validationErrors.username && (
										<p className="flex items-center gap-2 text-xs text-destructive">
											<AlertCircle className="h-3 w-3" />
											{validationErrors.username}
										</p>
									)}
								</div>

								{/* Gender & Date of Birth */}
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-2">
										<Label htmlFor="gender">Giới tính</Label>
										<select
											id="gender"
											value={gender}
											onChange={(event) => {
												setGender(event.target.value);
												if (validationErrors.gender) {
													setValidationErrors({
														...validationErrors,
														gender: "",
													});
												}
											}}
											className={`h-10 w-full rounded-md border border-input bg-background px-3 text-sm ${
												validationErrors.gender ? "border-destructive" : ""
											}`}
										>
											<option value="">Chọn</option>
											<option value="1">Nam</option>
											<option value="0">Nữ</option>
										</select>
										{validationErrors.gender && (
											<p className="flex items-center gap-2 text-xs text-destructive">
												<AlertCircle className="h-3 w-3" />
												{validationErrors.gender}
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="dob">Ngày sinh</Label>
										<Input
											id="dob"
											type="date"
											value={dob}
											onChange={(event) => {
												setDob(event.target.value);
												if (validationErrors.dob) {
													setValidationErrors({
														...validationErrors,
														dob: "",
													});
												}
											}}
											className={validationErrors.dob ? "border-destructive" : ""}
										/>
										{validationErrors.dob && (
											<p className="flex items-center gap-2 text-xs text-destructive">
												<AlertCircle className="h-3 w-3" />
												{validationErrors.dob}
											</p>
										)}
									</div>
								</div>

								{/* Password Input with Strength Indicator */}
								<div className="space-y-2">
									<Label htmlFor="password">Mật khẩu</Label>
									<div className="relative">
										<Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="password"
											type="password"
											placeholder="Nhập mật khẩu"
											className={`pl-9 ${
												validationErrors.password
													? "border-destructive"
													: ""
											}`}
											autoComplete="new-password"
											value={password}
											onChange={(event) => {
												const pwd = event.target.value;
												setPassword(pwd);
												setPasswordStrength(calculatePasswordStrength(pwd));
												if (validationErrors.password) {
													setValidationErrors({
														...validationErrors,
														password: "",
													});
												}
											}}
										/>
									</div>

									{/* Password Strength Indicator */}
									{password && (
										<div className="space-y-2">
											<div className="flex items-center justify-between text-xs">
												<span className="text-muted-foreground">Độ mạnh:</span>
												<span className={`font-medium ${
													passwordStrength === 1 ? "text-red-500" :
													passwordStrength === 2 ? "text-yellow-500" :
													passwordStrength === 3 ? "text-blue-500" :
													passwordStrength === 4 ? "text-green-500" : ""
												}`}>
													{getPasswordStrengthLabel(passwordStrength)}
												</span>
											</div>
											<div className="h-2 flex gap-1 bg-muted rounded-full overflow-hidden">
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
											<div className="text-xs text-muted-foreground space-y-1">
												<p className={/[a-z]/.test(password) ? "text-green-600" : ""}>
													{/[a-z]/.test(password) ? "✓" : "○"} Chữ thường (a-z)
												</p>
												<p className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
													{/[A-Z]/.test(password) ? "✓" : "○"} Chữ hoa (A-Z)
												</p>
												<p className={/[0-9]/.test(password) ? "text-green-600" : ""}>
													{/[0-9]/.test(password) ? "✓" : "○"} Số (0-9)
												</p>
												<p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "text-green-600" : ""}>
													{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "✓" : "○"} Ký tự đặc biệt (!@#$...)
												</p>
												<p className={password.length >= 8 && password.length <= 20 ? "text-green-600" : ""}>
													{password.length >= 8 && password.length <= 20 ? "✓" : "○"} Độ dài 8-20 ký tự
												</p>
											</div>
										</div>
									)}

									{validationErrors.password && (
										<p className="flex items-center gap-2 text-xs text-destructive">
											<AlertCircle className="h-3 w-3" />
											{validationErrors.password}
										</p>
									)}
								</div>

								{/* Confirm Password Input */}
								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
									<div className="relative">
										<Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											id="confirmPassword"
											type="password"
											placeholder="Nhập lại mật khẩu"
											className={`pl-9 ${
												validationErrors.confirmPassword
													? "border-destructive"
													: ""
											}`}
											autoComplete="new-password"
											value={confirmPassword}
											onChange={(event) => {
												setConfirmPassword(event.target.value);
												if (validationErrors.confirmPassword) {
													setValidationErrors({
														...validationErrors,
														confirmPassword: "",
													});
												}
											}}
										/>
									</div>
									{validationErrors.confirmPassword && (
										<p className="flex items-center gap-2 text-xs text-destructive">
											<AlertCircle className="h-3 w-3" />
											{validationErrors.confirmPassword}
										</p>
									)}
								</div>

								{/* Error Message */}
								{errorMessage && (
									<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
										<AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
										<span>{errorMessage}</span>
									</div>
								)}

								{/* Success Message */}
								{successMessage && (
									<div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600 flex items-start gap-2">
										<CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
										<span>{successMessage}</span>
									</div>
								)}

								<Button
									type="submit"
									className="w-full"
									disabled={isSubmitting}
								>
									{isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}
								</Button>
							</form>

							<div className="mt-6 text-center text-sm text-muted-foreground">
								Đã có tài khoản?{" "}
								<button
									type="button"
									className="text-primary hover:text-primary/90 font-medium"
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
