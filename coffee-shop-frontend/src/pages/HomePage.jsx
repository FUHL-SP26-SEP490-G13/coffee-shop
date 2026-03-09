import { useCallback, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ArrowRight } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import productService from "@/services/productService";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Link } from "react-router-dom";
import FeaturedNews from "@/components/news/FeaturedNews";
import bannerService from "@/services/bannerService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function HomePage() {
  const fetchProducts = useCallback(() => {
    return productService.getAll({ status: "available" });
  }, []);

  const { data, loading } = useFetch(fetchProducts);
  const products = useMemo(() => {
    const productList = Array.isArray(data?.data) ? data.data : [];
    return productList.filter((product) => Number(product?.is_deleted ?? 0) === 0);
  }, [data]);

  const fetchBanners = useCallback(() => {
    return bannerService.getActiveList();
  }, []);

  const { data: bannerRes } = useFetch(fetchBanners);

  const banners = (bannerRes?.data ?? []).filter((b) => {
    if (!b) return false;

    const now = new Date();
    const start = b.start_date ? new Date(b.start_date) : null;
    const end = b.end_date ? new Date(b.end_date) : null;

    if (start && Number.isNaN(start.getTime())) return false;
    if (end && Number.isNaN(end.getTime())) return false;

    if (start && now < start) return false;
    if (end && now > end) return false;

    return true;
  });

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const getThumbnail = (product) => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      const thumbnail = product.images.find(
        (img) => Number(img?.isThumbnail ?? 0) === 1,
      );

      return thumbnail?.image_url || product.images[0]?.image_url || defaultImage;
    }

    return product?.image_url || defaultImage;
  };

  const formatPrice = (product) => {
    const sizePrices = (Array.isArray(product?.sizes) ? product.sizes : [])
      .map((size) => Number(size?.price))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (sizePrices.length > 0) {
      const minPrice = Math.min(...sizePrices);
      const maxPrice = Math.max(...sizePrices);

      if (minPrice === maxPrice) {
        return `${minPrice.toLocaleString("vi-VN")}đ`;
      }

      return `${minPrice.toLocaleString("vi-VN")}đ - ${maxPrice.toLocaleString("vi-VN")}đ`;
    }

    const fallbackPrice = Number(product?.min_price ?? product?.price);
    if (Number.isFinite(fallbackPrice) && fallbackPrice > 0) {
      return `${fallbackPrice.toLocaleString("vi-VN")}đ`;
    }

    return "Liên hệ";
  };
  const YOUTUBE_VIDEO_ID = "eDyD7y3M_c0";
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const safeBannerIndex =
    banners.length > 0 ? activeBannerIndex % banners.length : 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* ===== HERO BANNER ===== */}
      <section className="relative w-full h-[260px] sm:h-[340px] lg:h-[600px] overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop={banners.length > 1}
          pagination={{ clickable: true }}
          navigation={banners.length > 1}
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
                        {b?.subtitle ||
                          "Khám phá những sản phẩm nổi bật hôm nay"}
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

      {/* ===== MENU SECTION ===== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-amber-600 text-2xl sm:text-xl lg:text-2xl font-bold tracking-widest uppercase mb-3">
              Menu Đặc Sắc
            </p>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Khám phá những lựa chọn tuyệt vời được chọn lựa kỹ lưỡng cho bạn
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
                <p className="text-gray-600">Đang tải sản phẩm...</p>
              </div>
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="group h-full transition-all duration-300"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.08}s both`,
                  }}
                >
                  <Card className="overflow-hidden h-full flex flex-col bg-white border border-gray-200 hover:border-amber-300 shadow-md hover:shadow-2xl transition-all duration-500">
                    <div className="relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 h-52 sm:h-60">
                      <img
                        src={getThumbnail(product)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1509042239860-f550ce710b93";
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Mới
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 flex flex-col flex-grow">
                      <h4 className="font-bold text-base sm:text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors duration-300">
                        {product.name}
                      </h4>

                      <p className="text-sm text-gray-600 mb-4 sm:mb-6 line-clamp-2 flex-grow leading-relaxed">
                        {product.description ||
                          "Thưởng thức hương vị đặc biệt của chúng tôi"}
                      </p>

                      <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-2xl sm:text-3xl font-bold text-amber-600">
                            {formatPrice(product)}
                          </p>
                          <p className="text-xs text-gray-500">VNĐ</p>
                        </div>

                        <Button size="sm" className="gap-1.5">
                          <Plus className="w-4 h-4" />
                          <span className="hidden sm:inline ml-1">Thêm</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600">
                Hiện chưa có sản phẩm. Vui lòng quay lại sau!
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

      {/* ===== INTRO VIDEO ===== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-amber-600 font-bold sm:text-xl lg:text-2xl tracking-widest uppercase mb-3">
              Giới thiệu
            </p>
            <h4 className="text-xl sm:text-lg lg:text-2xl text-gray-900 mb-3 leading-tight">
              Một chút thư giãn với cà phê tuyệt hảo
            </h4>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Một chút không gian, một chút hương vị — và rất nhiều cảm hứng từ
              cà phê.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-black">
            <div className="relative w-full pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                title="Coffee Intro Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      <FeaturedNews />
      <Footer />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .homepage-banner-swiper .swiper-button-prev,
        .homepage-banner-swiper .swiper-button-next {
          color: white;
          background: rgba(255,255,255,0.18);
          width: 48px;
          height: 48px;
          border-radius: 9999px;
          backdrop-filter: blur(8px);
        }

        .homepage-banner-swiper .swiper-button-prev:after,
        .homepage-banner-swiper .swiper-button-next:after {
          font-size: 18px;
          font-weight: 700;
        }

        .homepage-banner-swiper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.6);
          opacity: 1;
        }

        .homepage-banner-swiper .swiper-pagination-bullet-active {
          background: #C65D2E;
        }
      `}</style>
    </div>
  );
}
