import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ProductListPage from "../homePage/product/ProductListPage";
import ProductDetailPage from "../homePage/product/ProductDetailPage";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function GenericSlugResolver() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/public/slugs/${slug}`)
      .then(res => res.json())
      .then(json => {
         if(json.success) {
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
