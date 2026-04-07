import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, Filter, X, Star, ShoppingCart } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import productService from "@/services/productService";
import { cartService } from "@/services/cartService";
import { toast } from "sonner";
import categoryService from "@/services/categoryService";
import useFetch from "@/hooks/useFetch";
import flashSaleService from "@/services/flashSaleService";
import { STORAGE_KEYS } from "@/constants";
import { useStoreHours } from "@/hooks/useStoreHours";
import { slugCache } from "@/pages/common/GenericSlugResolver";
import CartSuccessModal from "@/pages/homePage/order/CartSuccessModal";
import QuickViewModal from "@/pages/homePage/product/QuickViewModal";

const PAGE_SIZE = 9;

const SIZES = ["S", "M", "L"];

export default function ProductListPage({ categoryIdOverride, categoryName, categorySlug }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sidebarRef = useRef(null);
  const { isOpen: isStoreOpen, nextOpenMessage } = useStoreHours();
  const [addedCartItem, setAddedCartItem] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [accumulatedProducts, setAccumulatedProducts] = useState([]);

  useEffect(() => {
    const shopName = localStorage.getItem("cached_store_name") || "Coffee Shop";
    document.title = categoryName ? `${categoryName} | ${shopName}` : `Thực Đơn | ${shopName}`;
  }, [categoryName]);

  const handleFastAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isStoreOpen) {
      toast.error("Cửa hàng hiện đang đóng cửa");
      return;
    }

    if (!product.sizes || product.sizes.length === 0) {
      toast.error("Sản phẩm không có size");
      return;
    }

    let cartSize = null;
    const sizeS = product.sizes.find(
      (size) => String(size?.size).trim().toUpperCase() === "S"
    );

    if (sizeS && Number(sizeS?.price) > 0) {
      cartSize = sizeS;
    } else {
      const validSizes = product.sizes
        .filter((size) => Number(size?.price) > 0)
        .sort((a, b) => Number(a.price) - Number(b.price));
      cartSize = validSizes[0] || product.sizes[0];
    }

    let price = Number(cartSize.price);
    if (activeSale && activeSale.product_ids?.includes(product.id)) {
      price = Math.round(price * (1 - activeSale.discount_percent / 100));
    }

    const defaultImage = "https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg";
    const thumbnail = Array.isArray(product.images) ? (product.images.find(img => img.isThumbnail === 1)?.image_url || product.images[0]?.image_url || defaultImage) : defaultImage;

    const cartItem = {
      productSizeId: cartSize.id,
      id: product.id,
      product_id: product.id,
      name: product.name,
      image: thumbnail,
      size: cartSize.size,
      basePrice: price,
      price: price,
      quantity: 1,
      toppings: [],
    };

    cartService.addItem(cartItem);
    window.dispatchEvent(new Event("cartUpdated"));
    setAddedCartItem(cartItem);
  };

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


  const [activeSale, setActiveSale] = useState(null);

  useEffect(() => {
    flashSaleService.getCurrentActive()
      .then((res) => setActiveSale(res?.data || null))
      .catch(() => { });
  }, []);

  const fetchProducts = useCallback(async () => {
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

    let res;
    if (keyword) {
      params.keyword = keyword;
      res = await productService.search(params);
    } else if (categoryId) {
      res = await productService.getByCategory(categoryId, params);
    } else {
      res = await productService.getAll(params);
    }

    return { ...res, sourceCategoryId: categoryId, sourcePage: currentPage };
  }, [categoryId, keyword, currentPage, sortBy, filterSize, filterMinPrice, filterMaxPrice, filterMinRating]);

  const lastPageRef = useRef(currentPage);

  useEffect(() => {
    if (currentPage > lastPageRef.current && sidebarRef.current) {
      sidebarRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    lastPageRef.current = currentPage;
  }, [currentPage]);

  const { data, loading } = useFetch(fetchProducts);

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const products = Array.isArray(data?.data) ? data.data : [];
  const pagination = data?.pagination || {};
  const totalPages = Number(pagination.totalPages || 1);
  const page = Number(pagination.page || currentPage);

  useEffect(() => {
    if (!loading && data?.data) {
      if (data.sourceCategoryId !== categoryId || data.sourcePage !== currentPage) {
        return;
      }

      if (currentPage === 1) {
        setAccumulatedProducts(data.data);
      } else {
        setAccumulatedProducts(prev => {
          const nextList = [...prev];
          data.data.forEach(item => {
            if (!nextList.some(p => p.id === item.id)) nextList.push(item);
          });
          return nextList;
        });
      }
    }
  }, [data, currentPage, loading, categoryId]);

  const productIds = useMemo(
    () => products.map((item) => Number(item.id)).filter(Boolean),
    [products]
  );


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


  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-2 md:pt-4 pb-10 md:pb-16 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 min-h-[50px]">
            <div className="text-base md:text-lg text-gray-500 dark:text-gray-400 flex items-center space-x-2 font-medium">
              <span className="cursor-pointer hover:text-amber-600 transition-colors" onClick={() => navigate("/")}>Trang chủ</span>
              {categoryName && (
                 <>
                   <span className="text-gray-400">/</span>
                   <span className="text-amber-600 font-bold">{categoryName}</span>
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
              <div ref={sidebarRef} className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl lg:bg-transparent lg:py-0 lg:px-1 lg:-ml-1 lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-2 custom-scrollbar space-y-8">
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
              
              {/* Active Filter Pills */}
              {(keyword || filterSize || filterMinPrice || filterMaxPrice || filterMinRating) && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-sm text-gray-500 mr-2 flex items-center"><Filter className="w-3.5 h-3.5 mr-1"/> Đang lọc theo:</span>
                  {keyword && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium transition-all hover:bg-amber-100">
                      Từ khóa: {keyword}
                      <button onClick={() => updateQuery({ keyword: "", page: 1 })} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  )}
                  {filterSize && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium transition-all hover:bg-amber-100">
                      Size: {filterSize}
                      <button onClick={() => updateQuery({ size: "", page: 1 })} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  )}
                  {filterMinRating && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium transition-all hover:bg-amber-100">
                      {filterMinRating}+ Sao
                      <button onClick={() => updateQuery({ min_rating: "", page: 1 })} className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  )}
                  {(filterMinPrice || filterMaxPrice) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium transition-all hover:bg-amber-100">
                      Giá: {filterMinPrice ? `${Number(filterMinPrice).toLocaleString("vi-VN")}đ` : "0đ"} - {filterMaxPrice ? `${Number(filterMaxPrice).toLocaleString("vi-VN")}đ` : "Max"}
                      <button 
                        onClick={() => { setMinPriceInput(""); setMaxPriceInput(""); updateQuery({ min_price: "", max_price: "", page: 1 }); }} 
                        className="hover:text-red-500 transition-colors"><X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  <button 
                    onClick={() => {
                      setMinPriceInput(""); setMaxPriceInput("");
                      updateQuery({ keyword: "", size: "", min_price: "", max_price: "", min_rating: "", page: 1 });
                    }}
                    className="text-sm text-red-500 hover:text-red-600 font-medium underline ml-2 decoration-transparent hover:decoration-red-600 transition-all"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}

              {loading && accumulatedProducts.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[24px] p-5 shadow-sm animate-pulse">
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4"></div>
                      <div className="w-1/3 h-3 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                      <div className="w-3/4 h-5 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
                      <div className="w-1/4 h-4 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
                      <div className="mt-auto flex justify-between items-end">
                        <div className="w-1/3 h-5 bg-gray-200 dark:bg-gray-800 rounded"></div>
                        <div className="w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-800"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : accumulatedProducts.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                  Không có sản phẩm nào
                </div>
              ) : (
                <>
                  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${loading && currentPage === 1 ? 'opacity-40 pointer-events-none scale-[0.98] blur-[1px]' : 'opacity-100 scale-100 blur-0'}`}>
                    {accumulatedProducts.map((item, index) => {
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


                      return (
                        <div
                          key={item.id}
                          className="group h-full pb-4 px-2 pt-2 animate-in fade-in duration-300"
                        >
                          <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-[#FCFAF8] dark:bg-gray-900 border border-transparent hover:border-[#E8DFD5] dark:hover:border-gray-800 transition-all duration-300 hover:-translate-y-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg p-5">
                            <div className="relative">
                              {/* Badges */}
                              {activeSale && activeSale.product_ids?.includes(item.id) && (
                                <div className="absolute top-0 left-0 z-10 flex flex-col gap-2">
                                  <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                    ⚡ Flash Sale
                                  </span>
                                </div>
                              )}

                              <Link to={`/${item.slug || 'products/' + item.id}`} className="block mt-6 mb-2">
                                <div className="relative h-48 w-full flex items-center justify-center">
                                  <img
                                    src={itemImage}
                                    alt={item.name}
                                    className="h-[95%] w-[95%] object-contain transition duration-500 group-hover:scale-[1.1] mix-blend-multiply dark:mix-blend-normal drop-shadow-sm"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "https://images.unsplash.com/photo-1509042239860-f550ce710b93";
                                    }}
                                  />
                                </div>
                              </Link>
                            </div>

                            <div className="flex flex-col flex-grow mt-2">
                              <p className="text-[11px] font-medium text-gray-400 uppercase mb-1">
                                {item.category_name || "Thức uống"}
                              </p>

                              <Link to={`/${item.slug || 'products/' + item.id}`}>
                                <h3 className="line-clamp-2 min-h-[44px] text-base font-bold text-[#4A3219] dark:text-gray-100 transition hover:text-[#8B5A2B] mb-1.5" style={{ fontFamily: 'serif' }}>
                                  {item.name}
                                </h3>
                              </Link>

                              <div className="flex items-center gap-1.5 mb-5 h-[20px]">
                                <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                  {Number(item.rating) > 0 ? Number(item.rating).toFixed(1) : "Chưa có đánh giá"}
                                </span>
                              </div>

                              <div className="mt-auto flex items-end justify-between border-t border-transparent pt-1 gap-2">
                                <div className="min-w-0">
                                  {(() => {
                                    const isFlashSale = activeSale && activeSale.product_ids?.includes(item.id);

                                    if (minPrice !== null) {
                                      let originalText = `${minPrice.toLocaleString("vi-VN")}đ`;
                                      if (hasMultiplePrices) {
                                        originalText = `${minPrice.toLocaleString("vi-VN")}đ - ${maxPrice.toLocaleString("vi-VN")}đ`;
                                      }

                                      if (isFlashSale) {
                                        const saleMin = Math.round(minPrice * (1 - (activeSale.discount_percent || 0) / 100));
                                        let saleText = `${saleMin.toLocaleString("vi-VN")}đ`;
                                        
                                        if (hasMultiplePrices) {
                                          const saleMax = Math.round(maxPrice * (1 - (activeSale.discount_percent || 0) / 100));
                                          saleText = `${saleMin.toLocaleString("vi-VN")}đ - ${saleMax.toLocaleString("vi-VN")}đ`;
                                        }

                                        return (
                                          <div className="flex flex-col">
                                            <span className="text-[11px] line-through text-gray-400">{originalText}</span>
                                            <p className="break-words text-[15px] font-bold leading-tight text-[#8B5A2B] dark:text-amber-500">{saleText}</p>
                                          </div>
                                        );
                                      }

                                      return (
                                        <p className="break-words text-[15px] font-bold leading-tight text-[#8B5A2B] dark:text-amber-500">{originalText}</p>
                                      );
                                    }
                                    return <p className="break-words text-[17px] font-bold leading-tight text-[#8B5A2B] dark:text-amber-500">Liên hệ</p>;
                                  })()}
                                </div>
                                {isStoreOpen ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setQuickViewProduct(item);
                                      }}
                                      className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors shadow-sm bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-500"
                                      title="Xem nhanh"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleFastAdd(e, item);
                                      }}
                                      className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors shadow-sm bg-[#8B5A2B] hover:bg-[#69421c] text-white"
                                    >
                                      <ShoppingCart className="w-[15px] h-[15px] xl:ml-[-1px]" />
                                    </button>
                                  </div>
                                ) : (
                                  <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-100 whitespace-nowrap shadow-sm cursor-not-allowed"
                                  >
                                    {nextOpenMessage}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {page < totalPages && (
                     <div className="flex justify-center mt-12 mb-6">
                        <Button 
                          className="bg-transparent border-2 border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full px-8 py-6 text-base font-bold shadow-sm transition-all hover:scale-105"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={loading}
                        >
                           {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Đang tải...</> : "Xem thêm món..."}
                        </Button>
                     </div>
                  )}

                </>
              )}
          </div>
        </div>
      </main>

      <Footer />

      <QuickViewModal 
        product={quickViewProduct} 
        isOpen={!!quickViewProduct} 
        onClose={() => setQuickViewProduct(null)} 
        activeSale={activeSale} 
        isStoreOpen={isStoreOpen} 
        nextOpenMessage={nextOpenMessage}
        notifySuccess={(item) => setAddedCartItem(item)}
      />

      <CartSuccessModal
        addedCartItem={addedCartItem}
        onClose={() => setAddedCartItem(null)}
      />
    </div>
  );
}


