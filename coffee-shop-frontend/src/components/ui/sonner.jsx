import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="top-right"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "#10b981",
          "--success-text": "#ffffff",
          "--success-border": "#059669",
          "--error-bg": "#ef4444",
          "--error-text": "#ffffff",
          "--error-border": "#dc2626",
          "--warning-bg": "#f59e0b",
          "--warning-text": "#ffffff",
          "--warning-border": "#d97706",
          "--info-bg": "#3b82f6",
          "--info-text": "#ffffff",
          "--info-border": "#2563eb"
        }
      }
      {...props} />
  );
}

export { Toaster }
