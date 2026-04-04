import React from "react";
import { useNavigate } from "react-router-dom";

export default function BrandStorySection() {
  const navigate = useNavigate();

  return (
    <section className="py-8 md:py-12 bg-white dark:bg-gray-950">
      <div className="w-full px-4 lg:px-6 xl:px-8">
        <div className="bg-[#FAFAFA] dark:bg-gray-900/50 rounded-none sm:rounded-3xl py-12 md:py-16 px-4 sm:px-8 lg:px-16 w-full">
          <div className="max-w-[1100px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-semibold text-amber-900 dark:text-amber-500" style={{ fontFamily: 'serif' }}>
              Từ hạt cà phê đến trải nghiệm trọn vẹn
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed text-justify lg:text-left">
              Chúng tôi ra đời với sứ mệnh mang đến ly cà phê nguyên chất, được chọn lọc từ những vùng trồng tốt nhất Việt Nam. Chúng tôi tin rằng mỗi ly cà phê không chỉ là thức uống, mà là một trải nghiệm – nơi hương vị hòa quyện cùng không gian ấm cúng.
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg leading-relaxed text-justify lg:text-left">
              Với đội ngũ barista chuyên nghiệp và quy trình rang xay tiêu chuẩn, chúng tôi cam kết chất lượng ở mỗi giọt cà phê.
            </p>
            <div className="pt-4">
              <button
                onClick={() => navigate("/about-us")}
                className="inline-flex items-center justify-center px-8 py-3.5 bg-[#8C522D] hover:bg-[#734224] text-white font-medium rounded-xl transition-colors shadow-lg shadow-[#8C522D]/20"
              >
                Tìm hiểu thêm
              </button>
            </div>
            </div>
            
            <div className="flex-1 w-full relative">
              <div className="aspect-[4/3] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(140,82,45,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <img 
                  src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop" 
                  alt="Store Interior" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-200/40 dark:bg-amber-900/20 rounded-full -z-10 blur-2xl"></div>
              <div className="absolute -top-8 -right-8 w-40 h-40 bg-orange-200/40 dark:bg-orange-900/20 rounded-full -z-10 blur-3xl"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
