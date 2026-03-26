export default function IntroVideoSection({ videoId }) {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-14 sm:py-16 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <p className="text-amber-600 font-bold sm:text-xl lg:text-2xl tracking-widest uppercase mb-3">
            Giới thiệu
          </p>
          <h5 className="text-xl sm:text-lg lg:text-2xl text-gray-700 mb-3 leading-tight">
            Một chút thư giãn với cà phê tuyệt hảo
          </h5>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Một chút không gian, một chút hương vị — và rất nhiều cảm hứng từ cà
            phê.
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-black">
          <div className="relative w-full pt-[56.25%]">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1`}
              title="Coffee Intro Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
