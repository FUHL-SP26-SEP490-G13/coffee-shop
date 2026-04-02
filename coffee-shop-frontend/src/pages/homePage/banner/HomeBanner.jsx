import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

export default function HomeBanner({
  banners = [],
  activeBannerIndex = 0,
  setActiveBannerIndex,
  defaultImage,
}) {
  const visibleBanners = banners.filter((b) => b?.is_active !== false);

  const safeBannerIndex =
    visibleBanners.length > 0 ? activeBannerIndex % visibleBanners.length : 0;

  const displayBanners = visibleBanners.length > 0 ? visibleBanners : [null];

  return (
    <section className="relative">
      <Swiper
        modules={[Pagination, Autoplay, EffectFade]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        effect="fade"
        loop={displayBanners.length > 1}
        onSlideChange={(swiper) => {
          if (visibleBanners.length > 0 && setActiveBannerIndex) {
            setActiveBannerIndex(swiper.realIndex);
          }
        }}
        className="w-full [&_.swiper-pagination-bullet]:h-2.5 [&_.swiper-pagination-bullet]:w-2.5 [&_.swiper-pagination-bullet]:bg-primary-foreground/50 [&_.swiper-pagination-bullet]:opacity-100 [&_.swiper-pagination-bullet-active]:bg-primary-foreground [&_.swiper-pagination-bullet-active]:w-8 [&_.swiper-pagination-bullet-active]:rounded-full [&_.swiper-pagination]:!bottom-6"
      >
        {displayBanners.map((banner, idx) => (
          <SwiperSlide key={banner?.id ?? idx}>
            <div className="relative h-[340px] w-full overflow-hidden sm:h-[440px] lg:h-[540px]">
              <img
                src={banner?.image_url || defaultImage}
                alt={banner?.title || "Banner"}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[8000ms] ease-out hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/30 to-transparent" />

              <div className="absolute inset-0 flex items-center">
                <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
                  <div className="max-w-lg">
                    <h1
                      className="text-3xl font-bold leading-tight text-primary-foreground sm:text-4xl lg:text-5xl"
                      style={{ lineHeight: "1.1" }}
                    >
                      {banner?.title ||
                        "Chào mừng đến với cửa hàng của chúng tôi"}
                    </h1>

                    <p className="mt-4 text-sm leading-relaxed text-primary-foreground/85 sm:text-base lg:text-lg">
                      {banner?.subtitle ||
                        "Khám phá những sản phẩm nổi bật hôm nay"}
                    </p>

                    {banner?.button_link && (
                      <Link
                        to={banner.button_link}
                        className="mt-6 inline-block rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:brightness-110 hover:shadow-xl active:scale-[0.97] sm:text-base"
                      >
                        {banner?.button_text || "Xem ngay"}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {visibleBanners.length > 0 && (
        <div className="border-b border-border/50 bg-card">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3 lg:px-8">
            <span className="h-1 w-8 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {visibleBanners[safeBannerIndex]?.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {visibleBanners[safeBannerIndex]?.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
