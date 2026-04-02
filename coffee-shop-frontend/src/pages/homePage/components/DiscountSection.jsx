import { useState, useEffect } from "react";
import { Sparkles, Copy, CheckCircle2, Ticket } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import discountService from "@/services/discountService";

export default function DiscountSection() {
  const [discounts, setDiscounts] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");

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

  const displayDiscounts = discounts.map((d) => {
    const title = d.percentage > 0
      ? `Giảm ${Number(d.percentage)}%`
      : (d.max_discount_amount > 0 ? `Giảm ${Number(d.max_discount_amount).toLocaleString('vi-VN')}đ` : 'Khuyến mãi đặc biệt');

    const desc = d.description || `Mã ưu đãi đặc biệt`;
    const minOrder = d.min_order_amount > 0 ? `Đơn tối thiểu: ${Number(d.min_order_amount).toLocaleString('vi-VN')}đ` : '';

    return {
      id: d.id,
      title,
      description: desc,
      minOrder,
      code: d.code
    };
  });

  if (displayDiscounts.length === 0) return null;

  return (
    <section className="py-16 bg-[#F8F5F0] dark:bg-[#1a1614]">
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-amber-600 font-semibold mb-3 tracking-widest text-sm uppercase">
            <Sparkles className="w-4 h-4" />
            Ưu đãi
          </div>
          <h5 className="text-xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100" style={{ fontFamily: 'serif' }}>
            Khuyến mãi hôm nay
          </h5>
        </div>

        <div className="relative discount-swiper-container px-2">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true, dynamicBullets: true }}
            breakpoints={{
              640: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
            className="pb-12"
          >
            {displayDiscounts.map((item) => (
              <SwiperSlide key={item.id} className="h-auto">
                <div className="bg-[#FAF9F6] dark:bg-[#252220] border-t-4 border-t-amber-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="flex items-start gap-3 mb-2 flex-1">
                    <Ticket className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1" style={{ fontFamily: 'serif' }}>
                        {item.title}
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-6 min-h-[60px] flex flex-col">
                        <span className="line-clamp-2" title={item.description}>{item.description}</span>
                        {item.minOrder && (
                          <span className="mt-1.5 inline-block text-[13px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40/50 px-2 py-0.5 rounded-md w-fit">
                            * {item.minOrder}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-auto">
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 text-center font-mono font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {item.code}
                    </div>
                    <button
                      onClick={() => handleCopy(item.code)}
                      className="flex items-center gap-2 bg-white dark:bg-gray-900 dark:bg-gray-900 dark:border-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg transition-colors shadow-sm shrink-0"
                    >
                      {copiedCode === item.code ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 text-sm font-medium">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span className="text-sm font-medium">Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
      <style>{`
        .discount-swiper-container .swiper-button-next,
        .discount-swiper-container .swiper-button-prev {
          color: #92400e;
          background: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgb(0 0 0 / 0.1);
        }
        html.dark .discount-swiper-container .swiper-button-next,
        html.dark .discount-swiper-container .swiper-button-prev {
          background: #1f2937;
          color: #fbbf24;
        }
        .discount-swiper-container .swiper-button-next:after,
        .discount-swiper-container .swiper-button-prev:after {
          font-size: 14px;
          font-weight: bold;
        }
        .discount-swiper-container .swiper-button-next.swiper-button-disabled,
        .discount-swiper-container .swiper-button-prev.swiper-button-disabled {
          opacity: 0;
        }
        .discount-swiper-container .swiper-pagination-bullet-active {
          background: #92400e;
        }
      `}</style>
    </section>
  );
}
