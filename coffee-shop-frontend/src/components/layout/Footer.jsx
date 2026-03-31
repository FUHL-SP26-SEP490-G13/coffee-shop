import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
import Logo from "/logo/Logo.png";
import { useStoreHours } from "@/hooks/useStoreHours";

function Footer() {
  const { isOpen, storeSchedule } = useStoreHours();

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

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground dark:text-gray-400">
              Hương vị cà phê chuẩn vị, phục vụ mỗi ngày.
            </p>

            <div className="mt-5 space-y-2.5 text-sm text-muted-foreground dark:text-gray-400">
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
                  className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary"
                >
                  Chính sách đặt hàng
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  to="/payment-policy"
                  className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary"
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
                  className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary"
                >
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary"
                >
                  Đăng ký
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="text-sm text-muted-foreground dark:text-gray-400 transition-colors hover:text-primary"
                >
                  Giỏ hàng
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Giờ mở cửa
            </h4>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground dark:text-gray-400">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span>Trực truyến hàng ngày</span>
                <span className="font-medium text-foreground">
                  {storeSchedule?.open || "07:00"} - {storeSchedule?.close || "22:30"}
                </span>
              </div>
              <div className="flex justify-between pb-2">
                <span>Trạng thái</span>
                {isOpen ? (
                  <span className="font-medium flex items-center gap-1.5 text-primary">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Đang mở cửa
                  </span>
                ) : (
                  <span className="font-medium flex items-center gap-1.5 text-red-500">
                    <span className="relative flex h-2 w-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Đã đóng cửa
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
          <p className="text-center text-xs text-muted-foreground dark:text-gray-400">
            © {new Date().getFullYear()} Coffee Shop. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
