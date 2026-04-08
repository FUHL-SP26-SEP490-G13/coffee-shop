import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Clock, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import flashSaleService from "@/services/flashSaleService";
import { cartService } from "@/services/cartService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { useStoreHours } from "@/hooks/useStoreHours";
import productService from "@/services/productService";
import { STORAGE_KEYS } from "@/constants";
import CartSuccessModal from "@/pages/homePage/order/CartSuccessModal";
import QuickViewModal from "@/pages/homePage/product/QuickViewModal";

export default function FlashSaleSection({ products, getThumbnail, getDefaultCartSize }) {
  const { isOpen, storeSchedule, nextOpenMessage } = useStoreHours();
  const [activeSale, setActiveSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [addedCartItem, setAddedCartItem] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const isLoggedIn = !!token;


  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const res = await flashSaleService.getCurrentActive();
        if (res.success && res.data) {
          setActiveSale(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch flash sale", error);
      }
    };
    fetchFlashSale();
  }, []);

  const [flashProducts, setFlashProducts] = useState(products || []);

  useEffect(() => {
    const fetchFlashProducts = async () => {
      if (!activeSale) return;
      try {
        const res = await productService.getAll({ limit: 200 });
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.items || []);
        if (list.length > 0) setFlashProducts(list);
      } catch (error) {
        console.error("Failed to fetch products for flash sale", error);
      }
    };
    fetchFlashProducts();
  }, [activeSale]);

  useEffect(() => {
    if (!activeSale) return;

    const calculateTimeLeft = () => {
      const difference = new Date(activeSale.end_time) - new Date();
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setActiveSale(null); // Ends automatically
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, [activeSale]);

  if (!activeSale || !flashProducts || flashProducts.length === 0) return null;

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isOpen) {
      toast.error("Cửa hàng hiện đang đóng cửa");
      return;
    }

    const cartSize = getDefaultCartSize(product);
    if (!cartSize) {
      toast.error("Sản phẩm tạm thời không có sẵn");
      return;
    }

    const originalPrice = Number(cartSize.price);
    const salePrice = Math.round(originalPrice * (1 - activeSale.discount_percent / 100));

    const cartItem = {
      productSizeId: cartSize.id,
      id: product.id,
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      image: getThumbnail(product),
      size: cartSize.size,
      basePrice: salePrice,
      price: salePrice,
      quantity: 1,
      toppings: [],
    };

    cartService.addItem(cartItem);
    setAddedCartItem(cartItem);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  return (
    <section className="py-8 md:py-12 lg:py-16">
      <div className="w-full px-4 lg:px-6 xl:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 dark:from-red-950 dark:via-orange-950 dark:to-amber-950 px-5 py-8 sm:px-8 lg:px-12 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
              <div className="flex items-center gap-4 text-white">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20">
                  <Zap className="w-8 h-8 text-yellow-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-2xl md:text-3xl font-black italic tracking-wider flex items-center gap-2 drop-shadow-md text-white">
                    FLASH SALE
                    <span className="bg-red-800 text-white text-base md:text-lg px-3 py-1 rounded-full font-bold ml-2 shadow-inner">
                      -{activeSale.discount_percent}%
                    </span>
                  </h4>
                  <p className="text-white/90 font-medium text-sm md:text-base mt-1 drop-shadow-sm">{activeSale.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-red-900/40 backdrop-blur-sm px-6 py-4 rounded-3xl border border-red-400/30 shadow-xl">
                <Clock className="w-6 h-6 text-amber-200 animate-pulse" />
                <span className="text-white font-semibold mr-2 drop-shadow-sm">Kết thúc sau:</span>
                <div className="flex gap-2 text-xl font-black text-white">
                  <div className="bg-white text-red-600 w-12 h-12 flex items-center justify-center rounded-xl shadow-md border-b-4 border-gray-200">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <span className="text-2xl mt-1 drop-shadow-sm">:</span>
                  <div className="bg-white text-red-600 w-12 h-12 flex items-center justify-center rounded-xl shadow-md border-b-4 border-gray-200">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <span className="text-2xl mt-1 drop-shadow-sm">:</span>
                  <div className="bg-white text-red-600 w-12 h-12 flex items-center justify-center rounded-xl shadow-md border-b-4 border-gray-200">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Carousel */}
            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={20}
              slidesPerView={1.2}
              navigation
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              breakpoints={{
                480: { slidesPerView: 2.2 },
                768: { slidesPerView: 3.2 },
                1024: { slidesPerView: 4 },
              }}
              className="flash-sale-swiper !pb-8"
            >
              {flashProducts
                .filter((p) => {
                  if (!activeSale.product_ids) return false;
                  let ids = activeSale.product_ids;
                  if (typeof ids === 'string') {
                    try { ids = JSON.parse(ids); } catch (e) { return false; }
                  }
                  return Array.isArray(ids) && ids.some(id => String(id) === String(p.id));
                })
                .map((product) => {
                  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
                  const validPrices = sizes
                    .map((size) => Number(size?.price))
                    .filter((price) => Number.isFinite(price) && price > 0);

                  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
                  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
                  const hasMultiplePrices = minPrice > 0 && maxPrice > minPrice;

                  const originalPrice = minPrice;
                  const salePriceMin = Math.round(minPrice * (1 - activeSale.discount_percent / 100));
                  const salePriceMax = Math.round(maxPrice * (1 - activeSale.discount_percent / 100));

                  const originalPriceText = hasMultiplePrices
                    ? `${minPrice.toLocaleString("vi-VN")}đ - ${maxPrice.toLocaleString("vi-VN")}đ`
                    : `${minPrice.toLocaleString("vi-VN")}đ`;

                  const salePriceText = hasMultiplePrices
                    ? `${salePriceMin.toLocaleString("vi-VN")}đ - ${salePriceMax.toLocaleString("vi-VN")}đ`
                    : `${salePriceMin.toLocaleString("vi-VN")}đ`;

                  const salePrice = salePriceMin; // For add to cart fallback if needed, but best if it relies on size dropdown
                  return (
                    <SwiperSlide key={product.id}>
                      <div
                        className="group h-full pb-4 px-2 pt-2"
                      >
                        <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-[#FCFAF8] dark:bg-gray-900 border border-transparent hover:border-[#E8DFD5] dark:hover:border-gray-800 transition-all duration-300 hover:-translate-y-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg p-5">
                          <div className="relative">
                            {/* Badges */}
                            <div className="absolute top-0 left-0 z-10 flex flex-col gap-2">
                              <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                <Zap className="w-3 h-3 fill-white" /> Giảm {activeSale.discount_percent}%
                              </span>
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
                                {originalPrice > 0 ? (
                                  <div className="flex flex-col">
                                    <span className="text-[11px] line-through text-gray-400">{originalPriceText}</span>
                                    <p className="break-words text-[15px] font-bold leading-tight text-[#8B5A2B] dark:text-amber-500">
                                      {salePriceText}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="break-words text-[17px] font-bold leading-tight text-[#8B5A2B] dark:text-amber-500">
                                    Liên hệ
                                  </p>
                                )}
                              </div>

                              {originalPrice > 0 && (
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
                                      onClick={(e) => handleAddToCart(e, product)}
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
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
            </Swiper>
          </div>
        </div>
      </div>

      <style>{`
        .flash-sale-swiper .swiper-button-next,
        .flash-sale-swiper .swiper-button-prev {
          color: white;
          background: rgba(0, 0, 0, 0.4);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
        }
        .flash-sale-swiper .swiper-button-next:after,
        .flash-sale-swiper .swiper-button-prev:after {
          font-size: 16px;
          font-weight: bold;
        }
        .flash-sale-swiper .swiper-button-next:hover,
        .flash-sale-swiper .swiper-button-prev:hover {
          background: rgba(0,0,0,0.6);
        }
      `}</style>
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
