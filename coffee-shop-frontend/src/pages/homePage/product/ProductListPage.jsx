import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Heart, Filter, X, Star } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import productService from "@/services/productService";
import favoriteService from "@/services/favoriteService";
import categoryService from "@/services/categoryService";
import useFetch from "@/hooks/useFetch";
import flashSaleService from "@/services/flashSaleService";
import { STORAGE_KEYS } from "@/constants";
import { useStoreHours } from "@/hooks/useStoreHours";
import { slugCache } from "@/pages/common/GenericSlugResolver";

const PAGE_SIZE = 9;

const SIZES = ["S", "M", "L"];

export default function ProductListPage({ categoryIdOverride, categoryName, categorySlug }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen: isStoreOpen, nextOpenMessage } = useStoreHours();

  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const isLoggedIn = !!token;

  const categoryId = categoryIdOverride || searchParams.get("category") || "";
  const keyword = searchParams.get("keyword") || "";
  const sortBy = searchParams.get("sort") || "";
  const filterSize = searchParams.get("size") || "";
  const filterMinPrice = searchParams.get("min_price") || "";
  const filterMaxPrice = searchParams.get("max_price") || "";
  const filterMinRating = searchParams.get("min_rating") || "";
  const currentPage = Number(searchParams.get("page") || 1);

  const [categories, setCategories] = useState([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [minPriceInput, setMinPriceInput] = useState(filterMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(filterMaxPrice);

  useEffect(() => {
    setMinPriceInput(filterMinPrice);
    setMaxPriceInput(filterMaxPrice);
  }, [filterMinPrice, filterMaxPrice]);

  useEffect(() => {
    categoryService.getAll().then((res) => {
      const fetchedCategories = res?.data || [];
      setCategories(fetchedCategories);
      
      // Khởi tạo sẵn cache để tránh bị unmount (load chớp màn hình)
      fetchedCategories.forEach(cat => {
        if (cat.slug && !slugCache[cat.slug]) {
          slugCache[cat.slug] = { data: cat, type: 'category' };
        }
      });
    }).catch(() => { });
  }, []);

  const [favoriteMap, setFavoriteMap] = useState({});
  const [favoriteLoadingMap, setFavoriteLoadingMap] = useState({});
  const [activeSale, setActiveSale] = useState(null);

  useEffect(() => {
    flashSaleService.getCurrentActive()
      .then((res) => setActiveSale(res?.data || null))
      .catch(() => { });
  }, []);

  const fetchProducts = useCallback(() => {
    const params = {
      status: "available",
      page: currentPage,
      limit: PAGE_SIZE,
      sort: sortBy,
    };

    if (filterSize) params.size = filterSize;
    if (filterMinPrice) params.min_price = filterMinPrice;
    if (filterMaxPrice) params.max_price = filterMaxPrice;
    if (filterMinRating) params.min_rating = filterMinRating;

    if (keyword) {
      params.keyword = keyword;
      return productService.search(params);
    }

    if (categoryId) {
      return productService.getByCategory(categoryId, params);
    }

    return productService.getAll(params);
  }, [categoryId, keyword, currentPage, sortBy, filterSize, filterMinPrice, filterMaxPrice, filterMinRating]);

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

  const handleApplyPrice = () => {
    updateQuery({ min_price: minPriceInput, max_price: maxPriceInput, page: 1 });
  };

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

  const handleCategoryChange = (cat) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('category');
    nextParams.delete('page'); // reset page when changing category

    const searchString = nextParams.toString();

    if (!cat) {
       navigate(`/products${searchString ? '?' + searchString : ''}`);
    } else if (cat.slug) {
       navigate(`/${cat.slug}${searchString ? '?' + searchString : ''}`);
    } else {
       nextParams.set('category', cat.id);
       navigate(`/products?${nextParams.toString()}`);
    }
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <section className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
              <span className="cursor-pointer hover:text-amber-600 transition-colors" onClick={() => navigate("/")}>Trang chủ</span>
              {categoryName && (
                 <>
                   <span className="text-gray-400">/</span>
                   <span className="text-amber-600 font-medium">{categoryName}</span>
                 </>
              )}
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                className="lg:hidden flex items-center gap-2"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              >
                <Filter className="w-4 h-4" />
                Bộ lọc
              </Button>
              <div className="w-full sm:w-72">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full bg-transparent dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Sắp xếp mặc định</option>
                  <option value="name_asc">A - Z</option>
                  <option value="name_desc">Z - A</option>
                  <option value="price_asc">Giá tăng dần</option>
                  <option value="price_desc">Giá giảm dần</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className={`lg:w-64 flex-shrink-0 ${mobileFilterOpen ? 'block' : 'hidden'} lg:block`}>
              <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl lg:bg-transparent lg:p-0 lg:sticky lg:top-24 space-y-8">
                <div className="flex justify-between items-center lg:hidden mb-4">
                  <h2 className="text-xl font-bold">Bộ Lọc</h2>
                  <Button variant="ghost" size="icon" onClick={() => setMobileFilterOpen(false)}><X className="w-5 h-5" /></Button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">Danh mục</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="radio" name="category" checked={!categoryId} onChange={() => handleCategoryChange(null)} className="peer sr-only" />
                        <div className="w-5 h-5 rounded border border-gray-300 peer-checked:bg-amber-600 peer-checked:border-amber-600 transition flex items-center justify-center">
                          {(!categoryId) && <div className="w-2.5 h-2.5 rounded-sm bg-white dark:bg-gray-900" />}
                        </div>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 group-hover:text-amber-600 transition">Thực đơn menu</span>
                    </label>
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                          <input type="radio" name="category" checked={String(categoryId) === String(cat.id)} onChange={() => handleCategoryChange(cat)} className="peer sr-only" />
                          <div className="w-5 h-5 rounded border border-gray-300 peer-checked:bg-amber-600 peer-checked:border-amber-600 transition flex items-center justify-center">
                            {(String(categoryId) === String(cat.id)) && <div className="w-2.5 h-2.5 rounded-sm bg-white dark:bg-gray-900" />}
                          </div>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-amber-600 transition">{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">Khoảng giá</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      placeholder="Tối thiểu"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      className="w-full bg-transparent dark:bg-gray-900 text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-amber-500 transition text-gray-700 dark:text-gray-300"
                    />
                    <span className="text-gray-400 font-medium">-</span>
                    <input
                      type="number"
                      placeholder="Tối đa"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      className="w-full bg-transparent dark:bg-gray-900 text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-amber-500 transition text-gray-700 dark:text-gray-300"
                    />
                  </div>
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-semibold"
                    size="sm"
                    onClick={handleApplyPrice}
                  >
                    Áp dụng
                  </Button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">Kích thước</h3>
                  <div className="flex gap-3">
                    {SIZES.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateQuery({ size: filterSize === s ? "" : s, page: 1 })}
                        className={`w-12 h-10 rounded-xl flex justify-center items-center border font-semibold transition ${filterSize === s ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-200' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200  hover:border-amber-500 hover:text-amber-600'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">Đánh giá</h3>
                  <div className="space-y-3">
                    {[
                      { value: "4.5", label: "4.5 sao trở lên", stars: 4.5 },
                      { value: "4", label: "4 sao trở lên", stars: 4 },
                      { value: "3.5", label: "3.5 sao trở lên", stars: 3.5 },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5">
                          <input
                            type="radio"
                            name="rating_filter"
                            value={option.value}
                            checked={filterMinRating === option.value}
                            onChange={(e) => updateQuery({ min_rating: e.target.value, page: 1 })}
                            className="peer appearance-none w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full checked:border-amber-500 dark:checked:border-amber-500 checked:bg-transparent transition-colors cursor-pointer"
                          />
                          <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-500 scale-0 peer-checked:scale-100 transition-transform pointer-events-none"></div>
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-amber-600 transition-colors cursor-pointer select-none text-sm">{option.label}</span>
                        <div className="flex text-amber-500 gap-0.5 ml-auto">
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const fillPercentage = option.stars - idx;
                            return (
                              <div key={idx} className="relative w-4 h-4">
                                <Star className="w-4 h-4 text-gray-300 dark:text-gray-600 stroke-1" />
                                {fillPercentage > 0 && (
                                  <div className="absolute top-0 left-0 overflow-hidden" style={{ width: fillPercentage >= 1 ? '100%' : `${fillPercentage * 100}%` }}>
                                    <Star className="w-4 h-4 fill-amber-500 text-amber-500 stroke-1" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => updateQuery({ category: "", min_price: "", max_price: "", size: "", min_rating: "", page: 1, keyword: "" })}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">

              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  Không có sản phẩm nào
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          onClick={() => navigate(`/${item.slug || 'products/' + item.id}`)}
                          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200  overflow-hidden cursor-pointer hover:shadow-lg transition"
                        >
                          <div className="relative h-56 bg-gray-100 dark:bg-gray-800">
                            <img
                              src={itemImage}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />

                            {!isStoreOpen && (
                              <div className="absolute inset-x-0 bottom-0 z-[15] bg-white/90 dark:bg-gray-900/90 py-1.5 px-3 flex justify-center border-t dark:border-gray-800 shadow-sm">
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                  {nextOpenMessage}
                                </span>
                              </div>
                            )}

                            {activeSale && activeSale.product_ids?.includes(item.id) && (
                              <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 animate-pulse">
                                ⚡ Flash Sale
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(e, item.id)}
                              disabled={isFavoriteLoading}
                              className={`absolute top-3 right-3 z-10 w-10 h-10 rounded-full border shadow-sm flex items-center justify-center transition ${isFavorite
                                  ? "bg-red-50 border-red-500 text-red-500"
                                  : "bg-white dark:bg-gray-900 border-gray-300 text-gray-500 dark:text-gray-400 hover:border-red-400 hover:text-red-500"
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
                                  className={`w-5 h-5 ${isFavorite ? "fill-current" : ""
                                    }`}
                                />
                              )}
                            </button>
                          </div>

                          <div className="p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                              {item.category_name || "Danh mục"}
                            </p>

                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[48px]">
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
                                disabled={!isStoreOpen}
                                className="bg-amber-600 hover:bg-amber-700 text-white disabled:bg-gray-400 disabled:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isStoreOpen) navigate(`/${item.slug || 'products/' + item.id}`);
                                }}
                              >
                                {isStoreOpen ? "Thêm" : "Đóng cửa"}
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
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
