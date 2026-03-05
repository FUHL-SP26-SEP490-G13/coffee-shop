import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Loader2,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";
import axios from "@/services/axiosClient";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <footer className="bg-gray-900 text-gray-100 mt-20">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
        {/* Brand Section */}
        <div className="space-y-4">
          <img
            src={Logo}
            alt="Coffee Shop Logo"
            className="h-14 w-auto brightness-0 invert"
          />
          <p className="text-sm text-gray-400 leading-relaxed">
            Hương vị cà phê chuẩn vị, phục vụ mỗi ngày. Chúng tôi cam kết đem
            đến trải nghiệm tuyệt vời.
          </p>

          {/* Contact Info */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-5 h-5 flex-shrink-0 text-amber-500" />
              <span>TP. Hà Nội, Việt Nam</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-5 h-5 flex-shrink-0 text-amber-500" />
              <span>0123 456 789</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-5 h-5 flex-shrink-0 text-amber-500" />
              <span className="break-all">contact@coffeeshop.vn</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-3 pt-2">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-amber-500 flex items-center justify-center transition duration-300"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-amber-500 flex items-center justify-center transition duration-300"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-gray-800 hover:bg-amber-500 flex items-center justify-center transition duration-300"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Policies */}
        <div>
          <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">
            Chính sách
          </h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link
                to="/order-policy"
                className="hover:text-amber-500 transition duration-300 hover:translate-x-1 inline-block"
              >
                Chính sách đặt hàng
              </Link>
            </li>

            <li>
              <Link
                to="/privacy-policy"
                className="hover:text-amber-500 transition duration-300 hover:translate-x-1 inline-block"
              >
                Chính sách bảo mật
              </Link>
            </li>

            <li>
              <Link
                to="/payment-policy"
                className="hover:text-amber-500 transition duration-300 hover:translate-x-1 inline-block"
              >
                Chính sách thanh toán
              </Link>
            </li>

            <li>
              <Link
                to="/terms-of-service"
                className="hover:text-amber-500 transition duration-300 hover:translate-x-1 inline-block"
              >
                Điều khoản sử dụng
              </Link>
            </li>

            <li>
              <Link
                to="/return-policy"
                className="hover:text-amber-500 transition duration-300 hover:translate-x-1 inline-block"
              >
                Chính sách hoàn trả
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">
            Hỗ trợ
          </h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link
                to="/search"
                className="hover:text-amber-500 transition duration-300 hover:translate-x-1 inline-block"
              >
                Tìm kiếm
              </Link>
            </li>

            <li>
              <Link
                to="/login"
                className="hover:text-amber-500 transition duration-300 hover:translate-x-1 inline-block"
              >
                Đăng nhập
              </Link>
            </li>

            <li>
              <Link
                to="/register"
                className="hover:text-amber-500 transition duration-300 hover:translate-x-1 inline-block"
              >
                Đăng ký
              </Link>
            </li>

            <li>
              <Link
                to="/cart"
                className="hover:text-amber-500 transition duration-300 hover:translate-x-1 inline-block"
              >
                Giỏ hàng
              </Link>
            </li>

            <li>
              <Link
                to="/contact"
                className="hover:text-amber-500 transition duration-300 hover:translate-x-1 inline-block"
              >
                Liên hệ
              </Link>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">
            Đăng ký nhận tin
          </h4>
          <p className="text-sm text-gray-400 mb-4">
            Nhận các khuyến mãi và tin tức mới nhất từ chúng tôi
          </p>

          <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-amber-500 focus:bg-gray-750 text-sm rounded-lg"
            />

            <Button
              type="submit"
              disabled={loading}
              className="gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold transition duration-300"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Gửi..." : "Đăng ký"}
            </Button>

            {message && (
              <p className="text-xs text-green-400 font-medium">{message}</p>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}
          </form>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800" />

      {/* Bottom Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Coffee Shop. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-amber-500 transition duration-300">
            Sitemap
          </a>
          <a href="#" className="hover:text-amber-500 transition duration-300">
            Cookies
          </a>
          <a href="#" className="hover:text-amber-500 transition duration-300">
            Tìm kiếm
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
