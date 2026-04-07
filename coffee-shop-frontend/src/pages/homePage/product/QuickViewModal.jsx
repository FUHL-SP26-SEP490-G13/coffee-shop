import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, Zap, Star, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import toppingService from "@/services/toppingService";
import { cartService } from "@/services/cartService";

export default function QuickViewModal({ product, isOpen, onClose, activeSale, isStoreOpen, nextOpenMessage, notifySuccess }) {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [toppings, setToppings] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isToppingExpanded, setIsToppingExpanded] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setSelectedToppings([]);
      setActiveImageIndex(0);
      setIsToppingExpanded(false);
      // Select the lowest active price size
      let defaultSize = null;
      if (product.sizes && product.sizes.length > 0) {
        const dSize = product.sizes.find(s => String(s.size).trim().toUpperCase() === "S");
        if (dSize && Number(dSize.price) > 0) {
          defaultSize = dSize.id;
        } else {
          const validSizes = product.sizes.filter(s => Number(s.price) > 0).sort((a,b) => Number(a.price) - Number(b.price));
          defaultSize = validSizes[0]?.id || product.sizes[0]?.id;
        }
      }
      setSelectedSize(defaultSize);

      setLoading(true);
      toppingService.getAll()
        .then((res) => setToppings(res?.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, product]);

  const selectedSizeObj = useMemo(() => {
    if (!product || !selectedSize || !product.sizes) return null;
    return product.sizes.find((s) => s.id === selectedSize) || product.sizes[0];
  }, [product, selectedSize]);

  // Pricing calculations
  const isFlashSale = activeSale && activeSale.product_ids?.includes(product?.id);
  const flashSaleDiscount = activeSale?.discount_percent || 0;

  const currentPrice = useMemo(() => {
    if (!selectedSizeObj) return 0;
    let price = Number(selectedSizeObj.price);
    if (isFlashSale) price = Math.round(price * (1 - flashSaleDiscount / 100));
    return price;
  }, [selectedSizeObj, isFlashSale, flashSaleDiscount]);

  const originalPrice = useMemo(() => {
    if (!selectedSizeObj) return 0;
    return Number(selectedSizeObj.price);
  }, [selectedSizeObj]);

  const totalPrice = useMemo(() => {
    const toppingTotal = selectedToppings.reduce(
      (sum, top) => sum + Number(top.price) * Number(top.quantity),
      0
    );
    return (currentPrice + toppingTotal) * quantity;
  }, [currentPrice, selectedToppings, quantity]);

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((item) => Number(item.topping_id) === Number(topping.id));
      if (exists) {
        return prev.filter((item) => Number(item.topping_id) !== Number(topping.id));
      }
      return [...prev, { topping_id: Number(topping.id), name: topping.name, price: Number(topping.price) || 0, quantity: 1 }];
    });
  };

  const isToppingSelected = (toppingId) => selectedToppings.some((item) => Number(item.topping_id) === Number(toppingId));

  const handleAddToCart = () => {
    if (!isStoreOpen) {
      toast.error("Cửa hàng hiện đang đóng cửa");
      return;
    }
    if (!selectedSizeObj) {
      toast.error("Vui lòng chọn size.");
      return;
    }

    const defaultImage = "https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg";
    const thumbnail = Array.isArray(product.images) ? (product.images.find(img => img.isThumbnail === 1)?.image_url || product.images[0]?.image_url || defaultImage) : defaultImage;

    const cartItem = {
      productSizeId: selectedSizeObj.id,
      id: product.id,
      product_id: product.id,
      name: product.name,
      image: thumbnail,
      size: selectedSizeObj.size,
      basePrice: currentPrice,
      price: currentPrice,
      quantity,
      toppings: selectedToppings.map(t => ({
        topping_id: Number(t.topping_id),
        name: t.name,
        price: Number(t.price),
        quantity: Number(t.quantity),
      })),
    };

    cartService.addItem(cartItem);
    window.dispatchEvent(new Event("cartUpdated"));
    if (notifySuccess) notifySuccess(cartItem);
    onClose();
  };

  if (!product) return null;

  const defaultImage = "https://png.pngtree.com/png-vector/20190820/ourmid/pngtree-no-image-vector-illustration-isolated-png-image_1694547.jpg";
  const displayImages = Array.isArray(product.images) && product.images.length > 0
    ? [...product.images].sort((a, b) => b.isThumbnail - a.isThumbnail).map(img => img.image_url)
    : [product.image_url || defaultImage];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[98vw] xl:max-w-7xl p-0 overflow-hidden bg-white dark:bg-gray-900 border-none rounded-3xl w-[95vw] md:w-[90vw] lg:w-[1200px] xl:w-[1400px] gap-0">
        <div className="flex flex-col md:flex-row h-full max-h-[95vh] md:max-h-[85vh]">
          {/* Left: Image Box */}
          <div className="relative w-full md:w-3/5 bg-gray-50 dark:bg-gray-950 flex flex-col items-center p-6 md:p-10 justify-center">
            {isFlashSale && (
              <div className="absolute top-6 left-6 z-20 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Zap className="w-4 h-4 fill-current" /> Flash Sale
              </div>
            )}
            
            <div 
              className="w-full max-w-[320px] md:max-w-[450px] lg:max-w-[500px] xl:max-w-[600px] mx-auto aspect-square flex items-center justify-center relative group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] overflow-hidden p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] cursor-pointer"
              onClick={() => {
                onClose();
                navigate(`/${product.slug || 'products/' + product.id}`);
              }}
            >
              <img
                src={displayImages[activeImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />

              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {displayImages.length > 1 && (
              <div className="flex gap-3 justify-center mt-8 w-full max-w-[500px] overflow-x-auto custom-scrollbar pb-2 px-2">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`shrink-0 w-16 h-16 rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
                      activeImageIndex === idx ? 'border-amber-500 scale-110 shadow-lg ring-2 ring-amber-500/20' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="w-full h-full p-1 bg-white dark:bg-gray-800">
                      <img src={img} alt="" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info Box */}
          <div className="w-full md:w-2/5 flex flex-col items-stretch max-h-full overflow-y-auto custom-scrollbar">
            <div className="p-6 md:p-8 flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2" style={{ fontFamily: 'serif' }}>{product.name}</h2>
              
              <div className="flex items-center gap-1.5 mb-4 opacity-80">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="text-sm font-semibold">{Number(product.rating) > 0 ? Number(product.rating).toFixed(1) : "Chưa có đánh giá"}</span>
              </div>

              <div className="flex items-end gap-3 mb-6">
                <span className="text-2xl font-black text-amber-600">
                  {currentPrice.toLocaleString("vi-VN")}đ
                </span>
                {isFlashSale && originalPrice > currentPrice && (
                  <span className="text-sm text-gray-400 line-through font-medium mb-1">
                    {originalPrice.toLocaleString("vi-VN")}đ
                  </span>
                )}
              </div>

              {/* Sizes */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wider">Kích cỡ</h3>
                <div className="flex flex-wrap gap-2">
                  {product?.sizes?.map((size) => {
                    const btnPrice = Number(size.price);
                    const isAvail = btnPrice > 0;
                    return (
                      <button
                        key={size.id}
                        disabled={!isAvail}
                        onClick={() => setSelectedSize(size.id)}
                        className={`min-w-[4rem] px-3 py-2 rounded-xl border text-sm font-semibold transition-all
                          ${selectedSize === size.id 
                            ? "bg-amber-600 text-white border-amber-600 shadow-md" 
                            : "bg-white text-gray-700 hover:border-amber-500 hover:text-amber-600"}
                          ${!isAvail ? "opacity-40 cursor-not-allowed bg-gray-100" : ""}`}
                      >
                        {size.size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toppings */}
              {toppings && toppings.length > 0 && (
                <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm transition-all duration-300">
                  <div 
                    className="px-5 py-4 flex justify-between items-center cursor-pointer bg-gray-50/80 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setIsToppingExpanded(!isToppingExpanded)}
                  >
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2">
                       Thêm Topping
                       {selectedToppings.length > 0 && !isToppingExpanded && (
                         <span className="text-[11px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
                           {selectedToppings.length} đã chọn
                         </span>
                       )}
                    </h3>
                    <div className="text-gray-500 hover:text-amber-600 transition-colors bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                      {isToppingExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {isToppingExpanded && (
                    <div className="p-5 max-h-[260px] overflow-y-auto custom-scrollbar border-t border-gray-100 dark:border-gray-800">
                      <div className="space-y-4">
                        {toppings.map((topping) => {
                          const selected = isToppingSelected(topping.id);
                          return (
                            <div key={topping.id} className="flex items-center justify-between space-x-2">
                              <label className="flex items-center gap-3 cursor-pointer select-none w-full">
                                <input 
                                  type="checkbox" 
                                  checked={selected}
                                  onChange={() => toggleTopping(topping)}
                                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 rounded border-gray-300 cursor-pointer"
                                />
                                <span className="text-sm font-medium flex-1">{topping.name}</span>
                                <span className="text-sm text-gray-500 font-medium">+{(Number(topping.price)).toLocaleString("vi-VN")}đ</span>
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {!isToppingExpanded && selectedToppings.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-amber-50/40 dark:bg-amber-900/10 transition-all duration-300 relative overflow-hidden">
                      <div className="flex flex-col gap-2">
                        {selectedToppings.map(t => (
                          <div key={t.topping_id} className="flex justify-between items-center text-[13px]">
                            <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm"></div>
                              {t.name}
                            </span>
                            <span className="text-gray-500 font-medium">+{t.price.toLocaleString("vi-VN")}đ</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Số lượng</span>
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1 border">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-gray-700 shadow-sm"><Minus className="w-4 h-4 text-gray-600" /></button>
                  <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-gray-700 shadow-sm"><Plus className="w-4 h-4 text-gray-600" /></button>
                </div>
              </div>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t p-4 md:p-6 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
              {isStoreOpen ? (
                <Button onClick={handleAddToCart} className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 rounded-xl text-base font-bold shadow-lg shadow-amber-600/30">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Thêm vào giỏ hàng • {totalPrice > 0 ? totalPrice.toLocaleString("vi-VN") : 0}đ
                </Button>
              ) : (
                <div className="text-center p-3 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100">
                  {nextOpenMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
