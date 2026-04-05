import React, { useState, useEffect } from "react";
import { Sparkles, Copy, CheckCircle2, Tag, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import discountService from "@/services/discountService";
import PaginationControl from "@/components/common/PaginationControl";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/constants";

export default function DiscountListPage() {
  const [discounts, setDiscounts] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const isLoggedIn = !!token;

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        const res = await discountService.getPublic();
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        setDiscounts(list);
      } catch (error) {
        console.error("Lỗi lấy danh sách khuyến mãi:", error);
      } finally {
        setLoading(false);
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

  const displayDiscounts = discounts.map((d) => {
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

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors">
      <Header />
      <main className="flex-1 w-full w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 md:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="text-base md:text-lg text-gray-500 dark:text-gray-400 flex items-center flex-wrap gap-2 font-medium">
            <Link to="/" className="cursor-pointer hover:text-amber-600 transition-colors">Trang chủ</Link>
            <span className="text-gray-400">/</span>
            <span className="text-amber-600 font-bold">Ưu đãi</span>
          </div>
        </div>

        <div className="text-center mb-12 animate-in slide-in-from-bottom-5 duration-700">
          <h1 className="text-2xl md:text-3xl font-semibold text-amber-900 dark:text-amber-500" style={{ fontFamily: 'serif' }}>
            Tất cả ưu đãi dành cho bạn
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mt-4">
            Hãy lưu lại hoặc sao chép mã để sử dụng khi thanh toán nhé
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : displayDiscounts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400">Hiện tại không có khuyến mãi nào đang áp dụng.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayDiscounts.slice((page - 1) * pageSize, page * pageSize).map((item, index) => (
                <div
                  key={item.id}
                  className="bg-[#FAF9F6] dark:bg-[#252220] border-2 border-dashed border-amber-800/20 dark:border-amber-700/30 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-600/50 transition-all flex flex-col h-full animate-in zoom-in-95 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
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

            {displayDiscounts.length > pageSize && (
              <div className="mt-12 flex justify-center">
                <PaginationControl
                  currentPage={page}
                  totalPages={Math.ceil(displayDiscounts.length / pageSize)}
                  onPageChange={setPage}
                  minPage={1}
                />
              </div>
            )}
            
            {!isLoggedIn && (
              <div className={`bg-[#FAF9F6] dark:bg-[#252220] rounded-2xl p-8 md:p-12 shadow-sm text-center flex flex-col items-center w-full border border-amber-900/5 dark:border-amber-700/10 mt-12`}>
                <LogIn className="w-12 h-12 text-amber-900 dark:text-amber-500 mb-4" strokeWidth={1.5} />
                <h3 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3" style={{ fontFamily: 'serif' }}>
                  Đăng nhập để nhận ưu đãi riêng
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg">
                  Lưu địa chỉ giao hàng, xem sản phẩm yêu thích, nhận mã giảm giá dành riêng cho bạn
                </p>
                <Link to="/login">
                  <Button className="bg-[#8c5226] hover:bg-[#70421e] text-white rounded-md px-8 py-2 font-medium">
                    Đăng nhập ngay
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
