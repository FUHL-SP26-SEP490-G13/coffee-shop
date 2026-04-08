import { useCallback, useMemo, useState, useEffect, useRef } from "react";
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
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState({});
  const hoverTimeoutRef = useRef(null);
  const fetchLockRef = useRef({});

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

  const handleCategoryHover = useCallback((categoryId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredCategory(categoryId);

    if (!categoryProducts[categoryId] && !fetchLockRef.current[categoryId]) {
      fetchLockRef.current[categoryId] = true;
      productService.getByCategory(categoryId, { limit: 6 }).then((res) => {
        setCategoryProducts((prev) => ({
          ...prev,
          [categoryId]: Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [],
        }));
      }).catch(err => {
        console.error("Fetch products by category failed", err);
        fetchLockRef.current[categoryId] = false;
      });
    }
  }, [categoryProducts]);

  const handleSidebarLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 150);
  }, []);

  const handleFlyoutEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, []);

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
            {/* STATIC CATEGORY SIDEBAR */}
            <div
              className="hidden lg:flex w-[250px] shrink-0 flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-b-2xl z-20 pb-3 relative"
              onMouseLeave={handleSidebarLeave}
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

              {/* Flyout panel */}
              {hoveredCategory && (
                <div 
                  className="absolute left-[250px] top-0 w-[500px] max-h-[480px] min-h-[300px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-r-2xl shadow-xl z-50 p-6 flex flex-col"
                  onMouseEnter={handleFlyoutEnter}
                  onMouseLeave={handleSidebarLeave}
                >
                  <h3 className="font-bold text-lg text-amber-700 dark:text-amber-500 mb-4 border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center justify-between">
                    <span>Gợi ý sản phẩm</span>
                    <button 
                      onClick={() => {
                        const cat = categories.find(c => c.id === hoveredCategory);
                        if(cat) navigate(`/${cat.slug || 'products?category=' + cat.id}`);
                      }}
                      className="text-xs text-blue-500 hover:text-blue-700 underline"
                    >
                      Xem tất cả
                    </button>
                  </h3>
                  <div className="flex-1 overflow-y-auto customized-scrollbar grid grid-cols-2 gap-4 self-start w-full">
                    {!categoryProducts[hoveredCategory] ? (
                      <div className="col-span-2 text-center text-sm text-gray-500 py-10">Đang tải sản phẩm...</div>
                    ) : categoryProducts[hoveredCategory].length === 0 ? (
                      <div className="col-span-2 text-center text-sm text-gray-500 py-10">Chưa có sản phẩm nào</div>
                    ) : (
                      categoryProducts[hoveredCategory].map((prod) => (
                        <div 
                          key={prod.id} 
                          onClick={() => navigate(`/${prod.slug || 'products/' + prod.id}`)}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                        >
                          <img 
                            src={getThumbnail(prod)} 
                            alt={prod.name} 
                            className="w-14 h-14 object-cover rounded-md bg-gray-100 shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{prod.name}</h4>
                            <p className="text-xs text-amber-600 font-medium mt-1">{getDisplayPrice(prod)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BANNER */}
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
