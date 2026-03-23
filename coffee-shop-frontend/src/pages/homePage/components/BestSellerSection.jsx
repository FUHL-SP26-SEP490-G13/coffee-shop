import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import favoriteService from "@/services/favoriteService";
import { STORAGE_KEYS } from "@/constants";

export default function BestSellerSection({
  loading,
  products = [],
  getThumbnail,
  getDisplayPrice,
}) {
  const navigate = useNavigate();

  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const isLoggedIn = !!token;

  const [favoriteMap, setFavoriteMap] = useState({});
  const [favoriteLoadingMap, setFavoriteLoadingMap] = useState({});

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!isLoggedIn || products.length === 0) {
        setFavoriteMap({});
        return;
      }

      try {
        const results = await Promise.all(
          products.map(async (product) => {
            try {
              const res = await favoriteService.checkFavorite(product.id);
              const payload = res?.data?.data || res?.data || res || {};
              return {
                productId: product.id,
                isFavorite: Boolean(payload.isFavorite),
              };
            } catch (error) {
              return {
                productId: product.id,
                isFavorite: false,
              };
            }
          })
        );

        const nextMap = {};
        results.forEach((item) => {
          nextMap[item.productId] = item.isFavorite;
        });

        setFavoriteMap(nextMap);
      } catch (error) {
        console.error("Lỗi kiểm tra trạng thái yêu thích:", error);
        setFavoriteMap({});
      }
    };

    fetchFavoriteStatus();
  }, [products, isLoggedIn]);

  const handleToggleFavorite = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      alert("Bạn phải đăng nhập để thêm sản phẩm yêu thích");
      return;
    }

    const currentFavorite = Boolean(favoriteMap[productId]);

    try {
      setFavoriteLoadingMap((prev) => ({
        ...prev,
        [productId]: true,
      }));

      const res = await favoriteService.toggleFavorite(
        productId,
        currentFavorite
      );

      const payload = res?.data?.data || res?.data || res || {};

      setFavoriteMap((prev) => ({
        ...prev,
        [productId]:
          typeof payload.isFavorite === "boolean"
            ? payload.isFavorite
            : !currentFavorite,
      }));

      window.dispatchEvent(new Event("favoriteUpdated"));
    } catch (error) {
      console.error("Lỗi cập nhật yêu thích:", error);
      alert(error?.response?.data?.message || "Không thể cập nhật yêu thích");
    } finally {
      setFavoriteLoadingMap((prev) => ({
        ...prev,
        [productId]: false,
      }));
    }
  };

  return (
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
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Sản phẩm bán chạy
                </h2>
                <p className="text-sm text-gray-500">
                  Những món được khách hàng yêu thích nhất
                </p>
              </div>

              <Link to="/products">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white px-6">
                  Xem tất cả
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => {
                const isFavorite = Boolean(favoriteMap[product.id]);
                const isFavoriteLoading = Boolean(
                  favoriteLoadingMap[product.id]
                );

                return (
                  <div
                    key={product.id}
                    className="group h-full transition-all duration-300"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.08}s both`,
                    }}
                  >
                    <Card className="overflow-hidden h-full flex flex-col bg-white border border-gray-200 shadow-md hover:shadow-xl transition">
                      <div className="relative">
                        <Link to={`/products/${product.id}`} className="block">
                          <div className="relative h-56 bg-gray-100 overflow-hidden">
                            <img
                              src={getThumbnail(product)}
                              alt={product.name}
                              className="w-full h-full object-cover hover:scale-105 transition duration-500"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://images.unsplash.com/photo-1509042239860-f550ce710b93";
                              }}
                            />
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, product.id)}
                          disabled={isFavoriteLoading}
                          className={`absolute top-3 right-3 z-10 w-10 h-10 rounded-full border shadow-sm flex items-center justify-center transition ${
                            isFavorite
                              ? "bg-red-50 border-red-500 text-red-500"
                              : "bg-white border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-500"
                          }`}
                          title={
                            isFavorite
                              ? "Bỏ khỏi yêu thích"
                              : "Thêm vào yêu thích"
                          }
                        >
                          {isFavoriteLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Heart
                              className={`w-5 h-5 ${
                                isFavorite ? "fill-current" : ""
                              }`}
                            />
                          )}
                        </button>
                      </div>

                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            {product.category_name || "Danh mục"}
                          </p>
                        </div>

                        <Link to={`/products/${product.id}`}>
                          <h3 className="font-bold text-lg text-gray-900 mb-2 hover:text-amber-600 transition line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="pt-4 border-t border-gray-200 flex items-end justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-xl font-bold text-amber-600 leading-tight break-words">
                              {getDisplayPrice(product)}
                            </p>
                            <p className="text-xs text-gray-500">VNĐ</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </>
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
  );
}
