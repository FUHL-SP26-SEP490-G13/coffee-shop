import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import axios from "@/services/axiosClient";
import { Link } from "react-router-dom";

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
    <footer className="bg-muted border-t mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Company */}
        <div>
          <h4 className="font-semibold mb-4">Coffee Shop</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Hương vị cà phê chuẩn vị, phục vụ mỗi ngày.
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              TP. Hồ Chí Minh
            </div>
            <div className="flex items-center gap-2">
              <Phone size={16} />
              0123 456 789
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} />
              contact@coffeeshop.vn
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
            <li>Tìm kiếm</li>
            <li>Giỏ hàng</li>
            <li>Liên hệ</li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-semibold mb-4">Đăng ký nhận tin</h4>

          <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
            <div className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                className="flex-1 border rounded-l-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#b71c1c]"
              />

              <button
                type="submit"
                disabled={loading}
                className={`px-4 rounded-r-md text-sm text-white transition
                  ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#b71c1c] hover:bg-[#8e0000]"
                  }`}
              >
                {loading ? "Đang gửi..." : "Đăng ký"}
              </button>
            </div>

            {message && <p className="text-sm text-green-600">{message}</p>}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>
      </div>

      <div className="border-t text-center py-4 text-sm text-muted-foreground">
        © 2025 Coffee Shop. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
