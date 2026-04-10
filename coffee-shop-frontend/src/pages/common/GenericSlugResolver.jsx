import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ProductListPage from "../homePage/product/ProductListPage";
import ProductDetailPage from "../homePage/product/ProductDetailPage";



export const slugCache = {};

export default function GenericSlugResolver() {
  const { slug } = useParams();

  // Bắt cache đồng bộ ngay khi đổi URL để tránh giật frame
  let syncData = null;
  let syncType = null;
  let syncLoading = false;

  if (slug === 'products') {
    syncType = 'all_products';
  } else if (slugCache[slug]) {
    syncData = slugCache[slug].data;
    syncType = slugCache[slug].type;
  } else {
    syncLoading = true;
  }

  const [asyncData, setData] = useState(syncData);
  const [asyncType, setType] = useState(syncType);
  const [asyncLoading, setLoading] = useState(syncLoading);

  const data = syncData || asyncData;
  const type = syncType || asyncType;
  const loading = syncLoading === false ? false : asyncLoading;

  // LƯU LẠI giao diện cũ để hiển thị mờ trong lúc chờ API (Stale-while-revalidate ở cấp độ Route)
  const [lastGoodProps, setLastGoodProps] = useState(null);

  useEffect(() => {
    if (!loading && type) {
      setLastGoodProps({ type, data });
    }
  }, [loading, type, data]);

  useEffect(() => {
    if (slug === 'products' || slugCache[slug]) return;

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

  const isTransitioning = loading && !!lastGoodProps;

  // Nếu đang loading mà chưa có giao diện cũ (VD: truy cập thẳng link mới từ bên ngoài)
  if (loading && !lastGoodProps) {
     return (
       <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
         <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
         </div>
       </div>
     );
  }

  // Xác định dữ liệu sẽ hiển thị (nếu đang load thì lấy cái cũ giả lập)
  const renderType = isTransitioning ? lastGoodProps.type : type;
  const renderData = isTransitioning ? lastGoodProps.data : data;

  const renderContent = () => {
    if (renderType === 'all_products') {
      return <ProductListPage />;
    }
    if (!renderData && !isTransitioning) {
      return <Navigate to="/404" />;
    }
    if (renderType === 'category') {
      return <ProductListPage categoryIdOverride={renderData.id} categoryName={renderData.name} categorySlug={renderData.slug} />;
    }
    if (renderType === 'product') {
      return <ProductDetailPage productIdOverride={renderData.id} initialProductData={renderData} />;
    }
    return <Navigate to="/404" />;
  };

  return (
    <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-50 pointer-events-none' : ''}`}>
      {renderContent()}
    </div>
  );
}
