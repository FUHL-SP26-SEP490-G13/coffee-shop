import { Toaster } from "./components/ui/sonner";
import AppRoutes from "./routes/AppRoutes";
import ScrollToTop from "./components/common/ScrollToTop";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <AppRoutes />

      <Toaster />
    </div>
  );
}
