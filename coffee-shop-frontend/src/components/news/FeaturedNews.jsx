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
      <div className="bg-gradient-to-b from-background to-muted/30 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Đang tải tin tức...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!featuredNews.length) return null;

  return (
    <div className="relative bg-gradient-to-b from-background via-muted/20 to-background py-16 md:py-24 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-block">
              <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Tin tức nổi bật
              </h3>
              <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/50 rounded-full mt-2" />
            </div>
            <p className="text-muted-foreground text-lg">
              Khám phá những tin tức và sự kiện mới nhất
            </p>
          </div>

          <Link to="/news">
            <Button 
              variant="outline" 
              className="gap-2 hover:gap-3 transition-all shadow-sm hover:shadow-md border-primary/20 hover:border-primary hover:bg-primary/5 group hover:text-primary"
            >
              <span className="font-semibold">Xem tất cả</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {featuredNews.map((item, index) => (
            <Link 
              key={item.id} 
              to={`/news/${item.slug}`}
              className="group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card className="overflow-hidden h-full hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-border hover:border-primary/50 bg-card/50 backdrop-blur">
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) =>
                      (e.target.src =
                        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085")
                    }
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Featured Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-lg">
                      Nổi bật
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                      <Calendar className="h-3.5 w-3.5" />
                      <time>
                        {new Date(item.created_at).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                    </div>
                  </div>

                  <h4 className="text-xl font-bold mb-3 line-clamp-2 min-h-[56px] group-hover:text-primary transition-colors duration-300 leading-tight">
                    {item.title}
                  </h4>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 min-h-[63px] leading-relaxed">
                    {item.summary || "Khám phá nội dung thú vị trong bài viết này..."}
                  </p>

                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-4 transition-all duration-300">
                      <span>Đọc thêm</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
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
