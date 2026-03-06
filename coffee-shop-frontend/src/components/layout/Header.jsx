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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex justify-between items-center gap-2 sm:gap-3 lg:gap-4">
        {/* Logo */}
        <div
          className="flex-shrink-0 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={Logo}
            alt="Coffee Shop Logo"
            className="h-10 sm:h-12 w-auto hover:opacity-80 transition-opacity duration-300"
          />
        </div>

        {/* Search - Desktop */}
        <div className="flex-1 mx-2 sm:mx-4 lg:mx-8 hidden md:flex">
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
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
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
          <div className="hidden sm:flex items-center gap-1 lg:gap-2">
            {!user && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-xs sm:text-sm">
                Đăng nhập
              </Button>
            )}

            {/* User Dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(!open)}
                  className="gap-1 sm:gap-2 text-gray-700 transition p-1.5 sm:p-2"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.first_name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline text-sm">
                    {user.last_name}
                  </span>
                </Button>

                {open && (
                  <div className="absolute right-0 mt-1 w-48 sm:w-56 bg-white shadow-xl rounded-lg sm:rounded-2xl p-1.5 sm:p-2 border border-gray-200 animate-in fade-in zoom-in-95">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigate("/my-orders");
                        setOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700 transition text-xs sm:text-sm justify-start"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      <span>Đơn hàng</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigate("/customer/profile");
                        setOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700 transition text-xs sm:text-sm justify-start"
                    >
                      <User className="w-4 h-4 mr-2" />
                      <span>Hồ sơ cá nhân</span>
                    </Button>

                    <div className="my-0.5 border-t border-gray-200" />

                    <button
                      onClick={() => {
                        handleLogout();
                        setOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded transition flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={() => navigate("/news")} className="text-xs sm:text-sm hidden lg:block">
              Tin tức
            </Button>

            <Button variant="ghost" size="sm" onClick={() => navigate("/wishlist")} className="text-xs sm:text-sm hidden lg:block">
              Yêu thích
            </Button>
          </div>

          {/* Shopping Cart Button */}
          <Button onClick={() => navigate("/cart")} size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm">
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
        <div className="md:hidden px-3 pb-3 border-t border-gray-200 bg-gray-50">
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
          <div className="px-3 py-2 space-y-0.5">
            {!user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigate("/login");
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start text-gray-700 text-xs"
              >
                <Home className="w-4 h-4 mr-2" />
                Đăng nhập
              </Button>
            )}

            {user && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigate("/customer/profile");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-gray-700 text-xs"
                >
                  <User className="w-4 h-4 mr-2" />
                  Hồ sơ cá nhân
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigate("/my-orders");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-gray-700 text-xs"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Đơn hàng
                </Button>
                <div className="my-0.5 border-t border-gray-200" />
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded transition flex items-center gap-2 text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate("/news");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-gray-700 text-xs"
            >
              Tin tức
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigate("/wishlist");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start text-gray-700 text-xs"
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
