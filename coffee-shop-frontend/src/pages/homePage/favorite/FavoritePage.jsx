import { useEffect, useState } from "react";
import { Loader2, Heart, Search, Trash2, ShoppingBag, Coffee } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-7 h-7 text-red-500 fill-current" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Danh sách yêu thích</h1>
          </div>

          <div className="flex justify-end mb-8">

            {favorites.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleClearAll}
                className="w-full sm:w-auto text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 rounded-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa tất cả
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-6">
                <Coffee className="w-12 h-12 text-amber-500" strokeWidth={1.5} />
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
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <div className="relative h-56 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <img
                          src={image}
                          alt={item.name}
                          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500"
                          onClick={() => navigate(`/${item.slug || 'products/' + item.product_id}`)}
                        />
                        {/* Biểu tượng Heart góc phải */}
                        <button 
                          onClick={() => handleRemoveFavorite(item.product_id)}
                          className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform active:scale-95 group/btn"
                          title="Bỏ yêu thích"
                        >
                          <Heart className="w-5 h-5 text-red-500 fill-red-500 group-hover/btn:scale-110 transition-transform" />
                        </button>
                        
                        {!isStoreOpen && (
                          <div className="absolute inset-x-0 bottom-0 z-[15] bg-white/90 dark:bg-gray-900/90 py-1.5 px-3 flex justify-center border-t dark:border-gray-800 shadow-sm">
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                              {nextOpenMessage}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <p className="text-xs font-medium uppercase tracking-wider text-amber-600 mb-1">
                          {item.category_name || "Danh mục"}
                        </p>

                        <h3
                          className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[48px] cursor-pointer hover:text-amber-600 transition-colors"
                          onClick={() =>
                            navigate(`/${item.slug || 'products/' + item.product_id}`)
                          }
                        >
                          {item.name}
                        </h3>

                        <div className="flex items-end justify-between mt-4">
                          <p className="text-amber-600 font-bold text-lg">
                            {minPrice !== null
                              ? `${minPrice.toLocaleString("vi-VN")}đ`
                              : "Liên hệ"}
                          </p>
                        </div>

                        <Button
                          disabled={!isStoreOpen}
                          className="w-full mt-5 bg-gray-900 hover:bg-amber-600 text-white rounded-xl transition-colors duration-300 shadow-sm hover:shadow-amber-600/30 font-semibold disabled:bg-gray-400 disabled:opacity-100 disabled:cursor-not-allowed"
                          onClick={() => {
                            if (isStoreOpen) handleAddToCart(item);
                          }}
                        >
                          {isStoreOpen ? (
                            <>
                              <ShoppingBag className="w-4 h-4 mr-2" />
                              Thêm Ngay
                            </>
                          ) : (
                            nextOpenMessage || "Đóng cửa"
                          )}
                        </Button>
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
