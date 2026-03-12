import { GoogleLogin, useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import authenticationService from "@/services/authenticationService";
import { APP_ROUTES, STORAGE_KEYS } from "@/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function GoogleButton() {
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await authenticationService.googleLogin(
          tokenResponse.access_token,
          tokenResponse.id_token
        );

      if (!res?.success) {
        throw new Error(res?.message || "Đăng nhập Google thất bại");
      }

      const { user, token, refreshToken } = res.data || {};

      // Lưu tokens vào localStorage
      if (token) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      }
      if (refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }

      toast.success("Đăng nhập Google thành công!");

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
        default:
          navigate(APP_ROUTES.HOME, { replace: true });
          break;
      }
      } catch (err) {
        console.error("GOOGLE LOGIN ERROR:", err.response?.data || err.message);
        const errorMessage =
          err?.response?.data?.message ||
          err?.message ||
          "Đăng nhập Google thất bại";
        toast.error(errorMessage);
      }
    },
    onError: () => {
      console.log("Google Login Failed");
      toast.error("Đăng nhập Google thất bại. Vui lòng thử lại.");
    },
    scope: 'openid email profile https://www.googleapis.com/auth/user.birthday.read',
  });

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Hoặc tiếp tục với
          </span>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Tiếp tục với Google
        </Button>
      </div>
    </div>
  );
}