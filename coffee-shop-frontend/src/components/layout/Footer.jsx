import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Facebook,
  Youtube,
  Instagram,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import Logo from "/logo/Logo.png";
import receiptSettingService from "@/services/receiptSettingService";
import { useStoreHours } from "@/hooks/useStoreHours";
import { STORAGE_KEYS } from "@/constants";
import PayOSLogo from "/logo/payOS.svg";

function Footer() {
  const { isOpen, storeSchedule } = useStoreHours();
  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const isLoggedIn = !!token;

  const [storeLogo, setStoreLogo] = useState(() => {
    return localStorage.getItem("cached_store_logo") || Logo;
  });
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await receiptSettingService.getActive();
        const data = res?.data || null;
        if (data) {
          if (data.logo_url) {
            setStoreLogo(data.logo_url);
            localStorage.setItem("cached_store_logo", data.logo_url);
          } else {
            setStoreLogo(Logo);
            localStorage.removeItem("cached_store_logo");
          }
          if (data.address) setStoreAddress(data.address);
          if (data.phone) setStorePhone(data.phone);
        } else {
          setStoreLogo(Logo);
          localStorage.removeItem("cached_store_logo");
        }
      } catch (error) {
        setStoreLogo(Logo);
        localStorage.removeItem("cached_store_logo");
      }
    };
    fetchSettings();

    const handleReceiptUpdate = () => {
      fetchSettings();
    };

    window.addEventListener("receiptSettingsUpdated", handleReceiptUpdate);
    return () => {
      window.removeEventListener("receiptSettingsUpdated", handleReceiptUpdate);
    };
  }, []);

  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="max-w-[1440px] mx-auto w-full px-6 py-12 lg:px-8 lg:py-16 xl:px-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Cột 1: Thông tin liên hệ & Mạng xã hội */}
          <div className="space-y-8 lg:pr-4">
            <div>
              <Link to="/" className="inline-block mb-4">
                <img
                  src={storeLogo}
                  onError={(e) => { e.currentTarget.src = Logo; }}
                  alt="Coffee Shop Logo"
                  className="h-16 w-auto hover:opacity-80 transition-opacity object-contain rounded-xl"
                />
              </Link>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground dark:text-gray-400">
                Hương vị cà phê chuẩn vị, phục vụ mỗi ngày
              </p>
              <div className="mt-5 space-y-3 text-sm text-muted-foreground dark:text-gray-400">
                <p className="flex items-center gap-2">
                  <MapPin size={16} className="shrink-0 text-primary" />
                  {storeAddress || "TP. Hà Nội"}
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={16} className="shrink-0 text-primary" />
                  {storePhone || "0123 456 789"}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Kết nối với chúng tôi
              </h4>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all hover:-translate-y-1 shadow-md"
                  aria-label="Facebook"
                >
                  <Facebook
                    size={18}
                    fill="currentColor"
                    className="text-white"
                  />
                </a>
                <a
                  href="https://zalo.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all hover:-translate-y-1 shadow-md font-bold text-[11px]"
                  aria-label="Zalo"
                >
                  Zalo
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all hover:-translate-y-1 shadow-md"
                  aria-label="Youtube"
                >
                  <Youtube size={18} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 hover:opacity-90 text-white flex items-center justify-center transition-all hover:-translate-y-1 shadow-md"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Cột 2: Chính sách & Hỗ trợ */}
          <div className="space-y-8">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Chính sách
              </h4>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    to="/about-us"
                    className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary hover:underline hover:underline-offset-4"
                  >
                    Về chúng tôi
                  </Link>
                </li>
                <li>
                  <Link
                    to="/order-policy"
                    className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary hover:underline hover:underline-offset-4"
                  >
                    Chính sách đặt hàng
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary hover:underline hover:underline-offset-4"
                  >
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link
                    to="/payment-policy"
                    className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary hover:underline hover:underline-offset-4"
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
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    to={isLoggedIn ? "/customer/profile" : "/login"}
                    className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary hover:underline hover:underline-offset-4"
                  >
                    {isLoggedIn ? "Hồ sơ cá nhân" : "Đăng nhập"}
                  </Link>
                </li>
                {!isLoggedIn && (
                  <li>
                    <Link
                      to="/register"
                      className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary hover:underline hover:underline-offset-4"
                    >
                      Đăng ký
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    to="/cart"
                    className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary hover:underline hover:underline-offset-4"
                  >
                    Giỏ hàng
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Cột 3: Giờ mở cửa & Chứng nhận */}
          <div className="space-y-8">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Giờ mở cửa
              </h4>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground dark:text-gray-400">
                <div className="flex flex-col gap-1 border-b border-border/50 pb-2">
                  <span>Trực truyến hàng ngày</span>
                  <span className="font-medium text-foreground">
                    {storeSchedule?.open || "07:00"} -{" "}
                    {storeSchedule?.close || "22:30"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span>Trạng thái:</span>
                  {isOpen ? (
                    <span className="font-bold flex items-center gap-1.5 text-green-600 dark:text-green-500 text-xs uppercase bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Mở cửa
                    </span>
                  ) : (
                    <span className="font-bold flex items-center gap-1.5 text-red-600 dark:text-red-500 text-xs uppercase bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      Đóng cửa
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Chứng nhận
              </h4>
              <div className="mt-4 flex flex-col gap-3">
                <div className="border bg-gray-50 dark:bg-background/50 rounded flex items-center gap-3 p-2 h-11 transition-colors hover:bg-gray-100 w-full">
                  <ShieldCheck className="text-gray-800 dark:text-gray-200 w-6 h-6 flex-shrink-0 ml-1" />
                  <div className="text-[9px] min-[1100px]:text-[10px] font-bold leading-tight text-gray-800 dark:text-gray-200 text-left uppercase overflow-hidden text-ellipsis whitespace-nowrap">
                    Protected by
                    <br />
                    <span className="text-[11px] min-[1100px]:text-[12px]">
                      DMCA
                    </span>
                  </div>
                </div>
                <div className="border bg-gray-50 dark:bg-background/50 rounded flex items-center gap-3 p-2 h-11 transition-colors hover:bg-gray-100 w-full">
                  <CheckCircle2 className="text-[#0d5cb6] w-6 h-6 flex-shrink-0 ml-1" />
                  <div className="text-[8px] min-[1100px]:text-[9px] font-bold leading-tight text-[#0d5cb6] uppercase text-left overflow-hidden text-ellipsis whitespace-nowrap">
                    Đã thông báo
                    <br />
                    <span className="text-[10px] min-[1100px]:text-[11px]">
                      Bộ Công Thương
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột 4: Payment */}
          <div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Hỗ trợ thanh toán
              </h4>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="https://payos.vn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <div className="bg-white border rounded shadow-sm px-1 py-1.5 flex items-center justify-center h-9 group hover:border-gray-800 transition-colors">
                    <img
                      src={PayOSLogo}
                      alt="PayOS"
                      className="w-16 h-auto object-contain"
                    />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="max-w-[1440px] mx-auto w-full px-6 py-5 lg:px-8 xl:px-12">
          <p className="text-center text-xs text-muted-foreground dark:text-gray-400">
            © {new Date().getFullYear()} Coffee Shop. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
