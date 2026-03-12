import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function HomeBanner({
  banners = [],
  activeBannerIndex = 0,
  setActiveBannerIndex,
  defaultImage,
}) {
  const safeBannerIndex =
    banners.length > 0 ? activeBannerIndex % banners.length : 0;

  return (
    <section className="relative w-full h-[260px] sm:h-[340px] lg:h-[600px] overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={banners.length > 1}
        pagination={{ clickable: true }}
        onSlideChange={(swiper) => setActiveBannerIndex(swiper.realIndex)}
        className="w-full h-full homepage-banner-swiper"
      >
        {(banners.length ? banners : [null]).map((b, idx) => (
          <SwiperSlide key={b?.id ?? idx}>
            <div className="relative w-full h-full group">
              <img
                src={b?.image_url || defaultImage}
                alt={b?.title || "Banner"}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent">
                <div className="container mx-auto px-6 sm:px-10 lg:px-20 h-full flex items-center">
                  <div className="max-w-2xl text-white">
                    <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 lg:mb-6 leading-tight">
                      {b?.title || "Chào mừng đến với cửa hàng của chúng tôi"}
                    </h2>

                    <p className="text-base sm:text-lg lg:text-2xl mb-6 lg:mb-8 text-gray-100 leading-relaxed">
                      {b?.subtitle || "Khám phá những sản phẩm nổi bật hôm nay"}
                    </p>

                    {(b?.button_text || b?.button_link) && (
                      <Link to={b?.button_link || "/"}>
                        <Button
                          size="lg"
                          className="bg-[#C65D2E] hover:bg-[#B55329] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105"
                        >
                          {b?.button_text || "Xem ngay"}
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {banners.length > 0 && (
        <div className="bg-[#f4eddc] py-6 text-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {banners[safeBannerIndex]?.title}
          </h3>
          <p className="text-gray-600 mt-2">
            {banners[safeBannerIndex]?.subtitle}
          </p>
        </div>
      )}
    </section>
  );
}
