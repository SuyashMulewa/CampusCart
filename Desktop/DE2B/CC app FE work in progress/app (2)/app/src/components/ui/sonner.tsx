/**
 * Reusable UI primitive component: s on ne r.
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
        success: <CircleCheckIcon className="size-7 text-[#71b55a]" />, // yellow
        info: <InfoIcon className="size-4 text-[#3B3B3B]" />, // dark gray
        warning: <TriangleAlertIcon className="size-4 text-[#F5B800]" />, // yellow
        error: <OctagonXIcon className="size-4 text-red-500" />, // red
        loading: <Loader2Icon className="size-4 animate-spin text-[#F5B800]" />, // yellow
      }}
      style={
        {
          "--normal-bg": "#71b55a", // dark background
          "--normal-text": "#fff", // white text
          "--normal-border": "#71b55a", // yellow border
          "--border-radius": "0.75rem", // rounded-xl
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          background: '#ebb50b',
          color: '#fff',
          border: '2px solid #F5B800',
          borderRadius: '0.75rem',
          fontWeight: 800,
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

