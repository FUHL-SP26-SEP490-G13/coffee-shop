import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import reviewService from "@/services/reviewService";

export default function ReviewSection() {
  const [reviews, setReviews] = useState([]);

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
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-16 lg:py-24 bg-[#EFE8D8] dark:bg-[#1f1b1a] overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="text-xl md:text-3xl font-semibold text-center text-gray-900 dark:text-gray-100 mb-12" style={{ fontFamily: 'serif' }}>
          Khách hàng nói gì
        </h2>
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
            {reviews.map((review) => {
              const nameParts = (review.full_name || "Khách Hàng").trim().split(' ');
              const initials = nameParts.length > 1 
                ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
                : (review.full_name.substring(0, 2) || "KH").toUpperCase();

              const colors = ['bg-[#8B4513]', 'bg-[#A0522D]', 'bg-[#CD853F]', 'bg-[#D2691E]'];
              const avatarColor = colors[(review.id || 0) % colors.length];

              return (
                <SwiperSlide key={review.id} className="h-auto">
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

                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-normal">
                      {review.comment}
                    </p>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
