import { useCallback } from "react";
import { Link } from "react-router-dom";
import useFetch from "@/hooks/useFetch";
import newsService from "@/services/newsService";

export default function FeaturedNews() {
  const fetchNews = useCallback(() => {
    return newsService.getFeatured();
  }, []);

  const { data: newsData } = useFetch(fetchNews);

  const featuredNews = newsData?.data || [];

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center mb-14">
          <h3 className="text-4xl font-bold">Tin tức nổi bật</h3>

          <Link
            to="/news"
            className="text-[#b71c1c] font-medium hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {featuredNews.map((item) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition bg-white"
            >
              <div className="h-64 overflow-hidden">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                />
              </div>

              <div className="p-6">
                <h4 className="text-xl font-semibold mb-3">
                  {item.title}
                </h4>

                <p className="text-gray-500 text-sm mb-4">
                  {item.summary}
                </p>

                <Link
                  to={`/news/${item.slug}`}
                  className="text-[#b71c1c] font-medium hover:underline"
                >
                  Đọc tiếp →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
