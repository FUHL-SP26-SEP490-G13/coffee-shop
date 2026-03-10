import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import productService from "@/services/productService";
import useFetch from "@/hooks/useFetch";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const CART_KEY = "cart_items";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const fetchProduct = useCallback(() => {
    return productService.getById(id);
  }, [id]);

  const { data, loading } = useFetch(fetchProduct);

  const product = data?.data || null;
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  const images = Array.isArray(product?.images) ? product.images : [];

  useEffect(() => {
    if (sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0].size);
    }
  }, [sizes, selectedSize]);

  useEffect(() => {
    setQuantity(1);
    setSelectedSize(null);
  }, [id]);

  const selectedSizeObj = useMemo(() => {
    return sizes.find((s) => s.size === selectedSize) || null;
  }, [sizes, selectedSize]);

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const displayImages =
    images.length > 0 ? images : [{ image_url: defaultImage }];

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

  const addToCart = () => {
    if (!product || !selectedSizeObj) {
      alert("Vui lòng chọn size.");
      return;
    }

    const cartItem = {
      productId: product.id,
      productSizeId: selectedSizeObj.id,
      name: product.name,
      image: displayImages[0]?.image_url || defaultImage,
      size: selectedSizeObj.size,
      price: Number(selectedSizeObj.price),
      quantity,
    };

    const existingCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

    const index = existingCart.findIndex(
      (item) => item.productSizeId === cartItem.productSizeId
    );

    const nextCart = [...existingCart];

    if (index >= 0) {
      nextCart[index] = {
        ...nextCart[index],
        quantity: nextCart[index].quantity + quantity,
      };
    } else {
      nextCart.push(cartItem);
    }

    localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
    window.dispatchEvent(new Event("cartUpdated"));
    alert("Đã thêm vào giỏ hàng");
  };

  const buyNow = () => {
    if (!product || !selectedSizeObj) {
      alert("Vui lòng chọn size.");
      return;
    }

    const cartItem = {
      productId: product.id,
      productSizeId: selectedSizeObj.id,
      name: product.name,
      image: displayImages[0]?.image_url || defaultImage,
      size: selectedSizeObj.size,
      price: Number(selectedSizeObj.price),
      quantity,
    };

    const existingCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

    const index = existingCart.findIndex(
      (item) => item.productSizeId === cartItem.productSizeId
    );

    const nextCart = [...existingCart];

    if (index >= 0) {
      nextCart[index] = {
        ...nextCart[index],
        quantity: nextCart[index].quantity + quantity,
      };
    } else {
      nextCart.push(cartItem);
    }

    localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
    window.dispatchEvent(new Event("cartUpdated"));

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

            <p className="text-gray-600 leading-8 mb-6">
              {product.description ||
                "Thưởng thức hương vị đặc biệt của chúng tôi"}
            </p>

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

            <div className="mb-8">
              <p className="text-sm text-gray-500 mb-1">Giá</p>
              <p className="text-4xl font-bold text-amber-600">
                {selectedSizeObj
                  ? `${Number(selectedSizeObj.price).toLocaleString("vi-VN")}đ`
                  : "Liên hệ"}
              </p>
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

            <div className="flex gap-4">
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
