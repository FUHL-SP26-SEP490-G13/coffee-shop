import { useEffect, useState } from "react";
import { Coffee, Leaf, CupSoda, UtensilsCrossed, GlassWater } from "lucide-react";
import { Link } from "react-router-dom";
import categoryService from "@/services/categoryService";

export default function CategorySection() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll({ with_count: true });
        const list = Array.isArray(res?.data) ? res.data : [];
        setCategories(list);
      } catch (error) {
        console.error("Lỗi tải danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  const getIconForCategory = (name) => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("coffee") || lower.includes("cà phê")) return Coffee;
    if (lower.includes("tea") || lower.includes("trà") || lower.includes("chà chanh") || lower.includes("thảo dược")) return Leaf;
    if (lower.includes("cake") || lower.includes("bánh")) return UtensilsCrossed;
    if (lower.includes("juice") || lower.includes("nước")) return GlassWater;
    return CupSoda;
  };

  if (categories.length === 0) return null;

  return (
    <section className="py-16 bg-[#F8F5F0]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 md:mb-12 gap-4">
          <h5 className="text-xl md:text-3xl font-semibold text-gray-900" style={{ fontFamily: 'serif' }}>
            Danh mục sản  phẩm
          </h5>
          {categories.length > 8 && (
            <Link
              to="/products"
              className="text-amber-700 hover:text-amber-800 font-medium text-sm border-b border-amber-700/30 hover:border-amber-700 transition-colors pb-0.5"
            >
              Xem tất cả danh mục &rarr;
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.slice(0, 8).map((category) => {
            const Icon = getIconForCategory(category.name);

            return (
              <Link
                to={`/products?category=${category.id}`}
                key={category.id}
                className="group bg-[#FAF9F6] rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-amber-200"
              >
                <div className="mx-auto w-16 h-16 bg-[#F2EDE4] rounded-full flex items-center justify-center mb-4 group-hover:bg-[#E8DFD3] transition-colors overflow-hidden">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name} 
                      className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.style.display = 'block';
                        }
                      }}
                    />
                  ) : null}
                  
                  <Icon 
                    className={`w-8 h-8 text-[#5C3D2E] ${category.image_url ? 'hidden' : 'block'}`} 
                    strokeWidth={1.5} 
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'serif' }}>
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {category.product_count || 0} sản phẩm
                </p>
              </Link>
            );
          })}
        </div>

        {categories.length > 8 && (
          <div className="mt-10 text-center sm:hidden">
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-amber-100 text-amber-800 rounded-full font-medium text-sm active:bg-amber-200 transition-colors"
            >
              Xem tất cả danh mục
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
