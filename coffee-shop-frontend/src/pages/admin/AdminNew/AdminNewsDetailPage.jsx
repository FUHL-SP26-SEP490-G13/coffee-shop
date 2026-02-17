import { useParams, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import useFetch from "@/hooks/useFetch";
import newsService from "@/services/newsService";

export default function AdminNewsDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const fetchDetail = useCallback(() => {
    return newsService.getDetail(slug);
  }, [slug]);

  const { data } = useFetch(fetchDetail);
  const news = data?.data;

  if (!news) return <div>Đang tải...</div>;

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-gray-600 hover:text-black transition"
      >
        ← Quay lại
      </button>

      <h1 className="text-3xl font-bold mb-6">{news.title}</h1>
      {news.thumbnail && (
        <img
          src={news.thumbnail}
          alt={news.title}
          className="w-full rounded mb-6"
        />
      )}
      <div dangerouslySetInnerHTML={{ __html: news.content }} />
    </div>
  );
}
