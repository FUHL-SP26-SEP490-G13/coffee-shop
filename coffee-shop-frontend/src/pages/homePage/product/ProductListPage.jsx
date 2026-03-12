import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import productService from "@/services/productService";
import useFetch from "@/hooks/useFetch";

const PAGE_SIZE = 8;

export default function ProductListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryId = searchParams.get("category") || "";
  const keyword = searchParams.get("keyword") || "";
  const sortBy = searchParams.get("sort") || "";
  const currentPage = Number(searchParams.get("page") || 1);

  const fetchProducts = useCallback(() => {
    const params = {
      status: "available",
      page: currentPage,
      limit: PAGE_SIZE,
      sort: sortBy,
    };

    if (keyword) {
      params.keyword = keyword;
      return productService.search(params);
    }

    if (categoryId) {
      return productService.getByCategory(categoryId, params);
    }

    return productService.getAll(params);
  }, [categoryId, keyword, currentPage, sortBy]);

  const { data, loading } = useFetch(fetchProducts);

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  const products = Array.isArray(data?.data) ? data.data : [];
  const pagination = data?.pagination || {};
  const totalPages = Number(pagination.totalPages || 1);
  const page = Number(pagination.page || currentPage);

  const updateQuery = (nextValues) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(nextValues).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });

    setSearchParams(nextParams);
  };

  const handleSortChange = (value) => {
    updateQuery({
      sort: value || "",
      page: 1,
    });
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return;

    updateQuery({
      page: nextPage,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Danh sách sản phẩm
              </h1>
              <p className="text-gray-500 mt-1">
                {keyword
                  ? `Kết quả tìm kiếm cho "${keyword}"`
                  : categoryId
                  ? "Sản phẩm theo danh mục"
                  : "Tất cả sản phẩm"}
              </p>
            </div>

            <div className="w-full sm:w-72">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
              >
                <option value="">Sắp xếp mặc định</option>
                <option value="name_asc">A - Z</option>
                <option value="name_desc">Z - A</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              Không có sản phẩm nào
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((item) => {
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

                        <div className="flex items-center justify-between mt-4">
                          <p className="text-amber-600 font-bold text-lg">
                            {minPrice !== null
                              ? `${minPrice.toLocaleString("vi-VN")}đ`
                              : "Liên hệ"}
                          </p>

                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/products/${item.id}`);
                            }}
                          >
                            Thêm
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Trước
                </Button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === page ? "default" : "outline"}
                    onClick={() => handlePageChange(pageNumber)}
                    className={
                      pageNumber === page
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : ""
                    }
                  >
                    {pageNumber}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
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
