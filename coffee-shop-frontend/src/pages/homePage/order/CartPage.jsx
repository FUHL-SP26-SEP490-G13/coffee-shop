import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingBag, Star, ShoppingCart, Heart } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { cartService } from "@/services/cartService";
import toppingService from "@/services/toppingService";
import productService from "@/services/productService";
import flashSaleService from "@/services/flashSaleService";
import favoriteService from "@/services/favoriteService";
import { STORAGE_KEYS } from "@/constants";
import { toast } from "sonner";
import { useStoreHours } from "@/hooks/useStoreHours";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function CartPage() {
  useDocumentTitle("Giỏ hàng");
  const navigate = useNavigate();
  const { isOpen: isStoreOpen, nextOpenMessage } = useStoreHours();
  const token =
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const isLoggedIn = !!token;
  const [cart, setCart] = useState(() => cartService.getCart());
  const [allToppings, setAllToppings] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [productSizesMap, setProductSizesMap] = useState({});
  const [activeSale, setActiveSale] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [favoriteMap, setFavoriteMap] = useState({});

  const refreshCart = () => {
    setCart(cartService.getCart());
  };

  useEffect(() => {
    productService.getAll({ limit: 12 }).then(res => {
      setSuggestions(res?.data?.data || res?.data || []);
    }).catch(e => console.error("Lỗi lấy danh sách gợi ý", e));
  }, []);

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!isLoggedIn || suggestions.length === 0) {
        setFavoriteMap({});
        return;
      }

      try {
        const results = await Promise.all(
          suggestions.map(async (product) => {
            try {
              const res = await favoriteService.checkFavorite(product.id || product.product_id);
              const payload = res?.data?.data || res?.data || res || {};
              return {
                productId: product.id || product.product_id,
                isFavorite: Boolean(payload.isFavorite),
              };
            } catch (error) {
              return {
                productId: product.id || product.product_id,
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
  }, [suggestions, isLoggedIn]);

  useEffect(() => {
    window.addEventListener("cartUpdated", refreshCart);
    window.addEventListener("storage", refreshCart);

    return () => {
      window.removeEventListener("cartUpdated", refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, []);

  useEffect(() => {
    const fetchToppings = async () => {
      try {
        const res = await toppingService.getAll();
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
            ? res.data
            : [];
        setAllToppings(list);
      } catch (error) {
        console.error("Lỗi lấy topping:", error);
        setAllToppings([]);
      }
    };

    fetchToppings();
  }, []);

  useEffect(() => {
    flashSaleService.getCurrentActive()
      .then((res) => setActiveSale(res?.data || null))
      .catch(() => { });
  }, []);

  useEffect(() => {
    const fetchSizes = async () => {
      const ids = [...new Set(cart.map((item) => item.product_id || item.id).filter(Boolean))];
      const missingIds = ids.filter(id => !productSizesMap[id]);

      if (missingIds.length === 0) return;

      const map = { ...productSizesMap };
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const res = await productService.getById(id);
            const sizes = res?.data?.data?.sizes || res?.data?.sizes || [];
            if (sizes.length > 0) {
              map[id] = sizes;
            }
          } catch (error) {
            console.error("Lỗi lấy size", error);
          }
        })
      );
      setProductSizesMap(map);
    };

    fetchSizes();
  }, [cart]);

  const totalAmount = cartService.getTotalAmount();

  const isToppingSelected = (item, toppingId) => {
    return Array.isArray(item.toppings)
      ? item.toppings.some((t) => Number(t.topping_id) === Number(toppingId))
      : false;
  };


  const toggleToppingForItem = (item, topping) => {
    const cartKey = item.cartKey;
    const currentToppings = Array.isArray(item.toppings) ? item.toppings : [];

    const exists = currentToppings.some(
      (t) => Number(t.topping_id) === Number(topping.id)
    );

    let nextToppings = [];

    if (exists) {
      nextToppings = currentToppings.filter(
        (t) => Number(t.topping_id) !== Number(topping.id)
      );
    } else {
      nextToppings = [
        ...currentToppings,
        {
          topping_id: Number(topping.id),
          name: topping.name,
          price: Number(topping.price) || 0,
          quantity: 1,
        },
      ];
    }

    cartService.updateToppings(cartKey, nextToppings);
    refreshCart();
  };


  const removeToppingForItem = (item, toppingId) => {
    cartService.removeTopping(item.cartKey, toppingId);
    refreshCart();
  };

  const handleSizeChange = (item, newSizeId) => {
    const productId = item.product_id || item.id;
    const sizes = productSizesMap[productId];
    if (!sizes) return;

    const newSizeObj = sizes.find((s) => Number(s.id) === Number(newSizeId));
    if (!newSizeObj) return;

    let newPrice = Number(newSizeObj.price);

    if (activeSale && activeSale.product_ids?.includes(Number(productId))) {
      newPrice = Math.round(newPrice * (1 - activeSale.discount_percent / 100));
    }

    cartService.updateItemSize(item.cartKey, newSizeObj.id, newSizeObj.size, newPrice);
    refreshCart();
  };

  const handleAddSuggestion = async (item) => {
    if (!isStoreOpen) {
      toast.error("Cửa hàng hiện đang đóng cửa");
      return;
    }

    let itemSizes = Array.isArray(item.sizes) ? item.sizes : [];
    
    // Fetch sizes on-the-fly if missing from the lightweight getAll summary
    if (itemSizes.length === 0) {
      try {
        const res = await productService.getById(item.id || item.product_id);
        itemSizes = res?.data?.data?.sizes || res?.data?.sizes || [];
      } catch (error) {
        console.error("Không thể lấy size tự động:", error);
      }
    }

    if (itemSizes.length === 0) {
      toast.error("Sản phẩm này tạm thời chưa có kích thước.");
      return;
    }
    const defaultSize = itemSizes[0];
    let price = Number(defaultSize.price);

    if (activeSale && activeSale.product_ids?.includes(Number(item.id || item.product_id))) {
      price = Math.round(price * (1 - activeSale.discount_percent / 100));
    }

    const itemImages = Array.isArray(item.images) ? item.images : [];
    const imageUrl = itemImages[0]?.image_url || item.image_url || item.image || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

    const cartItem = {
      product_id: item.id || item.product_id,
      productSizeId: defaultSize.id,
      name: item.name,
      image: imageUrl,
      size: defaultSize.size,
      basePrice: price,
      price: price,
      quantity: 1,
      toppings: [],
      slug: item.slug
    };

    cartService.addItem(cartItem);
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success(`Đã thêm ${item.name} vào giỏ`);
  };

  const handleToggleFavorite = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      toast.error("Bạn phải đăng nhập để thêm sản phẩm yêu thích");
      return;
    }

    const currentFavorite = Boolean(favoriteMap[productId]);

    setFavoriteMap((prev) => ({
      ...prev,
      [productId]: !currentFavorite,
    }));

    try {
      const res = await favoriteService.toggleFavorite(
        productId,
        currentFavorite
      );

      const payload = res?.data?.data || res?.data || res || {};

      if (typeof payload.isFavorite === "boolean") {
        setFavoriteMap((prev) => ({
          ...prev,
          [productId]: payload.isFavorite,
        }));
      }

      window.dispatchEvent(new Event("favoriteUpdated"));
    } catch (error) {
      console.error("Lỗi cập nhật yêu thích:", error);
      setFavoriteMap((prev) => ({
        ...prev,
        [productId]: currentFavorite,
      }));
    }
  };

  const displayedSuggestions = suggestions.filter(p => !cart.some(c => (c.product_id || c.id) === (p.id || p.product_id))).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <section className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <h1 className="text-2xl md:text-2xl font-semibold text-amber-900 dark:text-amber-500" style={{ fontFamily: 'serif' }}>Giỏ hàng</h1>

            <div className="flex gap-3">
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => {
                    if (window.confirm("Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng không?")) {
                      cartService.clearCart();
                      refreshCart();
                      toast.success("Đã làm trống giỏ hàng");
                    }
                  }}
                >
                  Xóa tất cả
                </Button>
              )}
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-12 h-12 text-amber-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-100 mb-5">
                Giỏ hàng của bạn đang trống
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                Giỏ hàng đang kêu réo vì trống trơn. Khám phá bộ sưu tập đồ uống và chọn món bạn yêu thích ngay nhé!
              </p>
              <Button
                onClick={() => navigate("/products")}
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-full px-8 shadow-md shadow-amber-600/20"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Xem Menu ngay
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item, index) => {
                  const cartKey = item.cartKey;
                  const unitPrice = cartService.getItemUnitPrice(item);
                  const itemTotal = cartService.getItemSubtotal(item);
                  const isEditing = editingIndex === index;

                  return (
                    <div
                      key={`cart-item-${item.productSizeId || item.id}-${index}`}
                      className="border border-gray-200  rounded-2xl p-5 bg-white dark:bg-gray-900"
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          onClick={() => navigate(`/${item.slug || 'products/' + (item.product_id || item.id)}`)}
                          className="w-24 h-24 text-gray-900 dark:text-gray-100 rounded-xl object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                              <h3
                                className="text-lg font-semibold cursor-pointer hover:text-amber-600 transition-colors"
                                onClick={() => navigate(`/${item.slug || 'products/' + (item.product_id || item.id)}`)}
                              >
                                {item.name}
                              </h3>

                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Size:</span>
                                {productSizesMap[item.product_id || item.id]?.length > 0 ? (
                                  <select
                                    value={item.productSizeId || item.product_size_id}
                                    onChange={(e) => handleSizeChange(item, e.target.value)}
                                    className="border rounded px-2 py-1 text-sm bg-gray-50 dark:bg-gray-950 outline-none hover:border-amber-500 transition-colors cursor-pointer"
                                  >
                                    {productSizesMap[item.product_id || item.id].map(size => (
                                      <option key={size.id} value={size.id}>
                                        {size.size}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.size}</span>
                                )}
                              </div>

                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Giá gốc:{" "}
                                {Number(
                                  item.basePrice || item.price
                                ).toLocaleString("vi-VN")}
                                đ
                              </p>
                            </div>

                            <div className="font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {itemTotal.toLocaleString("vi-VN")}đ
                            </div>
                          </div>

                          {Array.isArray(item.toppings) &&
                            item.toppings.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Topping:
                                </p>

                                <div className="space-y-1 mt-1">
                                  {item.toppings.map((topping) => (
                                    <div
                                      key={topping.topping_id}
                                      className="flex items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400"
                                    >
                                      <span className="break-words">
                                        - {topping.name} (
                                        {Number(topping.price).toLocaleString(
                                          "vi-VN"
                                        )}
                                        đ)
                                      </span>

                                      {isEditing && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeToppingForItem(
                                              item,
                                              topping.topping_id
                                            )
                                          }
                                          className="text-red-600 hover:underline shrink-0"
                                        >
                                          Xóa topping
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          <p className="text-amber-600 font-bold mt-3">
                            Đơn giá: {unitPrice.toLocaleString("vi-VN")}đ
                          </p>

                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                const nextQty = Math.max(
                                  1,
                                  Number(item.quantity) - 1
                                );
                                cartService.updateQuantity(cartKey, nextQty);
                                refreshCart();
                              }}
                              className="w-10 h-10 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 text-lg"
                            >
                              -
                            </button>

                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const nextQty = Math.max(
                                  1,
                                  Number(e.target.value) || 1
                                );
                                cartService.updateQuantity(cartKey, nextQty);
                                refreshCart();
                              }}
                              className="w-16 h-10 border rounded-lg text-center"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const nextQty = Number(item.quantity) + 1;
                                cartService.updateQuantity(cartKey, nextQty);
                                refreshCart();
                              }}
                              className="w-10 h-10 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 text-lg"
                            >
                              +
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setEditingIndex(isEditing ? null : index)
                              }
                              className="text-amber-600 text-sm font-medium hover:underline"
                            >
                              {isEditing ? "Đóng thêm topping" : "Thêm topping"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                cartService.removeItem(cartKey);
                                if (editingIndex === index) {
                                  setEditingIndex(null);
                                }
                                refreshCart();
                              }}
                              className="text-red-600 text-sm font-medium hover:underline"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="mt-4 border-t pt-4">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
                            Chọn topping
                          </p>

                          <div className="max-h-[280px] overflow-y-auto pr-2 space-y-3">
                            {allToppings.map((topping) => {
                              const checked = isToppingSelected(
                                item,
                                topping.id
                              );

                              return (
                                <div
                                  key={topping.id}
                                  className="border border-gray-200  rounded-2xl p-4"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          toggleToppingForItem(item, topping)
                                        }
                                        className="w-4 h-4 shrink-0"
                                      />

                                      <div className="min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-gray-100 break-words">
                                          {topping.name}
                                        </p>
                                        <p className="text-sm text-amber-600 font-semibold">
                                          +
                                          {Number(topping.price).toLocaleString(
                                            "vi-VN"
                                          )}
                                          đ
                                        </p>
                                      </div>
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border rounded-2xl p-5 h-fit bg-gray-50 dark:bg-gray-950 lg:sticky lg:top-24">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Tóm tắt đơn hàng
                </h2>

                <div className="flex justify-between text-gray-700 dark:text-gray-300 mb-3">
                  <span>Tổng tiền</span>
                  <span className="font-bold text-amber-600">
                    {totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <Button
                  className="w-full mt-4"
                  onClick={() => navigate("/checkout")}
                >
                  Tiến hành thanh toán
                </Button>
              </div>
            </div>
          )}
        </div>

        {displayedSuggestions.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-amber-900 dark:text-amber-500" style={{ fontFamily: 'serif' }}>
                Có thể bạn sẽ thích
              </h2>
              <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedSuggestions.map((item) => {
                const itemSizes = Array.isArray(item.sizes) ? item.sizes : [];
                const itemImages = Array.isArray(item.images) ? item.images : [];
                const image = itemImages[0]?.image_url || item.image_url || item.image || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

                const minPrice = item.min_price !== undefined && item.min_price !== null 
                  ? Number(item.min_price) 
                  : (itemSizes.length > 0
                      ? Math.min(...itemSizes.map((s) => Number(s.price)))
                      : null);

                const isFavorite = Boolean(favoriteMap[item.id || item.product_id]);

                return (
                  <div
                    key={item.id || item.product_id}
                    className="group h-full pb-4 px-2 pt-2"
                  >
                    <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-[#FCFAF8] dark:bg-gray-900 border border-transparent hover:border-[#E8DFD5] dark:hover:border-gray-800 transition-all duration-300 hover:-translate-y-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg p-5">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, item.id || item.product_id)}
                          className={`absolute right-0 top-0 z-10 flex items-center justify-center transition-all ${
                            isFavorite
                              ? "text-red-500 drop-shadow-sm"
                              : "text-[#DCD5CD] hover:text-red-400 dark:text-gray-600"
                          }`}
                          title={isFavorite ? "Bỏ khỏi yêu thích" : "Thêm vào yêu thích"}
                        >
                          <Heart
                            className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`}
                            strokeWidth={1.5}
                          />
                        </button>
                        <Link to={`/${item.slug || 'products/' + (item.id || item.product_id)}`} className="block mt-6 mb-2">
                          <div className="relative h-48 w-full flex items-center justify-center">
                            <img
                              src={image}
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

                        <Link to={`/${item.slug || 'products/' + (item.id || item.product_id)}`}>
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
                              <p className="break-words text-[17px] font-bold leading-tight text-[#8B5A2B] dark:text-amber-500">
                                {minPrice !== null ? `${minPrice.toLocaleString("vi-VN")}đ` : "Liên hệ"}
                              </p>
                          </div>

                          {isStoreOpen ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddSuggestion(item);
                              }}
                              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors shadow-sm bg-[#8B5A2B] hover:bg-[#69421c] text-white"
                            >
                              <ShoppingCart className="w-[15px] h-[15px] xl:ml-[-1px]" />
                            </button>
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
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
