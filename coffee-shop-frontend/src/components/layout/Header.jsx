import { useEffect, useState, useRef } from "react";
import { ShoppingCart, Search, User, LogOut, Package, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";
import { STORAGE_KEYS } from "@/constants";

function Header() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // ===== USER =====
  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const user = token ? jwtDecode(token) : null;

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    navigate("/");
  };

  // ===== Typing Effect =====
  const placeholders = [
    "Xin chào, bạn cần gì hôm nay?",
    "Cà phê sữa đá",
    "Trà đào cam sả",
    "Sinh tố bơ béo ngậy",
  ];

  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (subIndex < placeholders[index].length) {
      const timeout = setTimeout(() => {
        setText((prev) => prev + placeholders[index][subIndex]);
        setSubIndex((prev) => prev + 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setText("");
        setSubIndex(0);
        setIndex((prev) => (prev + 1) % placeholders.length);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [subIndex, index]);

  // ===== Click outside dropdown =====
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo */}
        <h1
          className="text-2xl font-bold cursor-pointer text-primary"
          onClick={() => navigate("/")}
        >
          Coffee Shop
        </h1>

        {/* Search */}
        <div className="flex-1 mx-8 hidden md:flex">
          <div className="w-full relative">
            <Input
              type="text"
              placeholder={text || "Tìm kiếm sản phẩm..."}
              className="w-full rounded-full py-2 pl-4 pr-12"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {!user && (
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Đăng nhập
            </Button>
          )}

          {user && (
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                onClick={() => setOpen(!open)}
                className="gap-2 text-sm"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.last_name} {user.first_name}</span>
              </Button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-card shadow-lg rounded-xl p-1 border border-border animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => navigate("/my-orders")}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-lg transition flex items-center gap-2 text-sm"
                  >
                    <Package className="w-4 h-4" />
                    Đơn hàng của tôi
                  </button>

                  <button
                    onClick={() => navigate("/customer/profile")}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-lg transition flex items-center gap-2 text-sm"
                  >
                    <User className="w-4 h-4" />
                    Hồ sơ cá nhân
                  </button>

                  <div className="my-1 border-t" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition flex items-center gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}

          <Button className="gap-2" onClick={() => navigate("/cart")}>
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Giỏ hàng</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
