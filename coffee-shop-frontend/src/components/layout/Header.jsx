import { useEffect, useState } from "react";
import { ShoppingCart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();

  // Danh sách placeholder sẽ chạy
  const placeholders = [
    "Xin chào, bạn cần gì hôm nay?",
    "Cà phê sữa đá",
    "Trà đào cam sả",
    "Sinh tố bơ béo ngậy",
  ];

  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);

  // Typing effect
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

        {/* Search box */}
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
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </Button>

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
