import { useEffect, useState } from "react";
import { Loader2, ArrowRight, Star, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import flashSaleService from "@/services/flashSaleService";
import productService from "@/services/productService";
import { STORAGE_KEYS } from "@/constants";
import { cartService } from "@/services/cartService";
import { toast } from "sonner";
import { useStoreHours } from "@/hooks/useStoreHours";
import receiptSettingService from "@/services/receiptSettingService";
import CartSuccessModal from "@/pages/homePage/order/CartSuccessModal";
import QuickViewModal from "@/pages/homePage/product/QuickViewModal";

export default function BestSellerSection({
  loading,
  products = [],
  getThumbnail,
  getDisplayPrice,
}) {
  const navigate = useNavigate();
  const { isOpen, nextOpenMessage } = useStoreHours();

  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const isLoggedIn = !!token;

  const [activeSale, setActiveSale] = useState(null);
  const [addedCartItem, setAddedCartItem] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const [activeTab, setActiveTab] = useState("Bán chạy");
  const [tabData, setTabData] = useState({ "Bán chạy": [], "Mới nhất": [], "Được yêu thích": [] });
  const [tabLoading, setTabLoading] = useState(false);
  const [storeName, setStoreName] = useState("Coffee Shop");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await receiptSettingService.getActive();
        const data = res?.data || null;
        if (data && data.store_name) {
          setStoreName(data.store_name);
        }
      } catch (error) {
        console.error("Lỗi lấy cấu hình cửa hàng:", error);
      }
    };
    fetchSettings();

    const handleReceiptUpdate = () => {
      fetchSettings();
    };
    window.addEventListener("receiptSettingsUpdated", handleReceiptUpdate);
    return () => window.removeEventListener("receiptSettingsUpdated", handleReceiptUpdate);
  }, []);

  const handleFastAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isOpen) {
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

    let thumbnail = "https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg";
    if (typeof getThumbnail === 'function') {
      thumbnail = getThumbnail(product) || thumbnail;
    }

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
    setAddedCartItem(cartItem);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  useEffect(() => {
    if (products.length > 0) {
      setTabData(prev => ({ ...prev, "Bán chạy": products }));
    }
  }, [products]);

  const handleTabChange = async (tab) => {
    if (activeTab === tab) return;
    setActiveTab(tab);

    if (tabData[tab].length === 0) {
      setTabLoading(true);
      try {
        let res;
        if (tab === "Mới nhất") {
          res = await productService.getAll({ sort: "newest", limit: 8 });
        } else if (tab === "Được yêu thích") {
          res = await productService.getAll({ sort: "rating_desc", limit: 8, min_rating: 1 });
        }

        if (res && (res.data?.data || Array.isArray(res.data))) {
          const items = Array.isArray(res.data?.data) ? res.data.data : res.data;
          setTabData(prev => ({ ...prev, [tab]: items.slice(0, 8) }));
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu tab:", error);
      } finally {
        setTabLoading(false);
      }
    }
  };

  const displayProducts = activeTab === "Bán chạy" ? tabData["Bán chạy"].length > 0 ? tabData["Bán chạy"] : products : tabData[activeTab];
  const isCurrentlyLoading = activeTab === "Bán chạy" ? loading : tabLoading;

  useEffect(() => {
    flashSaleService.getCurrentActive()
      .then((res) => setActiveSale(res?.data || null))
      .catch(() => { });
  }, []);


  return (
    <section className="py-8 md:py-12 lg:py-16 bg-white dark:bg-gray-950">
      <div className="w-full px-4 lg:px-6 xl:px-8">
        <div className="bg-[#F8F5F0] dark:bg-[#1a1614] rounded-none sm:rounded-3xl py-12 md:py-16 px-4 sm:px-8 lg:px-12 w-full">
          <div className="flex flex-col items-center text-center justify-center gap-2 mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-amber-900 dark:text-amber-500" style={{ fontFamily: 'serif' }}>
              Sản phẩm nổi bật
            </h2>
            <p className="max-w-2xl text-sm md:text-base text-gray-500 dark:text-gray-400">
              Những thức uống được yêu thích nhất tại {storeName}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {["Bán chạy", "Mới nhất", "Được yêu thích"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${activeTab === tab
                  ? "bg-[#8B5A2B] text-white shadow-sm"
                  : "bg-[#F3EBE1] text-[#8B5A2B] hover:bg-[#EAE0D3] dark:bg-[#3E2723] dark:text-amber-200 dark:hover:bg-[#4E342E]"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {isCurrentlyLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#8B5A2B]" />
                <p className="text-muted-foreground">Đang tải sản phẩm...</p>
              </div>
            </div>
          )}

          {!isCurrentlyLoading && displayProducts.length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {displayProducts.map((product, index) => {

                return (
                  <div
                    key={product.id}
                    className="group h-full"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.08}s both`,
                    }}
                  >
                    <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-[#FCFAF8] dark:bg-gray-900 border border-transparent hover:border-[#E8DFD5] dark:hover:border-gray-800 transition-all duration-300 hover:-translate-y-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg p-5">
                      <div className="relative">
                        {/* Badges */}
                        <div className="absolute top-0 left-0 z-10 flex flex-col gap-2">
                          {activeSale && activeSale.product_ids?.includes(product.id) ? (
                            <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-sm">
                              Flash Sale
                            </span>
                          ) : (
                            <span className={`text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase ${activeTab === "Bán chạy" ? "bg-[#F59E0B]" : activeTab === "Mới nhất" ? "bg-green-500" : "bg-red-500"
                              }`}>
                              {activeTab === "Bán chạy" ? "Best Seller" : activeTab === "Mới nhất" ? "Mới" : "Hot"}
                            </span>
                          )}
                        </div>


                        <Link to={`/${product.slug || 'products/' + product.id}`} className="block mt-6 mb-2">
                          <div className="relative h-48 w-full flex items-center justify-center">
                            <img
                              src={getThumbnail(product)}
                              alt={product.name}
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
                          {product.category_name || "Thức uống"}
                        </p>

                        <Link to={`/${product.slug || 'products/' + product.id}`}>
                          <h3 className="line-clamp-1 text-base font-bold text-[#4A3219] dark:text-gray-100 transition hover:text-[#8B5A2B] mb-1.5" style={{ fontFamily: 'serif' }}>
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-1.5 mb-5 h-[20px]">
                          <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                            {Number(product.rating) > 0 ? Number(product.rating).toFixed(1) : "Chưa có đánh giá"}
                          </span>
                        </div>

                        <div className="mt-auto flex items-end justify-between border-t border-transparent pt-1">
                          <div className="min-w-0">
                            {(() => {
                              const isFlashSale = activeSale && activeSale.product_ids?.includes(product.id);

                              const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
                              const validPrices = sizes
                                .map((size) => Number(size?.price))
                                .filter((price) => Number.isFinite(price) && price > 0);

                              if (validPrices.length === 0) {
                                return <p className="break-words text-[15px] font-bold leading-tight text-[#8B5A2B] dark:text-amber-500">Liên hệ</p>;
                              }

                              const minPrice = Math.min(...validPrices);
                              const maxPrice = Math.max(...validPrices);
                              const hasMultiplePrices = minPrice !== maxPrice;

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
                                    <p className="break-words text-[15px] font-bold leading-tight text-[#8B5A2B] dark:text-amber-500">
                                      {saleText}
                                    </p>
                                  </div>
                                );
                              }

                              return (
                                <p className="break-words text-[15px] font-bold leading-tight text-[#8B5A2B] dark:text-amber-500">
                                  {originalText}
                                </p>
                              );
                            })()}
                          </div>

                          <div className="flex gap-2 items-center">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setQuickViewProduct(product);
                              }}
                              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors shadow-sm bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/50 text-amber-700 dark:text-amber-500"
                              title="Xem nhanh"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
                            </button>
                            {isOpen ? (
                              <button
                                onClick={(e) => handleFastAdd(e, product)}
                                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors shadow-sm bg-[#8B5A2B] hover:bg-[#69421c] text-white"
                                title="Thêm vào giỏ"
                              >
                                <ShoppingCart className="w-[15px] h-[15px] xl:ml-[-1px]" />
                              </button>
                            ) : (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center justify-center text-[11px] font-bold text-rose-600 bg-rose-50 px-2 h-8 rounded-md border border-rose-100 whitespace-nowrap shadow-sm cursor-not-allowed"
                                title={nextOpenMessage}
                              >
                                Đóng cửa
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isCurrentlyLoading && displayProducts.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-lg text-gray-500">
                Hiện chưa có sản phẩm nào trong danh mục này.
              </p>
            </div>
          )}
        </div>
      </div>
      <CartSuccessModal addedCartItem={addedCartItem} onClose={() => setAddedCartItem(null)} />
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        activeSale={activeSale}
        isStoreOpen={isOpen}
        nextOpenMessage={nextOpenMessage}
        notifySuccess={(item) => setAddedCartItem(item)}
      />
    </section>
  );
}
