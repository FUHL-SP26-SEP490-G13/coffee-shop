import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Send, Loader2 } from "lucide-react";
import axios from "@/services/axiosClient";
import Logo from "/logo/Logo.png";

function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Email không hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      await axios.post("/subscriber", { email });
      setMessage("Đăng ký thành công! Cảm ơn bạn.");
      setEmail("");
    } catch (err) {
      setError(
        err?.response?.data?.message || "Email đã tồn tại hoặc có lỗi xảy ra."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img
              src={Logo}
              alt="Coffee Shop Logo"
              className="h-16 w-auto mb-4"
            />

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Hương vị cà phê chuẩn vị, phục vụ mỗi ngày.
            </p>

            <div className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin size={15} className="shrink-0 text-primary" />
                TP. Hà Nội
              </p>
              <p className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-primary" />
                0123 456 789
              </p>
              <p className="flex items-center gap-2">
                <Mail size={15} className="shrink-0 text-primary" />
                <span className="break-all">contact@coffeeshop.vn</span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Chính sách
            </h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  to="/order-policy"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Chính sách đặt hàng
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  to="/payment-policy"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Chính sách thanh toán
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Hỗ trợ
            </h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Đăng ký
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  Giỏ hàng
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Đăng ký nhận tin
            </h4>
            <p className="mt-4 text-sm text-muted-foreground">
              Nhận ưu đãi và tin tức mới nhất từ chúng tôi.
            </p>

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn"
                  className="flex-1 rounded-full border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>

              {message && (
                <p className="mt-3 text-sm font-medium text-green-600">
                  {message}
                </p>
              )}

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </form>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Coffee Shop. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
