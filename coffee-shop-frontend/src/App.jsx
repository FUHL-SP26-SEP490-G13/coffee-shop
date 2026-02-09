import { Toaster } from "./components/ui/sonner";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <AppRoutes />

      <Toaster />
    </div>
  );
}
