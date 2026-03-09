import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, Loader2, Plus } from "lucide-react";
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

const FAVORITES_KEY = "favorite_products";
const CART_KEY = "cart_items";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
  }, []);

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

  const selectedSizeObj = useMemo(() => {
    return sizes.find((s) => s.size === selectedSize) || null;
  }, [sizes, selectedSize]);

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const displayImages =
    images.length > 0 ? images : [{ image_url: defaultImage }];

  const isFavorite = favorites.includes(product?.id);

  const toggleFavorite = () => {
    if (!product?.id) return;

    const next = isFavorite
      ? favorites.filter((item) => item !== product.id)
      : [...favorites, product.id];

    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  const addToCart = () => {
    if (!product || !selectedSizeObj) {
      alert("Vui lòng chọn size.");
      return;
    }

    const cartItem = {
      productId: product.id,
      name: product.name,
      image: displayImages[0]?.image_url || defaultImage,
      size: selectedSizeObj.size,
      price: Number(selectedSizeObj.price),
      quantity: 1,
      category_id: product.category_id,
      category_name: product.category_name,
    };

    const existingCart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");

    const index = existingCart.findIndex(
      (item) =>
        item.productId === cartItem.productId && item.size === cartItem.size
    );

    let nextCart = [...existingCart];

    if (index >= 0) {
      nextCart[index] = {
        ...nextCart[index],
        quantity: nextCart[index].quantity + 1,
      };
    } else {
      nextCart.push(cartItem);
    }

    localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
    alert("Đã thêm vào giỏ hàng");
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
              loop={true}
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

              <button
                type="button"
                onClick={toggleFavorite}
                className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"
                  }`}
                />
              </button>
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

            <Button
              onClick={addToCart}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-base"
            >
              <Plus className="w-5 h-5 mr-2" />
              Thêm vào giỏ hàng
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
