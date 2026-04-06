import React from 'react';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Coffee, Users, Award, Sprout } from 'lucide-react';

function AboutSection({ icon, title, children, image, imageLeft }) {
  return (
    <div className={`flex flex-col gap-8 md:gap-16 items-center ${imageLeft ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
      
      {/* Content Side */}
      <div className="flex-1 space-y-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="mt-1 p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-500 shadow-sm shrink-0 [&>svg]:w-5 [&>svg]:h-5">
            {icon}
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
            {title}
          </h2>
        </div>
        <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          {children}
        </div>
      </div>

      {/* Image Side */}
      <div className="flex-1 w-full">
        <div className="relative group rounded-3xl overflow-hidden shadow-2xl">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-[300px] md:h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 border-4 border-white/20 dark:border-gray-900/20 rounded-3xl pointer-events-none mix-blend-overlay"></div>
        </div>
      </div>
      
    </div>
  );
}

export default function AboutUsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />
      
      <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 mb-10 overflow-hidden">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-20 animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <h1 className="text-2xl md:text-3xl font-semibold text-amber-900 dark:text-amber-500" style={{ fontFamily: 'serif' }}>
            Về chúng tôi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto pt-4 leading-relaxed">
            Hành trình từ hạt cà phê đến trải nghiệm trọn vẹn tại từng cửa hàng của chúng tôi, mang đến hương vị đậm đà và không gian truyền cảm hứng.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-24">
          <AboutSection 
            icon={<Coffee className="w-6 h-6" />} 
            title="Nguồn Gốc Cà Phê"
            image="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop"
            imageLeft={false}
          >
            <ul className="space-y-4">
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> Khởi nguồn từ niềm đam mê vô tận với hạt cà phê Việt Nam.</li>
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> Chúng tôi đi khắp các vùng nguyên liệu nổi tiếng từ Cầu Đất, Lâm Đồng đến Buôn Ma Thuột để tuyển chọn những hạt cà phê hảo hạng nhất.</li>
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> Mỗi hạt cà phê đều được canh tác bền vững, trân trọng sức lao động của người nông dân.</li>
            </ul>
          </AboutSection>

          <AboutSection 
            icon={<Sprout className="w-6 h-6" />} 
            title="Quy Trình Rang Xay Chuyên Nghiệp"
            image="https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=800&auto=format&fit=crop"
            imageLeft={true}
          >
            <ul className="space-y-4">
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> Áp dụng kỹ thuật rang xay tiên tiến kết hợp với bí quyết truyền thống.</li>
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> Quá trình kiểm soát nhiệt độ và thời gian nghiêm ngặt để khơi dậy hương vị đặc trưng nguyên bản nhất.</li>
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> Cà phê luôn được phục vụ tươi mới, giữ trọn hương thơm đậm đà.</li>
            </ul>
          </AboutSection>

          <AboutSection 
            icon={<Users className="w-6 h-6" />} 
            title="Trải Nghiệm Khách Hàng"
            image="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop"
            imageLeft={false}
          >
            <ul className="space-y-4">
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> Hàng triệu khách hàng đã tin chọn và gắn bó cùng chúng tôi qua từng năm tháng.</li>
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> Không gian quán được thiết kế thân thiện, ấm cúng và đầy cảm hứng.</li>
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> Các Barista luôn tận tâm chuẩn bị đồ uống bằng cả trái tim và sự chuyên nghiệp.</li>
            </ul>
          </AboutSection>

          <AboutSection 
            icon={<Award className="w-6 h-6" />} 
            title="Giá Trị Cốt Lõi"
            image="https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=800&auto=format&fit=crop"
            imageLeft={true}
          >
            <ul className="space-y-4">
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> <strong>Chất lượng:</strong> Không thỏa hiệp với những nguyên liệu kém chất lượng.</li>
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> <strong>Tôn trọng:</strong> Tôn trọng tự nhiên, đối tác và khách hàng.</li>
              <li className="flex gap-3"><span className="text-amber-500 font-bold">•</span> <strong>Sáng tạo:</strong> Không ngừng nghiên cứu và cập nhật theo xu hướng mới nhất trong ngành đồ uống.</li>
            </ul>
          </AboutSection>
        </div>

      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent my-10" />

      <Footer />
    </div>
  );
}
