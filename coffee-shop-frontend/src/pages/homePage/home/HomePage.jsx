import { useCallback, useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { ArrowUp } from "lucide-react";
import FadeInView from "@/components/common/FadeInView";
import useFetch from "@/hooks/useFetch";
import productService from "@/services/productService";
import bannerService from "@/services/bannerService";
import categoryService from "@/services/categoryService";
import FeaturedNews from "@/pages/homePage/news/FeaturedNews";
import HomeBanner from "@/pages/homePage/banner/HomeBanner";
import FlashSaleSection from "@/pages/homePage/product/FlashSaleSection";
import BestSellerSection from "@/pages/homePage/product/BestSellerSection";
import ReviewSection from "@/pages/homePage/review/ReviewSection";
import OrderGuideSection from "@/pages/homePage/order/OrderGuideSection";
import InstagramFeedSection from "@/pages/homePage/follow/InstagramFeedSection";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AiAssistantWidget from "@/components/layout/AiAssistantWidget";


export default function HomePage() {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const shopName = localStorage.getItem("cached_store_name") || "Coffee Shop";
    document.title = `Trang chủ | ${shopName}`;
  }, []);

  useEffect(() => {
    if (location.state?.orderSuccess) {
      const end = Date.now() + 2 * 1000;
      const colors = ["#f59e0b", "#d97706", "#fbbf24"];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchProducts = useCallback(() => {
    return productService.getBestSellers({ limit: 8 });
  }, []);

  const { data, loading } = useFetch(fetchProducts);

  const products = useMemo(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  const fetchCategories = useCallback(() => {
    return categoryService.getAll({ page: 1, limit: 100 });
  }, []);
  const { data: catData } = useFetch(fetchCategories);

  const categories = useMemo(() => {
    return Array.isArray(catData?.data) ? catData.data : [];
  }, [catData]);

  const fetchBanners = useCallback(() => {
    return bannerService.getActiveList();
  }, []);

  const { data: bannerRes } = useFetch(fetchBanners);

  const banners = bannerRes?.data ?? [];

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const getThumbnail = (product) => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      const thumbnail = product.images.find(
        (img) => Number(img?.isThumbnail ?? 0) === 1
      );

      return (
        thumbnail?.image_url || product.images[0]?.image_url || defaultImage
      );
    }

    return product?.image_url || defaultImage;
  };

  const getDefaultCartSize = (product) => {
    const sizes = Array.isArray(product?.sizes) ? product.sizes : [];

    if (!sizes.length) return null;

    const sizeS = sizes.find(
      (size) => String(size?.size).trim().toUpperCase() === "S"
    );

    if (sizeS && Number(sizeS?.price) > 0) {
      return sizeS;
    }

    const validSizes = sizes
      .filter((size) => Number(size?.price) > 0)
      .sort((a, b) => Number(a.price) - Number(b.price));

    return validSizes[0] || null;
  };

  const getDisplayPrice = (product) => {
    const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
    const validPrices = sizes
      .map((size) => Number(size?.price))
      .filter((price) => Number.isFinite(price) && price > 0);

    if (validPrices.length === 0) return "Liên hệ";

    const minPrice = Math.min(...validPrices);
    const maxPrice = Math.max(...validPrices);

    if (minPrice === maxPrice) {
      return `${minPrice.toLocaleString("vi-VN")}đ`;
    }

    return `${minPrice.toLocaleString("vi-VN")}đ - ${maxPrice.toLocaleString("vi-VN")}đ`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 dark:border-gray-800">
      <Header />

      <FadeInView delay={0} duration={1200}>
        <div className="w-full bg-white dark:bg-gray-950 pb-4">
          <div className="w-full px-4 lg:px-6 xl:px-8 relative flex items-stretch">
            {/* BANNER */}
            <div className="flex-1 w-full overflow-hidden">
              <HomeBanner
                banners={banners}
                activeBannerIndex={activeBannerIndex}
                setActiveBannerIndex={setActiveBannerIndex}
                defaultImage={defaultImage}
              />
            </div>
          </div>
        </div>
      </FadeInView>

      <FadeInView>
        <FlashSaleSection
          products={products}
          getThumbnail={getThumbnail}
          getDefaultCartSize={getDefaultCartSize}
        />
      </FadeInView>

      <FadeInView>
        <BestSellerSection
          loading={loading}
          products={products}
          getThumbnail={getThumbnail}
          getDisplayPrice={getDisplayPrice}
        />
      </FadeInView>

      <FadeInView>
        <ReviewSection />
      </FadeInView>

      <FadeInView>
        <OrderGuideSection />
      </FadeInView>

      <FadeInView delay={200}>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
      </FadeInView>


      <FadeInView>
        <FeaturedNews />
      </FadeInView>

      <FadeInView>
        <InstagramFeedSection />
      </FadeInView>

      <AiAssistantWidget />

      <Footer />

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 right-6 p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg shadow-amber-900/20 z-40 transition-all duration-300 ${showScrollTop ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
          }`}
        title="Cuộn lên đầu trang"
      >
        <ArrowUp className="w-6 h-6" />
      </button>

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
