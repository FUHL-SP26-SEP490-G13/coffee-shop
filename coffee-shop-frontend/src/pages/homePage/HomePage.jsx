import { useCallback, useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { ArrowUp } from "lucide-react";
import FadeInView from "@/components/common/FadeInView";
import useFetch from "../../hooks/useFetch";
import productService from "@/services/productService";
import bannerService from "../../services/bannerService";
import categoryService from "../../services/categoryService";
import FeaturedNews from "@/pages/homePage/news/FeaturedNews";
import HomeBanner from "./components/HomeBanner";
import FlashSaleSection from "./components/FlashSaleSection";
import DiscountSection from "./components/DiscountSection";
import CategorySection from "./components/CategorySection";
import BestSellerSection from "./components/BestSellerSection";
import ReviewSection from "./components/ReviewSection";
import InstagramFeedSection from "./components/InstagramFeedSection";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AiAssistantWidget from "@/components/layout/AiAssistantWidget";

export default function HomePage() {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState({});

  const location = useLocation();
  const navigate = useNavigate();

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
    const size = getDefaultCartSize(product);
    if (!size) return "Liên hệ";
    return `${Number(size.price).toLocaleString("vi-VN")}đ`;
  };

  const handleCategoryHover = async (categoryId) => {
    setHoveredCategory(categoryId);
    if (!categoryProducts[categoryId]) {
      try {
        const res = await productService.getByCategory(categoryId);
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : []);
        // Lọc sản phẩm có trạng thái available và chưa bị xóa
        const availableProducts = list.filter(p => {
          return p.status === 'available' && !p.is_deleted;
        });
        setCategoryProducts(prev => ({ ...prev, [categoryId]: availableProducts }));
      } catch (error) {
        console.error(error);
        setCategoryProducts(prev => ({ ...prev, [categoryId]: [] }));
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 dark:border-gray-800">
      <Header />

      <FadeInView delay={0} duration={1200}>
        <div className="w-full bg-[#fcfaf9] dark:bg-gray-950 border-b border-gray-100 dark:border-gray-900 pb-0">
          <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative flex items-stretch">

            {/* STATIC CATEGORY SIDEBAR */}
            <div
              className="hidden lg:flex w-[250px] shrink-0 flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-b-2xl z-20 pb-3 relative"
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="h-[480px] overflow-y-auto px-1 pt-1 customized-scrollbar relative">
                {categories.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">Đang tải...</div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      onMouseEnter={() => handleCategoryHover(category.id)}
                      onClick={() => navigate(`/${category.slug || 'products?category=' + category.id}`)}
                      className="w-full flex items-center justify-between px-5 py-3.5 transition text-[13px] font-bold text-gray-700 dark:text-gray-300 border-b border-dashed border-gray-100 dark:border-gray-800 last:border-0 hover:bg-amber-50 hover:text-amber-600 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-amber-500 transition-colors"></div>
                        <span className="uppercase tracking-wide">{category.name}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* POPOVER MENU FOR PRODUCTS */}
              {hoveredCategory && (
                <div
                  className="absolute left-[100%] top-0 min-h-[480px] w-[500px] xl:w-[600px] bg-white dark:bg-gray-900 shadow-[20px_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-800 rounded-r-2xl p-6 flex flex-col z-50 ml-0 transition-opacity"
                >
                  <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <h3 className="text-lg font-bold text-primary uppercase tracking-wide">
                      {categories.find(c => c.id === hoveredCategory)?.name}
                    </h3>
                    <button
                      onClick={() => {
                        const cat = categories.find(c => c.id === hoveredCategory);
                        if (cat) navigate(`/${cat.slug || 'products?category=' + cat.id}`);
                      }}
                      className="text-[13px] text-gray-500 hover:text-amber-600 font-semibold flex items-center gap-1 transition-colors"
                    >
                      Xem tất cả <ArrowUp className="w-3 h-3 rotate-45" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto customized-scrollbar pr-2">
                    {!categoryProducts[hoveredCategory] ? (
                      <div className="flex justify-center items-center h-full min-h-[200px]">
                        <span className="text-gray-400 animate-pulse text-sm">Đang tải...</span>
                      </div>
                    ) : categoryProducts[hoveredCategory].length === 0 ? (
                      <div className="flex justify-center items-center h-full min-h-[200px]">
                        <span className="text-gray-400 text-sm">Không có sản phẩm nào</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {categoryProducts[hoveredCategory].slice(0, 9).map(product => (
                          <div
                            key={product.id}
                            className="flex flex-col items-center gap-3 cursor-pointer group"
                            onClick={() => navigate(`/${product.slug || 'products/' + product.id}`)}
                          >
                            <div className="w-[100px] h-[100px] rounded-full bg-[#FAF9F6] dark:bg-gray-800 p-2 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all border border-transparent group-hover:border-amber-200">
                              <img
                                src={getThumbnail(product)}
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                            <span className="text-sm text-center font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-600 line-clamp-2 leading-snug">
                              {product.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BANNER (Pushed right with padding) */}
            <div className="flex-1 w-full lg:pl-6 overflow-hidden">
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
        <DiscountSection />
      </FadeInView>

      <FadeInView>
        <BestSellerSection
          loading={loading}
          products={products}
          getThumbnail={getThumbnail}
          getDisplayPrice={getDisplayPrice}
        />
      </FadeInView>

      <FadeInView delay={200}>
        <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
      </FadeInView>

      <FadeInView>
        <CategorySection />
      </FadeInView>

      <FadeInView>
        <ReviewSection />
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
