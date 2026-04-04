import { useEffect, useState } from "react";
import { Star, Quote, X } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/navigation";
import reviewService from "@/services/reviewService";
import receiptSettingService from "@/services/receiptSettingService";

export default function ReviewSection() {
  const [reviews, setReviews] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [storeName, setStoreName] = useState("Coffee Shop");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await reviewService.getPublic();
        const list = Array.isArray(res?.data) ? res.data : [];
        setReviews(list);
      } catch (error) {
        console.error("Lỗi tải đánh giá public:", error);
      }
    };
    fetchReviews();

    const fetchSettings = async () => {
      try {
        const res = await receiptSettingService.getActive();
        const data = res?.data || null;
        if (data && data.store_name) {
          setStoreName(data.store_name);
        }
      } catch (error) {
        console.error("Lỗi lấy cấu hình cửa hàng:", error);
      }
    };
    fetchSettings();
  }, []);

  if (reviews.length === 0) return null;

  const renderReviewContent = (review) => {
    const nameParts = (review.full_name || "Khách Hàng").trim().split(' ');
    const initials = nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : (review.full_name.substring(0, 2) || "KH").toUpperCase();

    const colors = ['bg-[#8B4513]', 'bg-[#A0522D]', 'bg-[#CD853F]', 'bg-[#D2691E]'];
    const avatarColor = colors[(review.id || 0) % colors.length];

    const cmt = review.comment ? review.comment : "Khách hàng đã mua";

    const imgs = typeof review.images === 'string' ? JSON.parse(review.images || "[]") : (review.images || []);

    return (
      <div className="bg-[#FAF9F6] dark:bg-[#252220] rounded-2xl p-8 relative shadow-sm border border-transparent hover:border-amber-200 hover:shadow-md transition-all flex flex-col h-full mx-1 mt-1">
        <Quote className="absolute top-6 right-6 w-10 h-10 text-amber-900/5 rotate-180" />

        <div className="flex items-center gap-4 mb-5">
          <div className={`w-12 h-12 ${avatarColor} text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0 shadow-sm`}>
            {initials}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base lg:text-lg">
              {review.full_name || "Khách hàng"}
            </h3>
            <div className="flex gap-0.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < (review.rating || 5) ? "fill-[#F59E0B] text-[#F59E0B]" : "fill-gray-200 text-gray-200"}`}
                />
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-normal flex-grow mb-6 max-h-[140px] overflow-y-auto pr-1">
          {cmt}
        </p>

        <div className="flex gap-2 mt-auto w-full h-24 sm:h-32">
          {imgs && imgs.length > 0 ? (
            imgs.map((img, idx) => (
              <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-xl overflow-hidden shadow-sm border border-amber-100 block hover:opacity-90 transition-opacity">
                <img src={img.url} alt={`Review ${idx}`} className="w-full h-full object-cover" loading="lazy" />
              </a>
            ))
          ) : (
            <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border border-amber-100">
              <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80" alt="Review default" className="w-full h-full object-cover opacity-80 filter brightness-90" loading="lazy" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="py-8 md:py-12 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="w-full px-4 lg:px-6 xl:px-8">
        <div className="bg-[#EFE8D8] dark:bg-[#1f1b1a] rounded-none sm:rounded-3xl py-12 md:py-16 px-4 sm:px-8 lg:px-12 w-full">
        <div className="text-center pb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-amber-900 dark:text-amber-500" style={{ fontFamily: 'serif' }}>
            Khách hàng nói gì
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base mt-4">
            Hàng nghìn khách hàng tin tưởng {storeName}
          </p>
        </div>
        <div className="relative review-swiper-container">
          <Swiper
            modules={[Pagination, Navigation, Autoplay]}
            spaceBetween={32}
            slidesPerView={1}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet bg-gray-400 opacity-50 w-2.5 h-2.5 mx-1.5 rounded-full inline-block cursor-pointer transition-all duration-300",
              bulletActiveClass: "swiper-pagination-bullet-active !bg-amber-700 !opacity-100 !w-6",
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
            className="pb-16" // padding bottom to render pagination bullets
          >
            {reviews.slice(0, 6).map((review) => (
              <SwiperSlide key={review.id} className="h-auto">
                {renderReviewContent(review)}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {reviews.length > 6 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setShowAll(true)}
              className="px-8 py-3 bg-white dark:bg-gray-800 border border-amber-600/30 text-amber-700 dark:text-amber-500 rounded-full font-semibold hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 dark:hover:text-white transition-all shadow-sm"
            >
              Xem tất cả đánh giá ({reviews.length})
            </button>
          </div>
        )}

        {showAll && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
            <div className="bg-[#EFE8D8] dark:bg-[#1f1b1a] w-full max-w-6xl max-h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
              <div className="p-5 border-b border-amber-900/10 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-black/20">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: 'serif' }}>
                  Tất cả đánh giá ({reviews.length})
                </h3>
                <button
                  onClick={() => setShowAll(false)}
                  className="p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviews.map(review => (
                    <div key={review.id} className="h-full">
                      {renderReviewContent(review)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  );
}
