import { useParams, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import useFetch from "@/hooks/useFetch";
import newsService from "@/services/newsService";
import Header from "../layout/Header";
import Footer from "../layout/Footer";

export default function NewsDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const fetchDetail = useCallback(() => {
    return newsService.getDetail(slug);
  }, [slug]);

  const { data } = useFetch(fetchDetail);
  const news = data?.data;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1); // quay lại trang trước
    } else {
      navigate("/news"); // fallback nếu vào trực tiếp bằng URL
    }
  };

  if (!news) return <div className="p-10">Đang tải...</div>;

  return (
    <>
      <Header />

      <div className="max-w-4xl mx-auto py-20 px-6">
        {/* Nút quay lại */}
        <button
          onClick={handleBack}
          className="mb-6 text-gray-600 hover:text-black transition flex items-center gap-2"
        >
          ← Quay lại
        </button>

        <h1 className="text-4xl font-bold mb-6">{news.title}</h1>

        {news.thumbnail && (
          <img
            src={news.thumbnail}
            alt={news.title}
            className="w-full h-96 object-cover mb-8 rounded"
          />
        )}

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: news.content }}
        />
      </div>

      <Footer />
    </>
  );
}
