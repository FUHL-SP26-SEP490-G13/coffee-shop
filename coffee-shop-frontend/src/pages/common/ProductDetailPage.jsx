import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import productService from "@/services/productService";
import toppingService from "@/services/toppingService";
import { cartService } from "@/services/cartService";
import useFetch from "@/hooks/useFetch";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [toppings, setToppings] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);

  const fetchProduct = useCallback(() => {
    return productService.getById(id);
  }, [id]);

  const { data, loading } = useFetch(fetchProduct);

  const product = data?.data || null;
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const images = Array.isArray(product?.images) ? product.images : [];

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const displayImages =
    images.length > 0 ? images : [{ image_url: defaultImage }];

  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0].size);
    }
  }, [sizes, selectedSize]);

  useEffect(() => {
    setQuantity(1);
    setSelectedSize(null);
    setSelectedToppings([]);
  }, [id]);

  useEffect(() => {
    const fetchToppings = async () => {
      try {
        const res = await toppingService.getAll();
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setToppings(list);
      } catch (error) {
        console.error("Lỗi lấy danh sách topping:", error);
        setToppings([]);
      }
    };

    fetchToppings();
  }, []);

  const selectedSizeObj = useMemo(() => {
    return sizes.find((s) => s.size === selectedSize) || null;
  }, [sizes, selectedSize]);

  const selectedToppingsTotal = useMemo(() => {
    return selectedToppings.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }, [selectedToppings]);

  const displayPrice = useMemo(() => {
    const basePrice = Number(selectedSizeObj?.price) || 0;
    return basePrice + selectedToppingsTotal;
  }, [selectedSizeObj, selectedToppingsTotal]);

  const fetchRelatedProducts = useCallback(() => {
    if (!product?.category_id) {
      return Promise.resolve({ data: [] });
    }

    return productService.getByCategory(product.category_id, {
      status: "available",
    });
  }, [product?.category_id]);

  const { data: relatedData, loading: relatedLoading } =
    useFetch(fetchRelatedProducts);

  const relatedProducts = useMemo(() => {
    const list = Array.isArray(relatedData?.data) ? relatedData.data : [];
    return list.filter((item) => String(item.id) !== String(product?.id));
  }, [relatedData, product?.id]);

  const isToppingSelected = (toppingId) => {
    return selectedToppings.some(
      (item) => Number(item.topping_id) === Number(toppingId)
    );
  };

  const getSelectedTopping = (toppingId) => {
    return (
      selectedToppings.find(
        (item) => Number(item.topping_id) === Number(toppingId)
      ) || null
    );
  };

  const toggleTopping = (topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.some(
        (item) => Number(item.topping_id) === Number(topping.id)
      );

      if (exists) {
        return prev.filter(
          (item) => Number(item.topping_id) !== Number(topping.id)
        );
      }

      return [
        ...prev,
        {
          topping_id: Number(topping.id),
          name: topping.name,
          price: Number(topping.price) || 0,
          quantity: 1,
        },
      ];
    });
  };

  const updateToppingQuantity = (toppingId, nextQuantity) => {
    setSelectedToppings((prev) =>
      prev.map((item) =>
        Number(item.topping_id) === Number(toppingId)
          ? {
              ...item,
              quantity: Math.max(1, Number(nextQuantity) || 1),
            }
          : item
      )
    );
  };

  const buildCartItem = () => {
    if (!product || !selectedSizeObj) return null;

    return {
      id: product.id,
      product_id: product.id,
      productId: product.id,
      productSizeId: selectedSizeObj.id,
      product_size_id: selectedSizeObj.id,
      name: product.name,
      image: displayImages[0]?.image_url || defaultImage,
      size: selectedSizeObj.size,
      price: Number(selectedSizeObj.price),
      basePrice: Number(selectedSizeObj.price),
      quantity: Math.max(1, Number(quantity) || 1),
      toppings: selectedToppings.map((item) => ({
        topping_id: Number(item.topping_id),
        name: item.name,
        price: Number(item.price) || 0,
        quantity: Math.max(1, Number(item.quantity) || 1),
      })),
    };
  };

  const addToCart = () => {
    if (!product || !selectedSizeObj) {
      alert("Vui lòng chọn size.");
      return;
    }

    const cartItem = buildCartItem();
    cartService.addItem(cartItem);
    alert("Đã thêm vào giỏ hàng");
  };

  const buyNow = () => {
    if (!product || !selectedSizeObj) {
      alert("Vui lòng chọn size.");
      return;
    }

    const cartItem = buildCartItem();
    cartService.addItem(cartItem);
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center text-gray-600">
          Không tìm thấy sản phẩm
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="w-full px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            ← Quay lại
          </Button>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <Swiper
              modules={[Pagination, Navigation, Autoplay]}
              pagination={{ clickable: true }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              loop
              className="rounded-2xl overflow-hidden border border-gray-200"
            >
              {displayImages.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="h-[420px] bg-gray-100">
                    <img
                      src={img.image_url || defaultImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mô tả sản phẩm
              </h3>
              <p className="text-gray-600 leading-8">
                {product.description ||
                  "Thưởng thức hương vị đặc biệt của chúng tôi"}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">
                  {product.category_name || "Danh mục"}
                </p>
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.name}
                </h1>
              </div>
            </div>

            {sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Chọn size
                </p>

                <div className="flex gap-3 flex-wrap">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size.size)}
                      className={`px-4 py-2 rounded-full border font-medium ${
                        selectedSize === size.size
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      {size.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {toppings.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Chọn topping
                </p>

                <div className="max-h-[320px] overflow-y-auto pr-2 space-y-3">
                  {toppings.map((topping) => {
                    const checked = isToppingSelected(topping.id);
                    const selectedTopping = getSelectedTopping(topping.id);

                    return (
                      <div
                        key={topping.id}
                        className="border border-gray-200 rounded-2xl p-4 bg-white"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTopping(topping)}
                              className="w-4 h-4 shrink-0"
                            />

                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 break-words">
                                {topping.name}
                              </p>
                              <p className="text-sm text-amber-600 font-semibold">
                                +{Number(topping.price).toLocaleString("vi-VN")}
                                đ
                              </p>
                            </div>
                          </label>

                          {checked && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  updateToppingQuantity(
                                    topping.id,
                                    Math.max(
                                      1,
                                      Number(selectedTopping?.quantity || 1) - 1
                                    )
                                  )
                                }
                                className="w-8 h-8 border rounded-lg hover:bg-gray-50"
                              >
                                -
                              </button>

                              <span className="min-w-[24px] text-center font-medium">
                                {selectedTopping?.quantity || 1}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateToppingQuantity(
                                    topping.id,
                                    Number(selectedTopping?.quantity || 1) + 1
                                  )
                                }
                                className="w-8 h-8 border rounded-lg hover:bg-gray-50"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-1">Giá</p>
              <p className="text-4xl font-bold text-amber-600">
                {selectedSizeObj
                  ? `${displayPrice.toLocaleString("vi-VN")}đ`
                  : "Liên hệ"}
              </p>

              {selectedToppings.length > 0 && (
                <div className="mt-3 text-sm text-gray-500 space-y-1">
                  <p>
                    Giá size:{" "}
                    {Number(selectedSizeObj?.price || 0).toLocaleString(
                      "vi-VN"
                    )}
                    đ
                  </p>
                  <p>
                    Topping: +{selectedToppingsTotal.toLocaleString("vi-VN")}đ
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 border rounded"
              >
                -
              </button>

              <span className="text-lg font-semibold">{quantity}</span>

              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 border rounded"
              >
                +
              </button>
            </div>

            <div className="flex gap-4 flex-wrap">
              <Button
                onClick={addToCart}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-base"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm vào giỏ hàng
              </Button>

              <Button
                onClick={buyNow}
                variant="outline"
                className="px-8 py-6 text-base border-amber-600 text-amber-600 hover:bg-amber-50"
              >
                Mua ngay
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-8 pb-14">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Sản phẩm liên quan
            </h2>

            <Button
              variant="ghost"
              onClick={() => navigate("/products")}
              className="text-amber-600"
            >
              Xem tất cả
            </Button>
          </div>

          {relatedLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : relatedProducts.length === 0 ? (
            <div className="text-gray-500 py-6">
              Không có sản phẩm liên quan
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((item) => {
                const itemImages = Array.isArray(item.images)
                  ? item.images
                  : [];
                const itemSizes = Array.isArray(item.sizes) ? item.sizes : [];
                const itemImage = itemImages[0]?.image_url || defaultImage;

                const minPrice =
                  itemSizes.length > 0
                    ? Math.min(...itemSizes.map((s) => Number(s.price)))
                    : null;

                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/products/${item.id}`)}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition"
                  >
                    <div className="h-56 bg-gray-100">
                      <img
                        src={itemImage}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <p className="text-sm text-gray-500 mb-1">
                        {item.category_name || "Danh mục"}
                      </p>

                      <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[48px]">
                        {item.name}
                      </h3>

                      <p className="text-amber-600 font-bold text-lg mt-3">
                        {minPrice !== null
                          ? `${minPrice.toLocaleString("vi-VN")}đ`
                          : "Liên hệ"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
