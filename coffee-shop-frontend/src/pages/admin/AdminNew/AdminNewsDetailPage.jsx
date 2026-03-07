import { useParams, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import {
  Loader2,
  ChevronLeft,
  Edit,
  CalendarDays,
  Eye,
  Tag,
  FileText,
} from "lucide-react";
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
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="p-6">
        <div className="max-w-5xl mx-auto bg-card border border-border rounded-2xl p-10 text-center shadow-sm">
          <p className="text-muted-foreground mb-4">Không tìm thấy bài viết</p>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/news-list")}
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Top action */}
      <div className="max-w-5xl mx-auto flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2 rounded-xl"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </Button>

        <Button
          onClick={() => navigate(`/admin/edit-news/${news.id}`)}
          className="gap-2 rounded-xl"
        >
          <Edit className="h-4 w-4" />
          Chỉnh sửa
        </Button>
      </div>

      {/* Main card */}
      <div className="max-w-5xl mx-auto bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 text-primary mb-3">
            <FileText className="h-5 w-5" />
            <span className="text-sm font-medium">Chi tiết bài viết</span>
          </div>

          <h1 className="text-1lg md:text-1lg leading-tight text-foreground mb-4 break-words">
            Tiêu đề: {news.title}
          </h1>

          <div className="flex flex-wrap gap-3 text-sm">
            {news.tag && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium break-all">
                <Tag className="h-4 w-4 shrink-0" />
                <span>{news.tag}</span>
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-foreground">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>
                {new Date(
                  news.updated_at || news.created_at
                ).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-foreground">
              <Eye className="h-4 w-4 shrink-0" />
              <span>{news.views ?? 0} lượt xem</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-8">
          {/* Thumbnail */}
          {news.thumbnail && (
            <div className="flex justify-center mb-6">
              <img
                src={news.thumbnail}
                alt={news.title}
                className="max-h-72 max-w-xl w-full object-cover rounded-xl border border-border shadow-sm"
              />
            </div>
          )}

          {/* Summary */}
          {news.summary && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <h3 className="text-base font-semibold mb-2 text-primary">
                Tóm tắt bài viết
              </h3>
              <p className="text-sm md:text-base text-foreground leading-7 italic break-words [overflow-wrap:anywhere]">
                {news.summary}
              </p>
            </div>
          )}

          {/* Content */}
          <div className="rounded-2xl border border-border bg-background p-5 md:p-7 overflow-hidden">
            <h3 className="text-lg font-semibold mb-5">Nội dung bài viết</h3>

            <div
              className="
                prose prose-sm md:prose-base max-w-none dark:prose-invert
                prose-headings:font-bold
                prose-p:leading-7
                prose-img:rounded-xl
                prose-img:shadow-sm
                prose-a:text-primary
                prose-table:w-full
                prose-table:border-collapse
                prose-th:border
                prose-td:border
                prose-th:p-3
                prose-td:p-3
                prose-blockquote:border-l-4
                prose-blockquote:border-primary
                prose-blockquote:pl-4
                break-words
                [overflow-wrap:anywhere]
                [word-break:break-word]
              "
            >
              <div dangerouslySetInnerHTML={{ __html: news.content }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
