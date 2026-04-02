import { Coffee, Ticket, Truck } from "lucide-react";

export default function OrderGuideSection() {
  const steps = [
    {
      id: "01",
      title: "Chọn món yêu thích",
      description: "Duyệt menu đa dạng và thêm vào giỏ hàng",
      icon: <Coffee className="w-8 h-8 text-amber-900 dark:text-amber-500" strokeWidth={2} />,
    },
    {
      id: "02",
      title: "Áp mã ưu đãi",
      description: "Nhập mã giảm giá để tiết kiệm hơn",
      icon: <Ticket className="w-8 h-8 text-amber-900 dark:text-amber-500" strokeWidth={2} />,
    },
    {
      id: "03",
      title: "Nhận hàng nhanh chóng",
      description: "Giao tận nơi hoặc nhận tại cửa hàng",
      icon: <Truck className="w-8 h-8 text-amber-900 dark:text-amber-500" strokeWidth={2} />,
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-[#F4EBE1] dark:bg-[#1f1917]">
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-amber-900 dark:text-amber-500 mb-3" style={{ fontFamily: 'serif' }}>
            Đặt hàng dễ dàng
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Chỉ 3 bước đơn giản để thưởng thức
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white dark:bg-[#2c2320] rounded-full flex items-center justify-center mb-6 shadow-sm">
                {step.icon}
              </div>
              <span className="text-amber-900 dark:text-amber-500 font-bold mb-2">
                {step.id}
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2" style={{ fontFamily: 'serif' }}>
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
