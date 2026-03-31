import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Zap, Clock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import flashSaleService from "@/services/flashSaleService";
import { cartService } from "@/services/cartService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { useStoreHours } from "@/hooks/useStoreHours";

export default function FlashSaleSection({ products, getThumbnail, getDefaultCartSize }) {
  const { isOpen } = useStoreHours();
  const [activeSale, setActiveSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

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

  if (!activeSale || !products || products.length === 0) return null;

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
      name: product.name,
      image: getThumbnail(product),
      size: cartSize.size,
      basePrice: salePrice,
      price: salePrice,
      quantity: 1,
      toppings: [],
    };

    cartService.addItem(cartItem);
    toast.success(`Đã thêm ${product.name} (giá Flash Sale) vào giỏ hàng`);
  };

  return (
    <section 
      className="py-12 relative overflow-hidden" 
      style={{ background: 'linear-gradient(to right, #dc2626, #ea580c, #f59e0b)' }}
    >
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-4 text-white">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20">
              <Zap className="w-8 h-8 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black italic tracking-wider flex items-center gap-2 drop-shadow-md text-white">
                FLASH SALE
                <span className="bg-red-800 text-white text-base md:text-lg px-3 py-1 rounded-full font-bold ml-2 shadow-inner">
                  -{activeSale.discount_percent}%
                </span>
              </h2>
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
          {products
            .filter((p) => activeSale.product_ids?.includes(p.id))
            .slice(0, 5)
            .map((product) => {
            const cartSize = getDefaultCartSize(product);
            const originalPrice = cartSize ? Number(cartSize.price) : 0;
            const salePrice = Math.round(originalPrice * (1 - activeSale.discount_percent / 100));

            return (
              <SwiperSlide key={product.id}>
                <Link
                  to={`/products/${product.id}`}
                  className="block bg-white rounded-2xl p-3 shadow-lg hover:-translate-y-2 transition-transform duration-300 group border border-orange-100"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                    <img
                      src={getThumbnail(product)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-white" /> Giảm {activeSale.discount_percent}%
                    </div>
                  </div>
                  <div className="px-2 pb-2">
                    <h3 className="font-semibold text-gray-800 line-clamp-1 mb-2 group-hover:text-red-500 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex flex-col gap-1 mb-4">
                      {originalPrice > 0 ? (
                        <>
                          <span className="text-gray-400 text-sm line-through decoration-gray-400 decoration-1">
                            {originalPrice.toLocaleString("vi-VN")}đ
                          </span>
                          <span className="text-red-600 font-bold text-lg">
                            {salePrice.toLocaleString("vi-VN")}đ
                          </span>
                        </>
                      ) : (
                        <span className="text-red-600 font-bold text-lg">Liên hệ</span>
                      )}
                    </div>
                    {originalPrice > 0 && (
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={!isOpen}
                        className={`w-full font-medium py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 ${
                          isOpen
                            ? "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 active:scale-95 shadow-orange-500/30"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5" /> {isOpen ? "Thêm Ngay" : "Đã Khóa"}
                      </button>
                    )}
                  </div>
                </Link>
              </SwiperSlide>
            );
          })}
        </Swiper>
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
    </section>
  );
}
