import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Coffee, ShoppingBag, Sparkles, User, RefreshCw, Loader2 } from "lucide-react";
import aiService from "@/services/aiService";
import { cartService } from "@/services/cartService";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng ☀️! Mình là Trợ Lý Cà Phê.";
  if (hour < 18) return "Chào buổi chiều ☕! Mình là Trợ Lý Cà Phê.";
  return "Chào buổi tối 🌙! Mình là Trợ Lý Cà Phê.";
};

const MessageContent = ({ text, role, isNew }) => {
  const [displayedText, setDisplayedText] = useState(isNew && role === "ai" ? "" : text);

  useEffect(() => {
    if (isNew && role === "ai") {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i));
        i++;
        if (i > text.length) clearInterval(interval);
      }, 15);
      return () => clearInterval(interval);
    } else {
      setDisplayedText(text);
    }
  }, [text, isNew, role]);

  const htmlText = displayedText
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");

  return <span dangerouslySetInnerHTML={{ __html: htmlText }} />;
};

export default function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `${getGreeting()} Bạn muốn gợi ý đồ uống hay hỏi thông tin quán nào?`,
      id: Date.now(),
      isNew: false
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickReplies = [
    "Khuyến mãi hôm nay",
    "Các sản phẩm ở cửa hàng",
    "Cửa hàng mở cửa từ mấy giờ?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setMessages(prev => {
        // Tránh vòng lặp vô hạn do thay đổi state: chỉ set nếu thực sự có tin nhắn còn isNew
        if (prev.some(m => m.isNew)) {
          return prev.map(m => ({ ...m, isNew: false }));
        }
        return prev;
      });
    }
  }, [isOpen]);

  const handleSend = async (text = inputValue) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', text: text.trim(), id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Create history array exactly as the backend expects (excluding the current msg)
      const history = messages.map(m => ({ role: m.role, text: m.text }));

      const res = await aiService.chat(history, text.trim());
      const data = res.data; // The returned AiService structure

      if (data?.type === "action" && data?.action?.type === "add_to_cart_multiple") {
        const items = data.action.payload || [];
        items.forEach(item => {
          cartService.addItem({
            id: item.product_id,
            product_id: item.product_id,
            name: item.product_name,
            price: Number(item.price) || 0,
            basePrice: Number(item.price) || 0,
            size: item.size || "S",
            productSizeId: item.productSizeId || 0,
            product_size_id: item.productSizeId || 0,
            image: item.image || "",
            quantity: item.quantity || 1,
            note: item.note || ""
          });
        });

        const systemMsg = {
          role: 'ai',
          text: data.text || `Đã thêm các món vào giỏ hàng!`,
          id: Date.now() + 1,
          isNew: true
        };
        setMessages(prev => [...prev, systemMsg]);
      } else {
        const modelMsg = {
          role: 'ai',
          text: data?.text || "Xin lỗi, hiện tại mình đang bận, bạn vui lòng thử lại sau nhé!",
          id: Date.now() + 1,
          isNew: true
        };
        setMessages(prev => [...prev, modelMsg]);
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'Lỗi kết nối đến Trợ Lý Cà Phê. Vui lòng thử lại sau.',
        id: Date.now() + 1,
        isError: true,
        isNew: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-amber-100 overflow-hidden mb-4 flex flex-col transition-all duration-300 origin-bottom-right animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:zoom-out-95">
          {/* Header */}
          <div className="bg-[#7B4B36] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-gray-900/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-[#7B4B36] dark:text-amber-50" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Trợ lý Cà Phê</h3>
                <p className="text-xs text-amber-100/80">AI gợi ý & đặt hàng</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-full transition-colors group"
            >
              <X className="w-5 h-5 text-amber-50 group-hover:text-white" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[400px] min-h-[300px] bg-[#FAF9F6] dark:bg-stone-900 custom-scrollbar">
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${msg.role === 'user' ? 'bg-amber-100 dark:bg-amber-900/30/50' : 'bg-[#7B4B36]/10'}`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                    ) : (
                      <Bot className={`w-5 h-5 ${msg.isError ? 'text-red-500' : 'text-[#7B4B36] dark:text-[#E2C3A5]'} `} />
                    )}
                  </div>
                  <div className={`
                    px-4 py-2.5 rounded-2xl text-[14.5px] whitespace-pre-wrap word-break
                    ${msg.role === 'user'
                      ? 'bg-[#7B4B36] text-white rounded-tr-sm'
                      : msg.isError
                        ? 'bg-red-50 text-red-600 rounded-tl-sm border border-red-100'
                        : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-100 dark:border-gray-800 shadow-sm leading-relaxed'
                    }
                  `}>
                    <MessageContent text={msg.text} role={msg.role} isNew={msg.isNew} />
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-2 max-w-[85%] self-start">
                  <div className="w-8 h-8 rounded-full bg-[#7B4B36]/10 flex shrink-0 items-center justify-center">
                    <Bot className="w-5 h-5 text-[#7B4B36] dark:text-[#E2C3A5]" />
                  </div>
                  <div className="px-4 py-3 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-sm border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Replies (Only show if last msg is from AI) */}
          {!isLoading && messages[messages.length - 1].role === 'ai' && (
            <div className="px-4 py-2 bg-[#FAF9F6] dark:bg-stone-900 flex flex-wrap gap-2">
              {quickReplies.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(reply)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-amber-200 text-[#7B4B36] dark:text-[#E2C3A5] text-xs rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/20 active:bg-amber-100 dark:active:bg-amber-900/30 transition-colors whitespace-nowrap shadow-sm"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 rounded-full pr-1 pl-4 rtl:pl-1 rtl:pr-4 focus-within:ring-1 focus-within:ring-[#7B4B36] focus-within:bg-white dark:focus-within:bg-gray-900 transition-all shadow-inner"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-transparent py-3 text-[14.5px] outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-2 w-10 h-10 flex flex-shrink-0 items-center justify-center bg-[#7B4B36] text-white rounded-full hover:bg-[#683f2d] disabled:bg-gray-300 disabled:text-gray-500 dark:text-gray-400 transition-colors shadow-sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 animate-wiggle hover:bg-[#683f2d]'} transition-all duration-300 w-14 h-14 bg-[#7B4B36] rounded-full shadow-lg shadow-amber-900/20 flex items-center justify-center group relative border-2 border-white cursor-pointer`}
      >
        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-300 animate-pulse" />
        <Bot className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}