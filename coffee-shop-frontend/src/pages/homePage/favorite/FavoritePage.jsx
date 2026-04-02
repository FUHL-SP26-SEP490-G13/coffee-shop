import { useEffect, useState } from "react";
import { Loader2, Heart, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import favoriteService from "@/services/favoriteService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 8;

export default function FavoritePage() {
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [initialized, setInitialized] = useState(false);

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  // debounce keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchFavorites = async () => {
    try {
      if (!initialized) {
        setLoading(true);
      }

      const res = await favoriteService.getMyFavorites({
        page,
        limit: PAGE_SIZE,
        keyword: debouncedKeyword.trim(),
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
  }, [page, debouncedKeyword]);

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

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Header />

      <section className="w-full px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-7 h-7 text-red-500 fill-current" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Danh sách yêu thích</h1>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="flex-1 relative">
              <Input
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm theo tên sản phẩm..."
                className="pr-12"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Không có sản phẩm yêu thích phù hợp
              </p>
              <Button onClick={() => navigate("/products")}>
                Xem sản phẩm
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {favorites.map((item) => {
                  const itemSizes = Array.isArray(item.sizes) ? item.sizes : [];
                  const image = item.image_url || defaultImage;

                  const minPrice =
                    itemSizes.length > 0
                      ? Math.min(...itemSizes.map((s) => Number(s.price)))
                      : null;

                  return (
                    <div
                      key={item.product_id}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition"
                    >
                      <div
                        className="h-56 bg-gray-100 dark:bg-gray-800 cursor-pointer"
                        onClick={() => navigate(`/${item.slug || 'products/' + item.product_id}`)}
                      >
                        <img
                          src={image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                          {item.category_name || "Danh mục"}
                        </p>

                        <h3
                          className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[48px] cursor-pointer"
                          onClick={() =>
                            navigate(`/${item.slug || 'products/' + item.product_id}`)
                          }
                        >
                          {item.name}
                        </h3>

                        <p className="text-amber-600 font-bold text-lg mt-3">
                          {minPrice !== null
                            ? `${minPrice.toLocaleString("vi-VN")}đ`
                            : "Liên hệ"}
                        </p>

                        <Button
                          variant="outline"
                          className="w-full mt-4 border-red-500 text-red-500 hover:bg-red-50"
                          onClick={() => handleRemoveFavorite(item.product_id)}
                        >
                          Bỏ yêu thích
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
