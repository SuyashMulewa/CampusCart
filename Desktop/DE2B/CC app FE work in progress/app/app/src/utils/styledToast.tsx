/**
 * Centralised styled toast notifications using Sonner.
 *
 * Provides consistent alignment, colour palette and content justification
 * across the entire CampusCart application.
 *
 * Usage:
 *   import { styledToast } from '@/utils/styledToast';
 *   styledToast.success('Title', 'Optional description');
 *   styledToast.error('Title', 'Optional description');
 *   styledToast.info('Title', 'Optional description');
 *   styledToast.warning('Title', 'Optional description');
 */
import { toast } from 'sonner';
import {
  CircleCheckIcon,
  OctagonXIcon,
  InfoIcon,
  TriangleAlertIcon,
} from 'lucide-react';

/* ─── Palette ─── */
const PALETTE = {
  success: {
    bg: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
    border: '1px solid #BBF7D0',
    accent: '#16A34A',
    iconBg: '#DCFCE7',
    title: '#15803D',
    desc: '#166534',
    sub: '#6B7280',
    shadow: '0 8px 24px rgba(22,163,74,0.12)',
  },
  error: {
    bg: 'linear-gradient(135deg, #FEF2F2 0%, #FFF1F2 100%)',
    border: '1px solid #FECACA',
    accent: '#DC2626',
    iconBg: '#FEE2E2',
    title: '#991B1B',
    desc: '#B91C1C',
    sub: '#6B7280',
    shadow: '0 8px 24px rgba(220,38,38,0.12)',
  },
  info: {
    bg: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)',
    border: '1px solid #BFDBFE',
    accent: '#2563EB',
    iconBg: '#DBEAFE',
    title: '#1E40AF',
    desc: '#1D4ED8',
    sub: '#6B7280',
    shadow: '0 8px 24px rgba(37,99,235,0.12)',
  },
  warning: {
    bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF9C3 100%)',
    border: '1px solid #FDE68A',
    accent: '#D97706',
    iconBg: '#FEF3C7',
    title: '#92400E',
    desc: '#B45309',
    sub: '#6B7280',
    shadow: '0 8px 24px rgba(217,119,6,0.12)',
  },
} as const;

type ToastKind = keyof typeof PALETTE;

/* ─── Icon map ─── */
const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CircleCheckIcon className="w-5 h-5" style={{ color: PALETTE.success.accent }} />,
  error:   <OctagonXIcon className="w-5 h-5" style={{ color: PALETTE.error.accent }} />,
  info:    <InfoIcon className="w-5 h-5" style={{ color: PALETTE.info.accent }} />,
  warning: <TriangleAlertIcon className="w-5 h-5" style={{ color: PALETTE.warning.accent }} />,
};

/* ─── Core renderer ─── */
function show(
  kind: ToastKind,
  title: string,
  description?: string,
  duration = 4000,
) {
  const p = PALETTE[kind];

  toast(
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
      {/* Icon circle */}
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: p.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}
      >
        {ICONS[kind]}
      </div>

      {/* Text content — left-aligned */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontWeight: 700,
            fontSize: '14px',
            lineHeight: '1.35',
            color: p.title,
            margin: 0,
          }}
        >
          {title}
        </p>
        {description && (
          <p
            style={{
              fontWeight: 500,
              fontSize: '12px',
              lineHeight: '1.5',
              color: p.desc,
              margin: '3px 0 0',
              opacity: 0.9,
            }}
          >
            {description}
          </p>
        )}
      </div>
    </div>,
    {
      duration,
      style: {
        background: p.bg,
        border: p.border,
        borderLeft: `4px solid ${p.accent}`,
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: p.shadow,
      },
    },
  );
}

/* ─── Public API ─── */
export const styledToast = {
  success: (title: string, description?: string, duration?: number) =>
    show('success', title, description, duration),

  error: (title: string, description?: string, duration?: number) =>
    show('error', title, description, duration),

  info: (title: string, description?: string, duration?: number) =>
    show('info', title, description, duration),

  warning: (title: string, description?: string, duration?: number) =>
    show('warning', title, description, duration),
};
