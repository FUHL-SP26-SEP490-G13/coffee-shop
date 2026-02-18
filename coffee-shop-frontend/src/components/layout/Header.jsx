import { useEffect, useState, useRef } from "react";
import { ShoppingCart, Search, User, LogOut, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  console.log("Decoded user:", user);


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
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <h1
          className="text-2xl font-bold text-[#b71c1c] cursor-pointer"
          onClick={() => navigate("/")}
        >
          Coffee Shop
        </h1>

        {/* Search */}
        <div className="flex-1 mx-10 hidden md:flex">
          <div className="w-full relative">
            <input
              type="text"
              placeholder={text}
              className="w-full bg-gray-100 rounded-full py-3 pl-6 pr-14 outline-none text-sm"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#b71c1c] text-white p-2 rounded-full hover:bg-[#8e0000] transition">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-6">
          {!user && (
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Đăng nhập
            </Button>
          )}

          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 font-medium"
              >
                <User className="w-5 h-5" />
                Xin chào {user.last_name + " " + user.first_name}
              </button>

              {open && (
                <div className="absolute right-0 mt-3 w-52 bg-white shadow-lg rounded-xl p-2 border animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => navigate("/my-orders")}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                  >
                    <Package className="inline w-4 mr-2" />
                    Đơn hàng của tôi
                  </button>

                  <button
                    onClick={() => navigate("/customer/profile")}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
                  >
                    <Package className="inline w-4 mr-2" />
                    Hồ sơ cá nhân
                  </button>

                  <hr className="my-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <LogOut className="inline w-4 mr-2" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}

          <Button className="bg-[#b71c1c] hover:bg-[#8e0000]">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Giỏ hàng
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
