import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import receiptSettingService from '@/services/receiptSettingService';
import { format } from 'date-fns';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + ' đ';

export default function PrintableShiftReceipt({ session, summaryData, actualCash, onDone }) {
  const [settings, setSettings] = useState(null);
  const afterPrintHandledRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        const res = await receiptSettingService.getSettings();
        if (mounted && res?.success) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to load print settings:', err);
      }
    };
    fetchSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const logoUrl = useMemo(() => {
    if (!settings?.logo_url) return null;
    return settings.logo_url.startsWith('http')
      ? settings.logo_url
      : `http://localhost:5000${settings.logo_url.startsWith('/') ? '' : '/'}${settings.logo_url}`;
  }, [settings?.logo_url]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    const handleAfterPrint = async () => {
      if (afterPrintHandledRef.current) return;
      afterPrintHandledRef.current = true;
      if (typeof onDone === 'function') {
        onDone();
      }
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onDone, session]);

  if (!session || !summaryData) return null;

  const summary = summaryData?.summary || {};
  const currentSystemCash = summary.current_cash_system || 0;
  const difference = actualCash - currentSystemCash;

  const headerLines = [
    settings?.store_name || 'COFFEE SHOP',
    settings?.address || 'Khu Giáo dục và Đào tạo – Khu Công nghệ cao Hòa Lạc',
    settings?.phone ? `ĐT: ${settings.phone}` : 'ĐT: 0123456789'
  ];

  return createPortal(
    <div className="printable-shift-receipt-portal">
      <div className="printable-shift-receipt" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <style>{`
          @page {
            size: 80mm auto;
            margin: 0;
          }
          @media print {
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              width: auto;
              height: auto;
              overflow: visible !important;
            }
            body > *:not(.printable-shift-receipt-portal) {
              display: none !important;
            }
            .printable-shift-receipt-portal {
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .printable-shift-receipt {
              position: relative !important;
              width: 80mm !important;
              margin: 0 auto !important;
              padding: 10px !important;
              box-sizing: border-box !important;
              font-size: 12px;
              color: #000;
              line-height: 1.4;
              display: block !important;
            }
            .printable-shift-receipt-inner {
              width: 74mm !important;
              max-width: 74mm !important;
              margin: 0 auto !important;
              box-sizing: border-box !important;
            }
            img {
              max-width: 60px;
              display: block;
              margin: 0 auto 10px;
            }
          }
        `}</style>

        <div className="printable-shift-receipt-inner">
          {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          {logoUrl && <img src={logoUrl} alt="Logo" />}
          {headerLines.map((line, idx) => (
            <div
              key={idx}
              style={{
                fontSize: idx === 0 ? '16px' : '11px',
                fontWeight: idx === 0 ? 'bold' : 'normal',
                marginBottom: '3px'
              }}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Title */}
        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          marginTop: '15px',
          marginBottom: '15px',
          borderTop: '1px dashed #000',
          borderBottom: '1px dashed #000',
          padding: '8px 0'
        }}>
          PHIẾU BÀN GIAO CA
        </div>

        {/* Info */}
        <div style={{ marginBottom: '15px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Mã ca:</span>
            <span>{session.code}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Nhân viên mở:</span>
            <span>{session?.opened_by?.name || session.opener_first_name || "N/A"}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Giờ mở ca:</span>
            <span>{session.opened_at ? format(new Date(session.opened_at), 'dd/MM/yyyy HH:mm') : '---'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Giờ đóng ca:</span>
            <span>{format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
          </div>
        </div>

        {/* Revenue Summary */}
        <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>TỔNG HỢP DOANH THU</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Số đơn hoàn tất:</span>
            <span>{summary.completed_orders || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Số đơn hủy:</span>
            <span>{summary.cancelled_orders || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Doanh thu tiền mặt:</span>
            <span>{fmt(summary.cash_revenue || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Doanh thu PayOS:</span>
            <span>{fmt(summary.payos_revenue || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 'bold' }}>
            <span>TỔNG DOANH THU:</span>
            <span>{fmt((summary.cash_revenue || 0) + (summary.payos_revenue || 0))}</span>
          </div>
        </div>

        {/* Cash Reconciliation */}
        <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>BÀN GIAO TIỀN MẶT</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Tiền đầu ca:</span>
            <span>{fmt(session.opening_cash || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Tiền mặt thu trong ca:</span>
            <span>{fmt(summary.cash_revenue || 0)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 'bold' }}>
            <span>Tiền trên hệ thống:</span>
            <span>{fmt(currentSystemCash)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 'bold' }}>
            <span>Tiền mặt thực tế:</span>
            <span>{fmt(actualCash)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontWeight: 'bold', fontStyle: 'italic' }}>
            <span>Chênh lệch:</span>
            <span>{fmt(difference)}</span>
          </div>
        </div>

        {/* Signature */}
        <div style={{ borderTop: '1px dashed #000', paddingTop: '15px', marginTop: '20px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Người giao</div>
            <div>(Ký, ghi rõ họ tên)</div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '40px' }}>Người nhận/Quản lý</div>
            <div>(Ký, ghi rõ họ tên)</div>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
