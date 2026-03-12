import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function BestSellerSection({
  loading,
  products = [],
  getThumbnail,
  getDisplayPrice,
}) {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14 sm:mb-20">
          <p className="text-amber-600 text-2xl sm:text-xl lg:text-2xl font-bold tracking-widest uppercase mb-3">
            Menu Đặc Sắc
          </p>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Khám phá những lựa chọn tuyệt vời được chọn lựa kỹ lưỡng cho bạn
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
              <p className="text-gray-600">Đang tải sản phẩm...</p>
            </div>
          </div>
        )}

        {!loading && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Sản phẩm bán chạy
                </h2>
                <p className="text-sm text-gray-500">
                  Những món được khách hàng yêu thích nhất
                </p>
              </div>

              <Link to="/products">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white px-6">
                  Xem tất cả
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="group h-full transition-all duration-300"
                  style={{
                    animation: `fadeInUp 0.6s ease-out ${index * 0.08}s both`,
                  }}
                >
                  <Card className="overflow-hidden h-full flex flex-col bg-white border border-gray-200 shadow-md hover:shadow-xl transition">
                    <Link to={`/products/${product.id}`} className="block">
                      <div className="relative h-56 bg-gray-100 overflow-hidden">
                        <img
                          src={getThumbnail(product)}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition duration-500"
                          onError={(e) => {
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1509042239860-f550ce710b93";
                          }}
                        />
                      </div>
                    </Link>

                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {product.category_name || "Danh mục"}
                        </p>
                      </div>

                      <Link to={`/products/${product.id}`}>
                        <h3 className="font-bold text-lg text-gray-900 mb-2 hover:text-amber-600 transition line-clamp-2">
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
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">
              Hiện chưa có sản phẩm. Vui lòng quay lại sau!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
