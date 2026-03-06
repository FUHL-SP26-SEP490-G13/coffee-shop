import { useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search, Loader2, Plus, ArrowRight } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import productService from "@/services/productService";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { Link } from "react-router-dom";
import FeaturedNews from "@/components/news/FeaturedNews";
import bannerService from "@/services/bannerService";

export default function HomePage() {
  const fetchProducts = useCallback(() => {
    return productService.getAll({ status: "available" });
  }, []);

  const { data, loading } = useFetch(fetchProducts);
  const products = useMemo(() => {
    const productList = Array.isArray(data?.data) ? data.data : [];
    return productList.filter((product) => Number(product?.is_deleted ?? 0) === 0);
  }, [data]);

  const fetchBanner = useCallback(() => {
    return bannerService.getActive();
  }, []);

  const { data: bannerData } = useFetch(fetchBanner);
  const banner = bannerData?.data ?? bannerData;

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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* ===== HERO BANNER ===== */}
      <section className="w-full pt-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl group">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={banner?.image_url || defaultImage}
                alt="Banner"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
            </div>

            {/* Content */}
            <div className="relative h-80 sm:h-96 lg:h-[520px] flex flex-col justify-center items-start px-6 sm:px-10 lg:px-16">
              <div className="space-y-6 max-w-2xl">
                <div>
                  <p className="text-amber-300 text-xs sm:text-sm tracking-widest uppercase mb-3">
                    Khám phá hương vị mới
                  </p>
                  <h4 className="text-1xl sm:text-1xl lg:text-2xl text-white leading-tight">
                    {banner?.title || "Menu Đặc Biệt"}
                  </h4>
                </div>

                <p className="text-base sm:text-lg lg:text-xl text-gray-100 leading-relaxed">
                  {banner?.subtitle ||
                    "Thưởng thức những hương vị tuyệt vời từ những sản phẩm chất lượng cao nhất"}
                </p>

                {banner?.button_text && (
                  <Link to={banner?.button_link || "/"}>
                    <Button
                      size="lg"
                      className="text-white font-bold px-8 py-3 text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 group/btn"
                    >
                      <span className="flex items-center gap-2">
                        {banner.button_text}
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </span>
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MENU SECTION ===== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-14 sm:mb-20">
            <p className="text-amber-600 font-bold text-xs sm:text-sm tracking-widest uppercase mb-3">
              Bộ sưu tập hôm nay
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
              Menu Đặc Sắc
            </h3>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Khám phá những lựa chọn tuyệt vời được chọn lựa kỹ lưỡng cho bạn
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
                <p className="text-gray-600">Đang tải sản phẩm...</p>
              </div>
            </div>
          )}

          {/* Products Grid */}
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
                    {/* Image Container */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 h-52 sm:h-60">
                      <img
                        src={getThumbnail(product)}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) =>
                          (e.target.src =
                            "https://images.unsplash.com/photo-1509042239860-f550ce710b93")
                        }
                      />

                      {/* Overlay Gradient on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Badge */}
                      <div className="absolute top-3 right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Mới
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6 flex flex-col flex-grow">
                      <h4 className="font-bold text-base sm:text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-amber-600 transition-colors duration-300">
                        {product.name}
                      </h4>

                      <p className="text-sm text-gray-600 mb-4 sm:mb-6 line-clamp-2 flex-grow leading-relaxed">
                        {product.description ||
                          "Thưởng thức hương vị đặc biệt của chúng tôi"}
                      </p>

                      {/* Footer */}
                      <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-2xl sm:text-3xl font-bold text-amber-600">
                            {formatPrice(product)}
                          </p>
                          <p className="text-xs text-gray-500">VNĐ</p>
                        </div>

                        <Button
                          size="sm"
                          className="gap-1.5"
                        >
                          <Plus className="w-4 h-4 transition-transform duration-300 group-hover/btn:rotate-90" />
                          <span className="hidden sm:inline ml-1">Thêm</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600">
                Hiện chưa có sản phẩm. Vui lòng quay lại sau!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ===== TIN TỨC NỔI BẬT ===== */}
      <FeaturedNews />

      <Footer />

      {/* CSS Animation */}
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
      `}</style>
    </div>
  );
}
