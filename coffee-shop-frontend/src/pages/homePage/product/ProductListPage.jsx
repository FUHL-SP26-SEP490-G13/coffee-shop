import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Heart } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AiAssistantWidget from "@/components/layout/AiAssistantWidget";
import { Button } from "@/components/ui/button";
import productService from "@/services/productService";
import favoriteService from "@/services/favoriteService";
import useFetch from "@/hooks/useFetch";
import flashSaleService from "@/services/flashSaleService";
import { STORAGE_KEYS } from "@/constants";

const PAGE_SIZE = 8;

export default function ProductListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const isLoggedIn = !!token;

  const categoryId = searchParams.get("category") || "";
  const keyword = searchParams.get("keyword") || "";
  const sortBy = searchParams.get("sort") || "";
  const currentPage = Number(searchParams.get("page") || 1);

  const [favoriteMap, setFavoriteMap] = useState({});
  const [favoriteLoadingMap, setFavoriteLoadingMap] = useState({});
  const [activeSale, setActiveSale] = useState(null);

  useEffect(() => {
    flashSaleService.getCurrentActive()
      .then((res) => setActiveSale(res?.data || null))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(() => {
    const params = {
      status: "available",
      page: currentPage,
      limit: PAGE_SIZE,
      sort: sortBy,
    };

    if (keyword) {
      params.keyword = keyword;
      return productService.search(params);
    }

    if (categoryId) {
      return productService.getByCategory(categoryId, params);
    }

    return productService.getAll(params);
  }, [categoryId, keyword, currentPage, sortBy]);

  const { data, loading } = useFetch(fetchProducts);

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const products = Array.isArray(data?.data) ? data.data : [];
  const pagination = data?.pagination || {};
  const totalPages = Number(pagination.totalPages || 1);
  const page = Number(pagination.page || currentPage);

  const productIds = useMemo(
    () => products.map((item) => Number(item.id)).filter(Boolean),
    [products]
  );

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!isLoggedIn || productIds.length === 0) {
        setFavoriteMap({});
        return;
      }

      try {
        const results = await Promise.all(
          productIds.map(async (productId) => {
            try {
              const res = await favoriteService.checkFavorite(productId);
              const payload = res?.data?.data || res?.data || res || {};
              return {
                productId,
                isFavorite: Boolean(payload.isFavorite),
              };
            } catch (error) {
              return {
                productId,
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
  }, [isLoggedIn, productIds]);

  const updateQuery = (nextValues) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });

    setSearchParams(nextParams);
  };

  const handleSortChange = (value) => {
    updateQuery({
      sort: value || "",
      page: 1,
    });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;

    updateQuery({
      page: nextPage,
    });
  };

  const handleToggleFavorite = async (e, productId) => {
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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Danh sách sản phẩm
              </h1>
              <p className="text-gray-500 mt-1">
                {keyword
                  ? `Kết quả tìm kiếm cho "${keyword}"`
                  : categoryId
                  ? "Sản phẩm theo danh mục"
                  : "Tất cả sản phẩm"}
              </p>
            </div>

            <div className="w-full sm:w-72">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
              >
                <option value="">Sắp xếp mặc định</option>
                <option value="name_asc">A - Z</option>
                <option value="name_desc">Z - A</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              Không có sản phẩm nào
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((item) => {
                  const itemImages = Array.isArray(item.images)
                    ? item.images
                    : [];
                  const itemSizes = Array.isArray(item.sizes) ? item.sizes : [];
                  const itemImage = itemImages[0]?.image_url || defaultImage;

                  const validPrices = itemSizes
                    .map((size) => Number(size.price))
                    .filter((price) => Number.isFinite(price));

                  const minPrice =
                    validPrices.length > 0 ? Math.min(...validPrices) : null;
                  const maxPrice =
                    validPrices.length > 0 ? Math.max(...validPrices) : null;
                  const hasMultiplePrices =
                    minPrice !== null && maxPrice !== null && maxPrice > minPrice;

                  const isFavorite = Boolean(favoriteMap[item.id]);
                  const isFavoriteLoading = Boolean(
                    favoriteLoadingMap[item.id]
                  );

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/products/${item.id}`)}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition"
                    >
                      <div className="relative h-56 bg-gray-100">
                        <img
                          src={itemImage}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {activeSale && activeSale.product_ids?.includes(item.id) && (
                          <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 animate-pulse">
                            ⚡ Flash Sale
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, item.id)}
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

                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">
                          {item.category_name || "Danh mục"}
                        </p>

                        <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[48px]">
                          {item.name}
                        </h3>

                        <div className="flex items-center justify-between mt-4 gap-3">
                          <div>
                            {(() => {
                              const isFlashSale = activeSale && activeSale.product_ids?.includes(item.id);
                              
                              if (minPrice !== null) {
                                const originalText = hasMultiplePrices 
                                  ? `${minPrice.toLocaleString("vi-VN")}đ - ${maxPrice.toLocaleString("vi-VN")}đ`
                                  : `${minPrice.toLocaleString("vi-VN")}đ`;
                                  
                                if (isFlashSale) {
                                  const saleMin = Math.round(minPrice * (1 - (activeSale.discount_percent || 0) / 100));
                                  const saleMax = maxPrice ? Math.round(maxPrice * (1 - (activeSale.discount_percent || 0) / 100)) : null;
                                  
                                  const saleText = hasMultiplePrices && saleMax
                                    ? `${saleMin.toLocaleString("vi-VN")}đ - ${saleMax.toLocaleString("vi-VN")}đ`
                                    : `${saleMin.toLocaleString("vi-VN")}đ`;
                                    
                                  return (
                                    <div className="flex flex-col">
                                      <span className="text-xs line-through text-gray-400">{originalText}</span>
                                      <p className="text-red-600 font-bold text-lg">{saleText}</p>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <p className="text-amber-600 font-bold text-lg">{originalText}</p>
                                );
                              }
                              return <p className="text-amber-600 font-bold text-lg">Liên hệ</p>;
                            })()}
                          </div>

                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/products/${item.id}`);
                            }}
                          >
                            Thêm
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Trước
                </Button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === page ? "default" : "outline"}
                    onClick={() => handlePageChange(pageNumber)}
                    className={
                      pageNumber === page
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : ""
                    }
                  >
                    {pageNumber}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Sau
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
      <AiAssistantWidget />
    </div>
  );
}
