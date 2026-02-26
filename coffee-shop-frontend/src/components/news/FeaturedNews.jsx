import { useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, Loader2 } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import newsService from "@/services/newsService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FeaturedNews() {
  const fetchNews = useCallback(() => {
    return newsService.getFeatured();
  }, []);

  const { data: newsData, loading } = useFetch(fetchNews);

  const featuredNews = newsData?.data || [];

  if (loading) {
    return (
      <div className="bg-muted/30 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!featuredNews.length) return null;

  return (
    <div className="bg-muted/30 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h3 className="text-3xl md:text-4xl font-bold mb-2">Tin tức nổi bật</h3>
            <p className="text-muted-foreground">Cập nhật những tin tức mới nhất từ Coffee Shop</p>
          </div>

          <Link to="/news">
            <Button variant="ghost" className="gap-2 text-primary">
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredNews.map((item) => (
            <Link key={item.id} to={`/news/${item.slug}`}>
              <Card className="group overflow-hidden h-full hover:shadow-lg transition-all duration-300 border-border">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) =>
                      (e.target.src =
                        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085")
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <Calendar className="h-3 w-3" />
                    <time>
                      {new Date(item.created_at).toLocaleDateString("vi-VN")}
                    </time>
                  </div>

                  <h4 className="text-lg font-semibold mb-3 line-clamp-2 min-h-[56px] group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 min-h-[60px]">
                    {item.summary || "Đọc bài viết để biết thêm chi tiết..."}
                  </p>

                  <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                    Đọc tiếp
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
