import { useCallback } from "react";
import { Link } from "react-router-dom";
import useFetch from "@/hooks/useFetch";
import newsService from "@/services/newsService";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
export default function NewsListPage() {
  const fetchNews = useCallback(() => {
    return newsService.getAll();
  }, []);

  const { data } = useFetch(fetchNews);

  const newsList = data?.data || [];

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto py-20 px-6">
        <h1 className="text-4xl font-bold mb-12">Tất cả tin tức</h1>

        <div className="space-y-10">
          {newsList.map((item) => (
            <div key={item.id} className="border-b pb-6">
              <h2 className="text-2xl font-semibold mb-2">{item.title}</h2>

              <p className="text-gray-600 mb-4">{item.summary}</p>

              <Link
                to={`/news/${item.slug}`}
                className="text-[#b71c1c] hover:underline"
              >
                Đọc tiếp →
              </Link>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
