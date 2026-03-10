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

  const limit = 6;

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

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
          <div className="max-w-7xl mx-auto py-16 md:py-20 px-4 md:px-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Newspaper className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Tin tức & Sự kiện
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Khám phá những câu chuyện thú vị và cập nhật tin tức mới nhất từ chúng tôi
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-12 md:py-16 px-4 md:px-6">
          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <p className="text-muted-foreground">Đang tải tin tức...</p>
              </div>
            </div>
          )}

          {!loading && newsList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                <div className="relative bg-background rounded-full p-8 border-2 border-dashed border-muted-foreground/20">
                  <Newspaper className="h-20 w-20 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mt-8 mb-3">
                Chưa có bài viết nào
              </h3>
              <p className="text-muted-foreground text-lg max-w-md">
                Vui lòng quay lại sau để xem những tin tức và sự kiện mới nhất từ chúng tôi
              </p>
            </div>
          )}

          {!loading && newsList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {newsList.map((item) => (
                <Link key={item.id} to={`/news/${item.slug}`} className="group">
                  <Card className="overflow-hidden h-full border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 bg-card/50 backdrop-blur">
                    {item.thumbnail && (
                      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    )}

                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                          <Calendar className="h-3.5 w-3.5" />
                          <time>
                            {new Date(item.created_at).toLocaleDateString(
                              "vi-VN",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </time>
                        </div>
                      </div>

                      <h2 className="text-xl font-bold mb-3 line-clamp-2 min-h-[56px] group-hover:text-primary transition-colors duration-300 leading-tight">
                        {item.title}
                      </h2>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 min-h-[63px] leading-relaxed">
                        {item.summary ||
                          "Khám phá nội dung thú vị trong bài viết này..."}
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
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-16">
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Button
                  variant="outline"
                  size="default"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Trang trước
                </Button>

                <div className="flex gap-2">
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
                        size="default"
                        onClick={() => setPage(pageNum)}
                        className={`min-w-[44px] h-11 px-4 font-semibold shadow-sm transition-all ${
                          page === pageNum ? "shadow-lg scale-110" : "hover:shadow-md"
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="default"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  Trang sau
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="text-center mt-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-medium">
                  Trang <span className="font-bold text-primary">{page}</span> / {totalPages}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
