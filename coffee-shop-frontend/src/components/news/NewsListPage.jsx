import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, ChevronLeft, ChevronRight, Calendar, ArrowRight, Newspaper } from "lucide-react";
import newsService from "@/services/newsService";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NewsListPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const limit = 9;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      const res = await newsService.getAll({ page, limit });
      setData(res.data);
      setLoading(false);
    };

    fetchData();
  }, [page]);

  const newsList = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <>
      <Header />

      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto py-12 md:py-16 px-4 md:px-6">
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Tin tức & Sự kiện</h1>
            <p className="text-muted-foreground">Cập nhật những tin tức mới nhất từ Coffee Shop</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && newsList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Newspaper className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có bài viết nào</h3>
              <p className="text-muted-foreground">Vui lòng quay lại sau để xem tin tức mới nhất</p>
            </div>
          )}

          {!loading && newsList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsList.map((item) => (
                <Link key={item.id} to={`/news/${item.slug}`} className="group">
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full border-border">
                    {item.thumbnail && (
                      <div className="relative h-48 overflow-hidden bg-muted">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) =>
                            (e.target.src =
                              "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085")
                          }
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}
                    
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="h-3 w-3" />
                        <time>
                          {new Date(item.created_at).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </time>
                      </div>

                      <h2 className="text-lg font-semibold mb-3 line-clamp-2 min-h-[56px] group-hover:text-primary transition-colors">
                        {item.title}
                      </h2>
                      
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
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-12">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Trước
                </Button>

                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-10 h-10 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="text-center mt-4 text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
