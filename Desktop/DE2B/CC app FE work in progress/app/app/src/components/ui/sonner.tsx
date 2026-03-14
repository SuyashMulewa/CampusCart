/**
 * Reusable UI primitive component: Sonner Toaster.
 *
 * Sets a clean base style. Actual per-toast styling is handled by
 * the centralised styledToast utility (@/utils/styledToast).
 */
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5 text-[#16A34A]" />,
        info: <InfoIcon className="size-5 text-[#2563EB]" />,
        warning: <TriangleAlertIcon className="size-5 text-[#D97706]" />,
        error: <OctagonXIcon className="size-5 text-[#DC2626]" />,
        loading: <Loader2Icon className="size-5 animate-spin text-[#2563EB]" />,
      }}
      style={
        {
          "--normal-bg": "#FFFFFF",
          "--normal-text": "#1F2937",
          "--normal-border": "#E5E7EB",
          "--border-radius": "0.75rem",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          borderRadius: '12px',
          padding: '0',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          border: 'none',
          background: 'transparent',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

