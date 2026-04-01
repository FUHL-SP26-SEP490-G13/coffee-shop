import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ProductListPage from "../homePage/product/ProductListPage";
import ProductDetailPage from "../homePage/product/ProductDetailPage";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const slugCache = {};

export default function GenericSlugResolver() {
  const { slug } = useParams();
  const [data, setData] = useState(slugCache[slug]?.data || null);
  const [type, setType] = useState(slugCache[slug]?.type || null);
  const [loading, setLoading] = useState(!slugCache[slug]);

  useEffect(() => {
    if (slugCache[slug]) {
       setData(slugCache[slug].data);
       setType(slugCache[slug].type);
       setLoading(false);
       return;
    }

    setLoading(true);
    fetch(`http://localhost:5000/api/public/slugs/${slug}`)
      .then(res => res.json())
      .then(json => {
         if(json.success) {
            slugCache[slug] = { data: json.data, type: json.type };
            setData(json.data);
            setType(json.type);
         } else {
            setData(null);
            setType(null);
         }
      })
      .catch(() => { setData(null); setType(null); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
     return (
       <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
         <Header />
         <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
         </div>
         <Footer />
       </div>
     );
  }

  if (!data) return <Navigate to="/404" />;

  if (type === 'category') {
    return <ProductListPage categoryIdOverride={data.id} categoryName={data.name} categorySlug={data.slug} />;
  }
  
  if (type === 'product') {
    return <ProductDetailPage productIdOverride={data.id} productData={data} />;
  }

  return <Navigate to="/404" />;
}
