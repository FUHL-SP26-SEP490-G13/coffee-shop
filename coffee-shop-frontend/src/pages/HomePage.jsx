import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Search, Loader2, Plus } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import productService from "@/services/productService";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import newsService from "@/services/newsService";
import { Link } from "react-router-dom";
import FeaturedNews from "@/components/news/FeaturedNews";
import bannerService from "@/services/bannerService";

export default function HomePage() {
  const fetchProducts = useCallback(() => {
    return productService.getAll();
  }, []);

  const { data, loading } = useFetch(fetchProducts);
  const products = data?.data || [];

  // const fetchNews = useCallback(() => {
  //   return newsService.getFeatured();
  // }, []);

  //const { data: newsData } = useFetch(fetchNews);

  // const featuredNews = Array.isArray(newsData)
  //   ? newsData
  //   : newsData?.data || [];

  const fetchBanner = useCallback(() => {
    return bannerService.getActive();
  }, []);

  const { data: bannerData } = useFetch(fetchBanner);
  const banner = bannerData?.data ?? bannerData;

  const defaultImage =
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* ===== HERO BANNER ===== */}
      <div className="relative h-[500px] overflow-hidden">
        <img
          src={banner?.image_url || defaultImage}
          className="absolute w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-white text-center px-4">
          <h2 className="text-5xl font-bold mb-4">{banner?.title}</h2>
          <p className="text-xl mb-8">{banner?.subtitle}</p>
          {banner?.button_text && (
            <Link to={banner?.button_link || "/"}>
              <Button size="lg" className="shadow-lg">
                {banner.button_text}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* ===== MENU SECTION ===== */}
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold mb-3">Menu hôm nay</h3>
          <p className="text-muted-foreground">
            Khám phá các món đồ uống đặc biệt của chúng tôi
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 group border-border"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-56 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) =>
                      (e.target.src =
                        "https://images.unsplash.com/photo-1509042239860-f550ce710b93")
                    }
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>

                <div className="p-5">
                  <h4 className="font-semibold text-lg mb-2 line-clamp-1">
                    {product.name}
                  </h4>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                    {product.description || "Thưởng thức hương vị đặc biệt"}
                  </p>

                  <div className="flex justify-between items-center gap-2">
                    <span className="font-bold text-primary text-lg">
                      {Number(product.min_price).toLocaleString()}đ
                    </span>

                    <Button size="sm" className="gap-1.5">
                      <Plus className="w-4 h-4" />
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
