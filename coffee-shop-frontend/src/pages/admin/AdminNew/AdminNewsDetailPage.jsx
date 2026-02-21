import { useParams, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { Loader2, ChevronLeft, Edit } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import newsService from "@/services/newsService";
import { Button } from "@/components/ui/button";

export default function AdminNewsDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const fetchDetail = useCallback(() => {
    return newsService.getDetail(slug);
  }, [slug]);

  const { data, loading } = useFetch(fetchDetail);
  const news = data?.data;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Không tìm thấy bài viết</p>
        <Button variant="outline" onClick={() => navigate("/admin/news-list")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <Button
          onClick={() => navigate(`/admin/edit-news/${news.id}`)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">{news.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Cập nhật: {new Date(news.updated_at || news.created_at).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </p>
        
        {news.thumbnail && (
          <img
            src={news.thumbnail}
            alt={news.title}
            className="w-full max-h-96 object-cover rounded-lg mb-6 border border-border"
          />
        )}
        
        {news.summary && (
          <div className="bg-muted p-4 rounded-lg mb-6 border-l-4 border-primary">
            <p className="text-sm italic text-foreground">{news.summary}</p>
          </div>
        )}
        
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: news.content }} />
        </div>
      </div>
    </div>
  );
}
