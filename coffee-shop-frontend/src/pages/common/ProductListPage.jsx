import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import useFetch from "@/hooks/useFetch";
import productService from "@/services/productService";

const PAGE_SIZE = 8;
const FAVORITES_KEY = "favorite_products";
const CART_KEY = "cart_items";

export default function ProductListPage() {
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
    setCart(JSON.parse(localStorage.getItem(CART_KEY) || "[]"));
  }, []);

  const fetchProducts = useCallback(() => {
    return productService.getAll({
      status: "available",
      page,
      limit: PAGE_SIZE,
    });
  }, [page]);

  const { data, loading } = useFetch(fetchProducts);

  const products = useMemo(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  const pagination = data?.pagination || {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const getThumbnail = (product) => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      const thumbnail = product.images.find(
        (img) => Number(img?.isThumbnail ?? 0) === 1
      );
      return (
        thumbnail?.image_url || product.images[0]?.image_url || defaultImage
      );
    }
    return defaultImage;
  };

  const getDisplayPrice = (product) => {
    const sizes = Array.isArray(product?.sizes) ? product.sizes : [];

    if (!sizes.length) return "Liên hệ";

    // ưu tiên size S
    const sizeS = sizes.find((s) => s.size === "S");

    if (sizeS) {
      return `${Number(sizeS.price).toLocaleString("vi-VN")}đ`;
    }

    // nếu không có S → lấy size rẻ nhất
    const sorted = sizes
      .filter((s) => Number(s?.price) > 0)
      .sort((a, b) => Number(a.price) - Number(b.price));

    if (!sorted.length) return "Liên hệ";

    return `${Number(sorted[0].price).toLocaleString("vi-VN")}đ`;
  };

  const isFavorite = (productId) => favorites.includes(productId);

  const toggleFavorite = (productId) => {
    const next = isFavorite(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];

    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  const getDefaultCartSize = (product) => {
    const sizes = Array.isArray(product?.sizes) ? product.sizes : [];

    if (!sizes.length) return null;

    const sizeS = sizes.find(
      (size) => String(size?.size).trim().toUpperCase() === "S"
    );

    if (sizeS && Number(sizeS?.price) > 0) {
      return sizeS;
    }

    const validSizes = sizes
      .filter((size) => Number(size?.price) > 0)
      .sort((a, b) => Number(a.price) - Number(b.price));

    return validSizes[0] || null;
  };

  const addToCart = (product) => {
    const selectedSizeObj = getDefaultCartSize(product);

    if (!selectedSizeObj) {
      alert("Sản phẩm này chưa có size hợp lệ.");
      return;
    }

    const cartItem = {
      productId: product.id,
      name: product.name,
      image: getThumbnail(product),
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

    setCart(nextCart);
    localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
    alert(`Đã thêm vào giỏ hàng - size ${selectedSizeObj.size}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="w-full px-4 sm:px-6 lg:px-8 py-14">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-600 font-bold tracking-widest uppercase mb-3">
              Danh sách sản phẩm
            </p>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Khám phá menu của chúng tôi
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Mỗi sản phẩm đều có nhiều lựa chọn và mức giá phù hợp.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden h-full flex flex-col bg-white border border-gray-200 shadow-md hover:shadow-xl transition"
                  >
                    <Link to={`/products/${product.id}`} className="block">
                      <div className="relative h-56 bg-gray-100 overflow-hidden">
                        <img
                          src={getThumbnail(product)}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition duration-500"
                        />
                      </div>
                    </Link>

                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {product.category_name || "Danh mục"}
                        </p>

                        <button
                          type="button"
                          onClick={() => toggleFavorite(product.id)}
                          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFavorite(product.id)
                                ? "fill-red-500 text-red-500"
                                : "text-gray-500"
                            }`}
                          />
                        </button>
                      </div>

                      <Link to={`/products/${product.id}`}>
                        <h3 className="font-bold text-lg text-gray-900 mb-2 hover:text-amber-600 transition">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
                        {product.description ||
                          "Thưởng thức hương vị đặc biệt của chúng tôi"}
                      </p>

                      <div className="pt-4 border-t border-gray-200 flex items-end justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xl font-bold text-amber-600 leading-tight break-words">
                            {getDisplayPrice(product)}
                          </p>
                          <p className="text-xs text-gray-500">VNĐ</p>
                        </div>

                        <Button
                          size="sm"
                          className="gap-1.5 shrink-0"
                          onClick={() => addToCart(product)}
                        >
                          <Plus className="w-4 h-4" />
                          Thêm
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    Trước
                  </Button>

                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  ).map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={page === pageNumber ? "default" : "outline"}
                      onClick={() => setPage(pageNumber)}
                      className={
                        page === pageNumber
                          ? "bg-amber-600 hover:bg-amber-700"
                          : ""
                      }
                    >
                      {pageNumber}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
