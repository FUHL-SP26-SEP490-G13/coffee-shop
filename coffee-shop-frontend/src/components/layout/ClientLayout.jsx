import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import AiAssistantWidget from "./AiAssistantWidget";

export default function ClientLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 dark:border-gray-800">
      <Header />
      <main className="flex-1 w-full bg-white dark:bg-gray-950">
        <Outlet />
      </main>
      <AiAssistantWidget />
      <Footer />
    </div>
  );
}
