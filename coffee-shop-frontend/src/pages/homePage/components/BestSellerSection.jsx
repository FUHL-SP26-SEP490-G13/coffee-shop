import { useEffect, useState } from "react";
import { Loader2, ArrowRight, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import favoriteService from "@/services/favoriteService";
import flashSaleService from "@/services/flashSaleService";
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
  const [activeSale, setActiveSale] = useState(null);

  useEffect(() => {
    flashSaleService.getCurrentActive()
      .then((res) => setActiveSale(res?.data || null))
      .catch(() => {});
  }, []);

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
    <section className="py-16 lg:py-24">
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg md:text-2xl font-bold tracking-[0.15em] text-primary">
              Sản phẩm bán chạy
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Những thức uống và món ăn được yêu thích nhất, được chọn lọc bởi
              hàng ngàn khách hàng
            </p>
          </div>

          <Link
            to="/products"
            className="group flex shrink-0 items-center gap-2 rounded-full border border-primary/30 px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-[0.97]"
          >
            Xem tất cả
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Đang tải sản phẩm...</p>
            </div>
          </div>
        )}

        {!loading && products.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, index) => {
              const isFavorite = Boolean(favoriteMap[product.id]);
              const isFavoriteLoading = Boolean(favoriteLoadingMap[product.id]);

              return (
                <div
                  key={product.id}
                  className="group h-full"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.08}s both`,
                  }}
                >
                  <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-border/50 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative">
                      <Link to={`/${product.slug || 'products/' + product.id}`} className="block">
                        <div className="relative h-60 overflow-hidden bg-secondary/40">
                          <img
                            src={getThumbnail(product)}
                            alt={product.name}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://images.unsplash.com/photo-1509042239860-f550ce710b93";
                            }}
                          />
                        </div>
                      </Link>
                      
                      {activeSale && activeSale.product_ids?.includes(product.id) && (
                        <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1 animate-pulse">
                          ⚡ Flash Sale
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, product.id)}
                        disabled={isFavoriteLoading}
                        className={`absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${isFavorite
                            ? "border-red-500 bg-red-50 text-red-500"
                            : "border-border bg-white/90 text-muted-foreground hover:border-red-400 hover:text-red-500"
                          }`}
                        title={
                          isFavorite
                            ? "Bỏ khỏi yêu thích"
                            : "Thêm vào yêu thích"
                        }
                      >
                        {isFavoriteLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart
                            className={`h-5 w-5 ${isFavorite ? "fill-current" : ""
                              }`}
                          />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-grow flex-col p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {product.category_name || "Danh mục"}
                      </p>

                      <Link to={`/${product.slug || 'products/' + product.id}`}>
                        <h3 className="mt-2 line-clamp-2 text-lg font-bold text-foreground transition hover:text-primary">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="mt-5 flex items-end justify-between gap-3 border-t border-border/60 pt-4">
                        <div className="min-w-0 flex-1">
                          {(() => {
                            const isFlashSale = activeSale && activeSale.product_ids?.includes(product.id);
                            const originalPriceText = getDisplayPrice(product);
                            
                            if (isFlashSale) {
                              const originalPriceNum = Number(originalPriceText.replace(/\D/g, ''));
                              if (originalPriceNum > 0) {
                                const salePriceNum = Math.round(originalPriceNum * (1 - (activeSale.discount_percent || 0) / 100));
                                return (
                                  <div className="flex flex-col">
                                    <span className="text-sm line-through text-gray-400">{originalPriceText}</span>
                                    <p className="break-words text-xl font-bold leading-tight text-red-600">
                                      {salePriceNum.toLocaleString("vi-VN")}đ
                                    </p>
                                  </div>
                                );
                              }
                            }
                            
                            return (
                              <p className="break-words text-xl font-bold leading-tight text-primary">
                                {originalPriceText}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              Hiện chưa có sản phẩm. Vui lòng quay lại sau!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
