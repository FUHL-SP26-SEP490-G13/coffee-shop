import { Link, useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Loader2, Calendar } from "lucide-react";
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
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </>
    );
  }

  if (!news) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <p className="text-muted-foreground mb-4">Không tìm thấy bài viết</p>
          <Button variant="outline" onClick={handleBack}>
            Quay lại
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="max-w-4xl mx-auto py-12 md:py-16 px-4 md:px-6">
        <Button variant="ghost" onClick={handleBack} className="mb-6 gap-2">
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Button>

        <article className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Thumbnail lớn */}
          {news.thumbnail && (
            <div className="w-full h-[300px] md:h-[400px] overflow-hidden mb-6">
              <img
                src={news.thumbnail}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {news.title}
            </h1>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Calendar className="h-4 w-4" />
              <time>
                {new Date(news.created_at).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </div>

            {news.summary && (
              <div className="bg-muted p-4 rounded-lg mb-6 border-l-4 border-primary">
                <p className="text-sm italic">{news.summary}</p>
              </div>
            )}

            <div
              className="
    prose prose-sm max-w-none dark:prose-invert
    [&_table]:w-full
    [&_table]:border-collapse
    [&_th]:border
    [&_td]:border
    [&_th]:p-2
    [&_td]:p-2
  "
            >
              <div dangerouslySetInnerHTML={{ __html: news.content }} />
            </div>
          </div>
        </article>
        {relatedNews.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-6">Bài viết liên quan</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedNews.map((item) => (
                <Link key={item.id} to={`/news/${item.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                    {/* Thumbnail chính */}
                    {item.thumbnail && (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <h4 className="font-semibold line-clamp-2">
                        {item.title}
                      </h4>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
