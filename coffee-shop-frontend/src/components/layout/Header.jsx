import { useEffect, useState, useRef } from "react";
import {
  ShoppingCart,
  Search,
  User,
  LogOut,
  Package,
  Menu,
  X,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { STORAGE_KEYS } from "@/constants";
import Logo from "/logo/Logo.png";

const placeholders = [
  "Xin chào, bạn cần gì hôm nay?",
  "Cà phê sữa đá",
  "Trà đào cam sả",
  "Sinh tố bơ béo ngậy",
];

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
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
        {/* Logo */}
        <div
          className="flex-shrink-0 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={Logo}
            alt="Coffee Shop Logo"
            className="h-12 w-auto hover:opacity-80 transition-opacity duration-300"
          />
        </div>

        {/* Search - Desktop */}
        <div className="flex-1 mx-4 lg:mx-8 hidden md:flex">
          <div className="w-full relative">
            <Input
              type="text"
              placeholder={text || "Tìm kiếm sản phẩm..."}
              className="w-full rounded-full py-2 pl-4 pr-12 bg-gray-50 border border-gray-200 focus:border-amber-500 focus:bg-white transition"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden hover:bg-gray-100"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          >
            <Search className="w-5 h-5" />
          </Button>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-2">
            {!user && (
              <Button variant="ghost" onClick={() => navigate("/login")}>
                Đăng nhập
              </Button>
            )}

            <Button variant="ghost" onClick={() => navigate("/news")}>
              Tin tức
            </Button>

            <Button variant="ghost" onClick={() => navigate("/wishlist")}>
              Yêu thích
            </Button>
          </div>

          {/* User Dropdown */}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                onClick={() => setOpen(!open)}
                className="gap-2 text-gray-700 hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold">
                  {user.first_name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm">
                  {user.last_name}
                </span>
              </Button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 bg-white shadow-xl rounded-2xl p-2 border border-gray-200 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      navigate("/my-orders");
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-lg transition flex items-center gap-3 text-sm text-gray-700 hover:text-amber-600"
                  >
                    <Package className="w-4 h-4" />
                    Đơn hàng của tôi
                  </button>

                  <button
                    onClick={() => {
                      navigate("/customer/profile");
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-lg transition flex items-center gap-3 text-sm text-gray-700 hover:text-amber-600"
                  >
                    <User className="w-4 h-4" />
                    Hồ sơ cá nhân
                  </button>

                  <div className="my-1 border-t border-gray-200" />

                  <button
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-3 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Shopping Cart Button */}
          <Button onClick={() => navigate("/cart")} className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Giỏ hàng</span>
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 border-t border-gray-200">
          <div className="w-full relative">
            <Input
              type="text"
              placeholder={text || "Tìm kiếm sản phẩm..."}
              className="w-full rounded-full py-2 pl-4 pr-12 bg-gray-50 border border-gray-200 focus:border-amber-500 focus:bg-white transition"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-full transition duration-300">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-gray-50">
          <div className="px-4 py-3 space-y-1">
            {!user && (
              <Button
                variant="ghost"
                onClick={() => {
                  navigate("/login");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start text-gray-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Đăng nhập
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => {
                navigate("/news");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-gray-700"
            >
              Tin tức
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                navigate("/wishlist");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-gray-700"
            >
              Yêu thích
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
