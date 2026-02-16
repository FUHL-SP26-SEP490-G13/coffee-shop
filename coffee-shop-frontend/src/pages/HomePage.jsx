import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import productService from "@/services/productService";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import newsService from "@/services/newsService";
import { Link } from "react-router-dom";
import FeaturedNews from "@/components/news/FeaturedNews";

export default function HomePage() {
  const fetchProducts = useCallback(() => {
    return productService.getAll();
  }, []);

  const { data, loading } = useFetch(fetchProducts);
  const products = data?.data || [];

  const fetchNews = useCallback(() => {
    return newsService.getFeatured();
  }, []);

  const { data: newsData } = useFetch(fetchNews);
  console.log("newsData:", newsData);

  const featuredNews = Array.isArray(newsData)
    ? newsData
    : newsData?.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* ===== HERO BANNER ===== */}
      <div className="relative h-[500px]">
        <img
          src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085"
          className="absolute w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-white text-center">
          <h2 className="text-5xl font-bold mb-6">
            Thưởng thức cà phê chuẩn vị
          </h2>
          <Button className="bg-[#b71c1c] hover:bg-[#8e0000] px-8 py-6 text-lg">
            Xem menu
          </Button>
        </div>
      </div>

      {/* ===== MENU SECTION ===== */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-3xl font-bold mb-12 text-center">Menu hôm nay</h3>

        {loading && <div className="text-center">Đang tải...</div>}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-xl transition duration-300 border-none"
              >
                <img
                  src={product.image_url}
                  className="h-64 w-full object-cover"
                  onError={(e) =>
                    (e.target.src =
                      "https://images.unsplash.com/photo-1509042239860-f550ce710b93")
                  }
                />

                <div className="p-6">
                  <h4 className="font-semibold text-lg mb-2">{product.name}</h4>

                  <p className="text-sm text-gray-500 mb-4">
                    {product.description}
                  </p>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#b71c1c]">
                      {Number(product.min_price).toLocaleString()} đ
                    </span>

                    <Button
                      size="sm"
                      className="bg-[#b71c1c] hover:bg-[#8e0000]"
                    >
                      Thêm
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ===== TIN TỨC NỔI BẬT ===== */}
      <FeaturedNews />

      <Footer />
    </div>
  );
}
