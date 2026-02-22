import { useState } from "react";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";
import axios from "@/services/axiosClient";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

    if (!email) {
      setError("Vui lòng nhập email.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Email không hợp lệ.");
      return;
    }

    try {
      setLoading(true);

      await axios.post("/newsletter", { email });

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
    <footer className="bg-card border-t mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
        {/* Company */}
        <div>
          <h4 className="font-semibold mb-4">Coffee Shop</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Hương vị cà phê chuẩn vị, phục vụ mỗi ngày.
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="flex-shrink-0" />
              <span>TP. Hà Nội</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} className="flex-shrink-0" />
              <span>0123 456 789</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="flex-shrink-0" />
              <span className="break-all">contact@coffeeshop.vn</span>
            </div>
          </div>
        </div>

        {/* Policies */}
        <div>
          <h4 className="font-semibold mb-4">Chính sách</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/order-policy" className="hover:text-black transition">
                Chính sách đặt hàng
              </Link>
            </li>

            <li>
              <Link
                to="/privacy-policy"
                className="hover:text-black transition"
              >
                Chính sách bảo mật
              </Link>
            </li>

            <li>Thanh toán</li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold mb-4">Hỗ trợ</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/search" className="hover:text-black transition">
                Tìm kiếm
              </Link>
            </li>

            <li>
              <Link to="/login" className="hover:text-black transition">
                Đăng nhập
              </Link>
            </li>

            <li>
              <Link to="/register" className="hover:text-black transition">
                Đăng ký
              </Link>
            </li>

            <li>
              <Link to="/cart" className="hover:text-black transition">
                Giỏ hàng
              </Link>
            </li>

            <li>
              <Link to="/contact" className="hover:text-black transition">
                Liên hệ
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-semibold mb-4">Đăng ký nhận tin</h4>

          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                className="flex-1 text-sm"
              />

              <Button type="submit" disabled={loading} className="gap-2 w-full sm:w-auto">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Gửi..." : "Đăng ký"}
              </Button>
            </div>

            {message && (
              <p className="text-sm text-green-600 font-medium">{message}</p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>
      </div>

      <div className="border-t text-center py-4 px-4 text-xs sm:text-sm text-muted-foreground bg-muted">
        © {new Date().getFullYear()} Coffee Shop. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
