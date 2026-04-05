import { useEffect, useState } from "react";
import { Loader2, Heart, Search, Trash2, ShoppingBag, ShoppingCart, Star } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import favoriteService from "@/services/favoriteService";
import productService from "@/services/productService";
import { cartService } from "@/services/cartService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStoreHours } from "@/hooks/useStoreHours";

const PAGE_SIZE = 8;

export default function FavoritePage() {
  const navigate = useNavigate();
  const { isOpen: isStoreOpen, nextOpenMessage } = useStoreHours();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [initialized, setInitialized] = useState(false);

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const fetchFavorites = async () => {
    try {
      if (!initialized) {
        setLoading(true);
      }

      const res = await favoriteService.getMyFavorites({
        page,
        limit: PAGE_SIZE,
        keyword: "",
      });

      const result = res?.data || {};

      setFavorites(Array.isArray(result?.items) ? result.items : []);
      setTotalPages(Number(result?.totalPages) || 1);
    } catch (error) {
      console.error("Lỗi lấy danh sách yêu thích:", error);
      setFavorites([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [page]);

  const handleAddToCart = async (item) => {
    if (!isStoreOpen) {
      alert("Cửa hàng hiện đang đóng cửa");
      return;
    }

    try {
      const res = await productService.getById(item.product_id);
      const product = res?.data || null;

      if (!product) {
        alert("Sản phẩm không còn tồn tại");
        return;
      }

      const sizes = Array.isArray(product.sizes) ? product.sizes : [];
      let selectedSizeObj = null;

      if (sizes.length > 0) {
        const sortedSizes = [...sizes].sort((a, b) => Number(a.price) - Number(b.price));
        selectedSizeObj = sortedSizes[0];
      }

      if (!selectedSizeObj) {
        alert("Sản phẩm này cần chọn Tùy chọn, vui lòng vào trang chi tiết!");
        navigate(`/${item.slug || 'products/' + item.product_id}`);
        return;
      }

      const basePriceNum = Number(selectedSizeObj.price);

      const cartItem = {
        id: product.id,
        product_id: product.id,
        productId: product.id,
        productSizeId: selectedSizeObj.id,
        product_size_id: selectedSizeObj.id,
        name: product.name,
        image: item.image_url || defaultImage,
        size: selectedSizeObj.size,
        price: basePriceNum,
        basePrice: basePriceNum,
        quantity: 1,
        toppings: [],
      };

      cartService.addItem(cartItem);

      // Dispatch sự kiện để cập nhật UI Badge Giỏ hàng nếu có 
      window.dispatchEvent(new Event("cartUpdated"));

      alert("Đã thêm vào giỏ hàng");
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      alert("Có lỗi xảy ra khi thêm vào giỏ!");
    }
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      await favoriteService.removeFavorite(productId);

      // cập nhật UI ngay lập tức cho mượt
      setFavorites((prev) =>
        prev.filter((item) => item.product_id !== productId)
      );
      window.dispatchEvent(new Event("favoriteUpdated"));
    } catch (error) {
      console.error("Lỗi xóa yêu thích:", error);
      alert("Không thể xóa sản phẩm khỏi yêu thích");
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Bạn có chắc muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?")) {
      try {
        setLoading(true);
        // Delete all favorites simultaneously
        await Promise.all(favorites.map(item => favoriteService.removeFavorite(item.product_id)));
        setFavorites([]);
        window.dispatchEvent(new Event("favoriteUpdated"));
        alert("Đã làm sạch danh sách yêu thích!");
      } catch (error) {
        console.error("Lỗi xóa tất cả:", error);
        alert("Có lỗi xảy ra khi xóa danh sách.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="w-full mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <h1 className="text-2xl md:text-2xl font-semibold text-amber-900 dark:text-amber-500" style={{ fontFamily: 'serif' }}>Danh sách yêu thích</h1>

            <div className="flex gap-3">
              {favorites.length > 0 && (
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={handleClearAll}
                >
                  Xóa tất cả
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-12 h-12 text-red-500 fill-current opacity-80" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-100 mb-5">
                Bộ sưu tập trống trơn
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                Danh sách yêu thích đang buồn hiu hà. Đi dạo một vòng xem có món nước nào hợp gu để thả tim không nhé!
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {favorites.map((item) => {
                  const itemSizes = Array.isArray(item.sizes) ? item.sizes : [];
                  const image = item.image_url || defaultImage;

                  const minPrice = item.min_price !== undefined && item.min_price !== null
                    ? Number(item.min_price)
                    : (itemSizes.length > 0
                      ? Math.min(...itemSizes.map((s) => Number(s.price)))
                      : null);

                  return (
                    <div
                      key={item.product_id}
                      className="group h-full pb-4 px-2 pt-2"
                    >
                      <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-[#FCFAF8] dark:bg-gray-900 border border-transparent hover:border-[#E8DFD5] dark:hover:border-gray-800 transition-all duration-300 hover:-translate-y-1 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg p-5">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(item.product_id); }}
                            className="absolute right-0 top-0 z-10 flex items-center justify-center transition-all text-red-500 drop-shadow-sm"
                            title="Bỏ khỏi yêu thích"
                          >
                            <Heart
                              className="h-5 w-5 fill-current"
                              strokeWidth={1.5}
                            />
                          </button>

                          <Link to={`/${item.slug || 'products/' + item.product_id}`} className="block mt-6 mb-2">
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

                          <Link to={`/${item.slug || 'products/' + item.product_id}`}>
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
                                  handleAddToCart(item);
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

              <div className="flex justify-center items-center gap-2 mt-10">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Trước
                </Button>

                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Trang {page} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Sau
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
