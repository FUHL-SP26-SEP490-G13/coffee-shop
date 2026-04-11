import { Link, useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  Loader2,
  Calendar,
  Clock,
  Tag,
  ArrowRight,
} from "lucide-react";
import useFetch from "@/hooks/useFetch";
import newsService from "@/services/newsService";


import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NewsDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const fetchDetail = useCallback(() => {
    return newsService.getDetail(slug);
  }, [slug]);

  const { data, loading } = useFetch(fetchDetail);
  const news = data?.data;
  useDocumentTitle(news?.title || "Tin tức");

  const [relatedNews, setRelatedNews] = useState([]);

  useEffect(() => {
    if (!news?.tag) return;
    newsService
      .getRelated({ tag: news.tag, excludeId: news.id })
      .then((res) => setRelatedNews(res?.data || []));
  }, [news?.tag, news?.id]);

  const handleBack = () => {
    // if (window.history.length > 1) {
    //   navigate(-1);
    // } else {
    navigate("/news");
    //}
  };

  // removed full-page loading

  if (!news) {
    return (
      <>
        
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
              <Button
                variant="default"
                onClick={handleBack}
                className="mt-4 hover:bg-primary/5 hover:text-primary"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Danh sách
              </Button>
            </div>
          </div>
        </div>
        
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-2 md:pt-4 pb-10 md:pb-16 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 min-h-[50px]">
          <div className="text-base md:text-lg text-gray-500 dark:text-gray-400 flex items-center flex-wrap gap-2 font-medium">
            <Link to="/" className="cursor-pointer hover:text-amber-600 transition-colors">Trang chủ</Link>
            <span className="text-gray-400">/</span>
            <Link to="/news" className="cursor-pointer hover:text-amber-600 transition-colors">Tin tức</Link>
            <span className="text-gray-400">/</span>
            <span className="text-amber-600 font-bold line-clamp-1 break-all text-ellipsis max-w-[200px] sm:max-w-sm md:max-w-md lg:max-w-xl">{news.title}</span>
          </div>
        </div>
          
        <div className="flex flex-col lg:flex-row gap-10">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex items-center justify-center min-h-[50vh]">
                  <Loader2 className="h-10 w-10 animate-spin text-amber-600 mx-auto" />
                </div>
              ) : (
              <article className="space-y-8">
                {/* Article Header */}
                <div className="space-y-6">

                  <h4 className="text-lg md:text-xl font-bold leading-snug tracking-tight">
                    {news.title}
                  </h4>

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

                </div>

                {/* Featured Image */}
                {news.thumbnail && (
                  <div className="relative w-full aspect-video md:aspect-[16/7] flex items-center justify-center rounded-2xl overflow-hidden shadow-xl border border-border bg-muted">
                    <img
                      src={news.thumbnail}
                      alt={news.title}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Summary/Lead */}
                {news.summary && (
                  <div className="relative pl-6 py-3 border-l-4 border-primary bg-gradient-to-r from-primary/5 to-transparent rounded-r-lg">
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed italic">
                      {news.summary}
                    </p>
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
              </article>
              )}
            </div>

            {/* Sidebar: Related News */}
            <div className="w-full lg:w-[320px] flex-shrink-0">
              {relatedNews.length > 0 && (
                <div className="lg:sticky lg:top-24 space-y-6 mt-10 lg:mt-0">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 uppercase pb-3 border-b border-gray-200 dark:border-gray-800">
                    Bài viết liên quan
                  </h3>
                  <div className="flex flex-col gap-5">
                    {relatedNews.map((item) => (
                      <Link
                        key={item.id}
                        to={`/news/${item.slug}`}
                        className="flex gap-4 group"
                      >
                        <div className="w-24 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          {item.thumbnail && (
                             <img
                               src={item.thumbnail}
                               alt={item.title}
                               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                             />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[13px] font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-600 transition-colors line-clamp-3 uppercase leading-snug">
                            {item.title}
                          </h4>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
      </main>

      
    </div>
  );
}
