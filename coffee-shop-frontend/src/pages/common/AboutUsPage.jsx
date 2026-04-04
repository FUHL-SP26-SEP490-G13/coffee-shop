import React from 'react';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Coffee, Users, Award, Sprout } from 'lucide-react';

function AboutCard({ icon, title, children }) {
  return (
    <Card className="rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-500 transition-all duration-300 p-8 bg-white dark:bg-gray-950">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-500">
          {icon}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      </div>
      <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
        {children}
      </div>
    </Card>
  );
}

export default function AboutUsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Header />
      
      <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 mb-10">
        <div className="text-center space-y-3 mt-4 mb-10">
          <h1 className="flex items-center text-primary justify-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            Về Chúng Tôi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl mx-auto">
            Hành trình từ hạt cà phê đến trải nghiệm trọn vẹn tại từng cửa hàng của chúng tôi.
          </p>
        </div>

        <div className="w-full space-y-10">
          <AboutCard icon={<Coffee />} title="1. Nguồn Gốc Cà Phê">
            <ul className="space-y-2">
              <li>• Khởi nguồn từ niềm đam mê vô tận với hạt cà phê Việt Nam.</li>
              <li>• Chúng tôi đi khắp các vùng nguyên liệu nổi tiếng từ Cầu Đất, Lâm Đồng đến Buôn Ma Thuột để tuyển chọn những hạt cà phê hảo hạng nhất.</li>
              <li>• Mỗi hạt cà phê đều được canh tác bền vững, trân trọng sức lao động của người nông dân.</li>
            </ul>
          </AboutCard>

          <AboutCard icon={<Sprout />} title="2. Quy Trình Rang Xay Chuyên Nghiệp">
            <ul className="space-y-2">
              <li>• Áp dụng kỹ thuật rang xay tiên tiến kết hợp với bí quyết truyền thống.</li>
              <li>• Quá trình kiểm soát nhiệt độ và thời gian nghiêm ngặt để khơi dậy hương vị đặc trưng nguyên bản nhất.</li>
              <li>• Cà phê luôn được phục vụ tươi mới, giữ trọn hương thơm đậm đà.</li>
            </ul>
          </AboutCard>

          <AboutCard icon={<Users />} title="3. Trải Nghiệm Khách Hàng">
            <ul className="space-y-2">
              <li>• Hàng triệu khách hàng đã tin chọn và gắn bó cùng chúng tôi qua từng năm tháng.</li>
              <li>• Không gian quán được thiết kế thân thiện, ấm cúng và đầy cảm hứng.</li>
              <li>• Các Barista luôn tận tâm chuẩn bị đồ uống bằng cả trái tim và sự chuyên nghiệp.</li>
            </ul>
          </AboutCard>

          <AboutCard icon={<Award />} title="4. Giá Trị Cốt Lõi">
            <ul className="space-y-2">
              <li>• <strong>Chất lượng:</strong> Không thỏa hiệp với những nguyên liệu kém chất lượng.</li>
              <li>• <strong>Tôn trọng:</strong> Tôn trọng tự nhiên, đối tác và khách hàng.</li>
              <li>• <strong>Sáng tạo:</strong> Không ngừng nghiên cứu và cập nhật theo xu hướng mới nhất trong ngành đồ uống.</li>
            </ul>
          </AboutCard>
        </div>
      </div>

      <div className="w-full h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

      <Footer />
    </div>
  );
}
