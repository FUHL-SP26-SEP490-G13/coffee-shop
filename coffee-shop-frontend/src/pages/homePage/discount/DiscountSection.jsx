import { useState, useEffect } from "react";
import { Sparkles, Copy, CheckCircle2, Ticket, ArrowRight, Tag, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import discountService from "@/services/discountService";
import { STORAGE_KEYS } from "@/constants";

export default function DiscountSection() {
  const [discounts, setDiscounts] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");

  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const isLoggedIn = !!token;

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const res = await discountService.getPublic();
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        setDiscounts(list);
      } catch (error) {
        console.error("Lỗi lấy danh sách khuyến mãi:", error);
      }
    };
    fetchDiscounts();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode("");
    }, 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const displayDiscounts = discounts.slice(0, 3).map((d) => {
    let highlightText = "";
    if (d.percentage > 0) {
      highlightText = `${Number(d.percentage)}%`;
    } else if (d.max_discount_amount > 0) {
      highlightText = `${Number(d.max_discount_amount) / 1000}K`;
    }

    const title = d.percentage > 0
      ? `Giảm ${Number(d.percentage)}% đơn từ ${d.min_order_amount > 0 ? (d.min_order_amount / 1000) + 'K' : '0đ'}`
      : (d.max_discount_amount > 0 ? `Giảm ${Number(d.max_discount_amount) / 1000}K` : 'Khuyến mãi đặc biệt');

    const minOrder = d.min_order_amount > 0 ? `Đơn tối thiểu ${Number(d.min_order_amount).toLocaleString('vi-VN')}đ` : 'Áp dụng mọi đơn';

    return {
      id: d.id,
      highlight: highlightText,
      title,
      description: d.description,
      minOrder,
      code: d.code,
      endDate: d.end_date
    };
  });

  if (displayDiscounts.length === 0 && isLoggedIn) return null;

  return (
    <section className="py-8 md:py-12 bg-white dark:bg-gray-950">
      <div className="w-full px-4 lg:px-6 xl:px-8">
        <div className="bg-[#F8F5F0] dark:bg-[#1a1614] rounded-none sm:rounded-3xl py-12 md:py-16 px-4 sm:px-8 lg:px-12 w-full">
          {displayDiscounts.length > 0 && (
            <>
              {/* Tiêu đề Section */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
                <div className="text-center sm:text-left space-y-3 mx-auto sm:mx-0 flex-1 flex flex-col items-center">
                  <h2 className="text-2xl md:text-3xl font-semibold text-amber-900 dark:text-amber-500" style={{ fontFamily: 'serif' }}>
                    Mã ưu đãi dành cho bạn
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                    Áp dụng ngay để tiết kiệm hơn
                  </p>
                </div>
              </div>

              {/* Lưới các thẻ khuyến mãi */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayDiscounts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#FAF9F6] dark:bg-[#252220] border-2 border-dashed border-amber-800/20 dark:border-amber-700/30 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-600/50 transition-all flex flex-col h-full"
                  >
                    <div className="flex items-center gap-2 mb-4 text-amber-900 dark:text-amber-500">
                      <Tag className="w-6 h-6" />
                      <h3 className="text-2xl font-bold tracking-tight">
                        {item.highlight}
                      </h3>
                    </div>

                    <div className="mb-6 flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {item.minOrder}
                      </p>
                      {item.endDate && (
                        <p className="text-sm text-gray-400 dark:text-gray-500">
                          HSD: {formatDate(item.endDate)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-auto">
                      <div className="flex-1 bg-[#F2F0E9] dark:bg-gray-800 rounded-lg px-3 py-2 text-center font-bold text-sm tracking-widest text-gray-800 dark:text-gray-200 truncate flex items-center justify-center min-h-[36px]">
                        {item.code}
                      </div>
                      <button
                        onClick={() => handleCopy(item.code)}
                        className="flex items-center justify-center gap-1.5 bg-[#8c5226] hover:bg-[#70421e] text-white px-3 py-2 rounded-lg transition-colors shadow-sm shrink-0 min-h-[36px]"
                      >
                        {copiedCode === item.code ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-[13px] font-medium">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[13px] font-medium">Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-10">
                <Link to="/discounts">
                  <Button
                    variant="outline"
                    className="gap-2 hover:gap-3 transition-all shadow-sm hover:shadow-md border-primary/20 hover:border-primary hover:bg-primary/5 group hover:text-primary"
                  >
                    <span className="font-semibold">Xem tất cả</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </>
          )}

          {!isLoggedIn && (
            <div className={`bg-[#FAF9F6] dark:bg-[#252220] rounded-2xl p-8 md:p-12 shadow-sm text-center flex flex-col items-center w-full border border-amber-900/5 dark:border-amber-700/10 ${displayDiscounts.length > 0 ? "mt-12" : ""}`}>
              <LogIn className="w-12 h-12 text-amber-900 dark:text-amber-500 mb-4" strokeWidth={1.5} />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3" style={{ fontFamily: 'serif' }}>
                Đăng nhập để nhận ưu đãi riêng
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg">
                Lưu địa chỉ giao hàng, nhận mã giảm giá dành riêng cho bạn
              </p>
              <Link to="/login">
                <Button className="bg-[#8c5226] hover:bg-[#70421e] text-white rounded-md px-8 py-2 font-medium">
                  Đăng nhập ngay
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
