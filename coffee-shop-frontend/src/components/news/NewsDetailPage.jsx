import { Link, useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Loader2, Calendar, Clock, Tag, ArrowRight } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import newsService from "@/services/newsService";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NewsDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const fetchDetail = useCallback(() => {
    return newsService.getDetail(slug);
  }, [slug]);

  const { data, loading } = useFetch(fetchDetail);
  const news = data?.data;

  const [relatedNews, setRelatedNews] = useState([]);

  useEffect(() => {
    if (!news?.tag) return;
    newsService
      .getRelated({ tag: news.tag, excludeId: news.id })
      .then((res) => setRelatedNews(res?.data || []));
  }, [news?.tag, news?.id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/news");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Đang tải nội dung...</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!news) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
          <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h2 className="text-2xl font-bold">Không tìm thấy bài viết</h2>
              <p className="text-muted-foreground max-w-md">
                Bài viết này có thể đã bị xóa hoặc không tồn tại
              </p>
              <Button variant="default" onClick={handleBack} className="mt-4 hover:bg-primary/5 hover:text-primary">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Quay lại danh sách
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {/* Breadcrumb & Back Button */}
        <div className="border-b bg-muted/30">
          <div className="max-w-5xl mx-auto py-6 px-4 md:px-6">
            <Button 
              variant="ghost" 
              onClick={handleBack} 
              className="gap-2 hover:gap-3 transition-all -ml-2 hover:bg-background hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="font-medium">Quay lại danh sách</span>
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto py-8 md:py-12 px-4 md:px-6">
          <article className="space-y-8">
            {/* Article Header */}
            <div className="space-y-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                {news.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                  <Calendar className="h-4 w-4" />
                  <time>
                    {new Date(news.created_at).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
                
                {news.tag && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span>{news.tag}</span>
                  </div>
                )}
              </div>

              {/* Summary/Lead */}
              {news.summary && (
                <div className="relative pl-6 py-4 border-l-4 border-primary bg-gradient-to-r from-primary/5 to-transparent rounded-r-lg">
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium italic">
                    {news.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Featured Image */}
            {news.thumbnail && (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-border bg-muted">
                <div className="aspect-[16/9] md:aspect-[21/9]">
                  <img
                    src={news.thumbnail}
                    alt={news.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            )}

            {/* Article Content */}
            <Card className="bg-card/50 backdrop-blur border-border">
              <div className="p-6 md:p-10 lg:p-12">
                <div
                  className="
                    prose prose-base md:prose-lg max-w-none dark:prose-invert
                    prose-headings:font-bold prose-headings:tracking-tight
                    prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8
                    prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6
                    prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-5
                    prose-p:leading-relaxed prose-p:mb-4 prose-p:text-foreground/90
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                    prose-strong:text-foreground prose-strong:font-bold
                    prose-ul:my-4 prose-ol:my-4
                    prose-li:my-2 prose-li:leading-relaxed
                    prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                    prose-blockquote:border-l-4 prose-blockquote:border-primary 
                    prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:px-4 
                    prose-blockquote:rounded-r-lg prose-blockquote:italic
                    prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                    prose-pre:bg-muted prose-pre:border prose-pre:border-border
                    [&_table]:w-full [&_table]:border-collapse [&_table]:my-6
                    [&_table]:rounded-lg [&_table]:overflow-hidden [&_table]:border [&_table]:border-border
                    [&_th]:border [&_th]:border-border [&_th]:p-3 [&_th]:bg-muted [&_th]:font-semibold
                    [&_td]:border [&_td]:border-border [&_td]:p-3
                    [&_hr]:my-8 [&_hr]:border-border
                  "
                >
                  <div dangerouslySetInnerHTML={{ __html: news.content }} />
                </div>
              </div>
            </Card>

            {/* Article Footer - Tags or Share */}
            <div className="flex items-center justify-between py-6 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Cập nhật: {new Date(news.updated_at || news.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </article>

          {/* Related News Section */}
          {relatedNews.length > 0 && (
            <div className="mt-16 pt-16 border-t border-border">
              <div className="mb-8 space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold">Bài viết liên quan</h3>
                <p className="text-muted-foreground">
                  Khám phá thêm những nội dung thú vị khác
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedNews.map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/news/${item.slug}`}
                    className="group"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <Card className="overflow-hidden h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border hover:border-primary/50 bg-card/50 backdrop-blur">
                      {item.thumbnail && (
                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      )}

                      <div className="p-5 space-y-3">
                        <h4 className="text-lg font-bold line-clamp-2 min-h-[56px] group-hover:text-primary transition-colors leading-tight">
                          {item.title}
                        </h4>
                        
                        <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                          <span>Đọc thêm</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
