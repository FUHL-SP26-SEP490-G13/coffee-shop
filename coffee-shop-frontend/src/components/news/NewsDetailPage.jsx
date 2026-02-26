import { useParams, useNavigate } from "react-router-dom";
import { useCallback } from "react";
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
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Button>

        <article className="bg-card rounded-xl border border-border overflow-hidden">
          {news.thumbnail && (
            <div className="w-full h-[300px] md:h-[400px] overflow-hidden">
              <img
                src={news.thumbnail}
                alt={news.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{news.title}</h1>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Calendar className="h-4 w-4" />
              <time>
                {new Date(news.created_at).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </time>
            </div>

            {news.summary && (
              <div className="bg-muted p-4 rounded-lg mb-6 border-l-4 border-primary">
                <p className="text-sm italic">{news.summary}</p>
              </div>
            )}

            <div
              className="prose prose-sm md:prose-base max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />
          </div>
        </article>
      </div>

      <Footer />
    </>
  );
}
