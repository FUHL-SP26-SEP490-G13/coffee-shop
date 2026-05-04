import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Newspaper,
} from "lucide-react";
import newsService from "@/services/newsService";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NewsListPage() {
  useDocumentTitle("Tin tức");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [loading, setLoading] = useState(false);

  const limit = 6;

  useEffect(() => {
    newsService.getFeatured({ limit: 5 }).then(res => {
       setFeaturedNews(Array.isArray(res?.data) ? res.data : (res?.data?.items || []));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await newsService.getAll({ page, limit });
      setData(res.data);
      setLoading(false);
    };

    fetchData();
  }, [page]);

  const newsList = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-2 md:pt-4 pb-10 md:pb-16 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 min-h-[50px]">
          <div className="text-base md:text-lg text-gray-500 dark:text-gray-400 flex items-center flex-wrap gap-2 font-medium">
            <Link to="/" className="cursor-pointer hover:text-amber-600 transition-colors">Trang chủ</Link>
            <span className="text-gray-400">/</span>
            <span className="text-amber-600 font-bold">Tin tức</span>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Main Content: News Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
              </div>
            ) : newsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Newspaper className="h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Chưa có bài viết nào</h3>
                <p className="text-gray-500 dark:text-gray-400">Vui lòng quay lại sau để xem những tin tức mới nhất.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
                {newsList.map((item) => (
                  <Link key={item.id} to={`/news/${item.slug}`} className="group flex flex-col">
                    {item.thumbnail && (
                      <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800 mb-4">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="flex flex-col flex-1 space-y-2">
                      <h2 className="text-[17px] font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-600 transition-colors uppercase leading-snug line-clamp-2">
                        {item.title}
                      </h2>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 mr-2">Coffee Shop</span>
                        {new Date(item.created_at).toLocaleDateString("vi-VN", {
                          weekday: "long",
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                        })}
                      </div>
                      <p className="text-sm text-amber-600 mt-2 hover:underline">
                        Đọc tiếp
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2 flex-wrap">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                </Button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    onClick={() => setPage(pageNum)}
                    className={pageNum === page ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                  >
                    {pageNum}
                  </Button>
                ))}
                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Sau <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar: TIN NỔI BẬT */}
          <div className="w-full lg:w-[320px] flex-shrink-0">
             <div className="lg:sticky lg:top-24 space-y-6">
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 uppercase pb-3 border-b border-gray-200 dark:border-gray-800">
                  Tin nổi bật
                </h3>
                <div className="flex flex-col gap-5">
                  {featuredNews.map(item => (
                    <Link key={item.id} to={`/news/${item.slug}`} className="flex gap-4 group">
                        <div className="w-24 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[13px] font-bold text-gray-800 dark:text-gray-200 group-hover:text-amber-600 transition-colors line-clamp-3 uppercase leading-snug">
                            {item.title}
                          </h4>
                        </div>
                    </Link>
                  ))}
                  {featuredNews.length === 0 && (
                    <p className="text-sm text-gray-500">Đang cập nhật...</p>
                  )}
                </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
