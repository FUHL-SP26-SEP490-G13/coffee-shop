import { useCallback, useMemo, useState } from "react";
import useFetch from "../../hooks/useFetch";
import productService from "@/services/productService";
import bannerService from "../../services/bannerService";
import FeaturedNews from "@/pages/homePage/news/FeaturedNews";
import HomeBanner from "./components/HomeBanner";
import FlashSaleSection from "./components/FlashSaleSection";
import DiscountSection from "./components/DiscountSection";
import CategorySection from "./components/CategorySection";
import BestSellerSection from "./components/BestSellerSection";
import IntroVideoSection from "./components/IntroVideoSection";
import ReviewSection from "./components/ReviewSection";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AiAssistantWidget from "@/components/layout/AiAssistantWidget";

export default function HomePage() {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const fetchProducts = useCallback(() => {
    return productService.getBestSellers({ limit: 8 });
  }, []);

  const { data, loading } = useFetch(fetchProducts);

  const products = useMemo(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

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
    const size = getDefaultCartSize(product);
    if (!size) return "Liên hệ";
    return `${Number(size.price).toLocaleString("vi-VN")}đ`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <HomeBanner
        banners={banners}
        activeBannerIndex={activeBannerIndex}
        setActiveBannerIndex={setActiveBannerIndex}
        defaultImage={defaultImage}
      />

      <FlashSaleSection 
        products={products}
        getThumbnail={getThumbnail}
        getDefaultCartSize={getDefaultCartSize}
      />

      <DiscountSection />

      <BestSellerSection
        loading={loading}
        products={products}
        getThumbnail={getThumbnail}
        getDisplayPrice={getDisplayPrice}
      />

      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

      <IntroVideoSection videoId="eDyD7y3M_c0" />

      <CategorySection />

      <ReviewSection />

      <FeaturedNews />
      <Footer />
      
      <AiAssistantWidget />

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
