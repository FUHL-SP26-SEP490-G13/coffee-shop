import React from "react";
import { Heart, MessageCircle, Instagram } from "lucide-react";

export default function InstagramFeedSection() {
  const images = [
    {
      id: 1,
      url: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=600&auto=format&fit=crop",
      likes: "1.2k",
      comments: 45,
    },
    {
      id: 2,
      url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=600&auto=format&fit=crop",
      likes: "856",
      comments: 24,
    },
    {
      id: 3,
      url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop",
      likes: "2.5k",
      comments: 112,
    },
    {
      id: 4,
      url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop",
      likes: "1.8k",
      comments: 89,
    },
    {
      id: 5,
      url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop",
      likes: "945",
      comments: 32,
    },
    {
      id: 6,
      url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop",
      likes: "3.1k",
      comments: 156,
    },
  ];

  const handleImageClick = () => {
    // Navigate to actual Instagram/TikTok link here
    window.open("https://www.instagram.com/", "_blank");
  };

  return (
    <section className="w-full bg-white dark:bg-gray-900 py-16">
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12 text-center mb-10">
        <h3 className="text-xl md:text-3xl font-semibold text-center text-gray-900 dark:text-gray-100 mb-12" style={{ fontFamily: 'serif' }}>
          Theo dõi chúng tôi
        </h3>
        <div className="flex items-center justify-center gap-2 text-primary hover:opacity-80 transition-opacity cursor-pointer mx-auto" onClick={handleImageClick}>
          <Instagram className="w-5 h-5" />
          <span className="font-medium text-lg tracking-wide">@coffeeshop_vn</span>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full gap-2 lg:gap-3 rounded-2xl overflow-hidden shadow-sm">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl"
              onClick={handleImageClick}
            >
              {/* Background Image */}
              <img
                src={img.url}
                alt="Instagram Feed Snapshot"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                loading="lazy"
              />

              {/* Overlay Effect */}
              <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center backdrop-blur-[2px]">
                <div className="flex items-center gap-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center gap-1.5 font-semibold text-lg drop-shadow-md">
                    <Heart className="w-6 h-6 fill-white" />
                    <span>{img.likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-lg drop-shadow-md">
                    <MessageCircle className="w-6 h-6 fill-white" />
                    <span>{img.comments}</span>
                  </div>
                </div>
              </div>

              {/* Instagram Icon Badge */}
              <div className="absolute top-4 right-4 bg-white dark:bg-gray-900/20 p-2 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Instagram className="w-4 h-4 text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
