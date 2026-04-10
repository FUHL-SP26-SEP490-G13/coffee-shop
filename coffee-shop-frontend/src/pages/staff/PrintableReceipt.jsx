import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import receiptSettingService from '@/services/receiptSettingService';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + ' đ';
const LOYALTY_MONEY_PER_POINT = 100;
const MONEY_ROUNDING_UNIT = 100;
const LEGACY_DELIVERY_SHIPPING_FEE = 20000;
const DYNAMIC_SHIPPING_ROLLOUT_AT = new Date("2026-04-07T00:00:00.000Z").getTime();

const isOrderPaid = (order) => {
  const paymentStatus = String(
    order?.payment_status || order?.payment?.status || ''
  ).toLowerCase();
  if (paymentStatus === 'paid') return true;

  return (
    order?.is_paid === true ||
    order?.is_paid === 1 ||
    order?.is_paid === '1'
  );
};

const toLines = (textOrLines) => {
  if (Array.isArray(textOrLines)) {
    return textOrLines.map((line) => String(line).trim()).filter(Boolean);
  }
  return String(textOrLines || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

const getItemQuantity = (item) => Math.max(1, Number(item?.quantity) || 1);

const getItemLineTotal = (item) => {
  const lineTotal = Number(item?.line_total);
  if (Number.isFinite(lineTotal) && lineTotal >= 0) return lineTotal;
  return Number(item?.unit_price ?? item?.price ?? 0) * getItemQuantity(item);
};

const getToppingUnitTotal = (item) =>
  (item?.toppings || []).reduce(
    (sum, topping) =>
      sum + Number(topping?.price || 0) * Number(topping?.quantity || 0),
    0
  );

const getBaseUnitPrice = (item) => {
  const fromApi = Number(item?.base_unit_price);
  if (Number.isFinite(fromApi) && fromApi >= 0) return fromApi;

  const unitPrice = getItemLineTotal(item) / getItemQuantity(item);
  return Math.max(0, unitPrice - getToppingUnitTotal(item));
};

const calcSubtotal = (order) =>
  (order.items || []).reduce((sum, item) => sum + getItemLineTotal(item), 0);

const getDiscountAmount = (order, fallbackSubtotal, deliveryFee) => {
  const discountFromApi = Number(order?.discount_amount);
  if (Number.isFinite(discountFromApi) && discountFromApi >= 0) {
    return discountFromApi;
  }

  const amountForDiscountCalc =
    Number(order?.amount) > 0
      ? Number(order.amount)
      : Math.max(0, Number(fallbackSubtotal || 0));
  const total = Math.max(0, Number(order?.total_amount || 0));
  return Math.max(0, amountForDiscountCalc + deliveryFee - total);
};

const getShippingFee = (order, subtotal) => {
  if (String(order?.order_type || '').toLowerCase() !== 'delivery') return 0;

  const feeByDeliveryColumn = Number(order?.delivery_fee);
  if (Number.isFinite(feeByDeliveryColumn) && feeByDeliveryColumn >= 0) {
    return Math.round(feeByDeliveryColumn / MONEY_ROUNDING_UNIT) * MONEY_ROUNDING_UNIT;
  }

  const feeFromApi = Number(order?.shipping_fee);
  if (Number.isFinite(feeFromApi) && feeFromApi > 0) {
    return Math.round(feeFromApi / MONEY_ROUNDING_UNIT) * MONEY_ROUNDING_UNIT;
  }

  const loyaltyDiscountAmount =
    Math.max(0, Number(order?.used_points || 0)) * LOYALTY_MONEY_PER_POINT;
  const derivedFee = Number(order?.total_amount || 0) + loyaltyDiscountAmount - Number(subtotal || 0);

  const normalizedDerivedFee =
    Math.round(derivedFee / MONEY_ROUNDING_UNIT) * MONEY_ROUNDING_UNIT;
  if (Number.isFinite(normalizedDerivedFee) && normalizedDerivedFee > 0) {
    return normalizedDerivedFee;
  }

  const createdAtMs = new Date(order?.created_at || 0).getTime();
  const useLegacyFallback =
    Number.isFinite(createdAtMs) && createdAtMs < DYNAMIC_SHIPPING_ROLLOUT_AT;

  if (useLegacyFallback) {
    return LEGACY_DELIVERY_SHIPPING_FEE;
  }

  return 0;
};

const getOrderTypeLabel = (orderType) => {
  switch (String(orderType || '').toLowerCase()) {
    case 'delivery':
      return 'Giao hàng';
    case 'takeaway':
      return 'Mang đi';
    case 'dine-in':
      return 'Tại quán';
    default:
      return 'Khác';
  }
};

/**
 * @param {{ order: Object, onDone?: Function, onPrintSuccess?: Function }} props
 */
export function PrintableReceipt({ order, onDone, onPrintSuccess }) {
  const [setting, setSetting] = useState(null);
  const [printedAt] = useState(() => Date.now());
  const afterPrintHandledRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const fetchSetting = async () => {
      try {
        const res = await receiptSettingService.getActive();
        if (mounted) {
          setSetting(res?.data || null);
        }
      } catch {
        if (mounted) {
          setSetting(null);
        }
      }
    };

    fetchSetting();
    return () => {
      mounted = false;
    };
  }, []);

  const headerLines = useMemo(
    () => toLines(setting?.header_lines || setting?.header_text),
    [setting]
  );
  const footerLines = useMemo(
    () => toLines(setting?.footer_lines || setting?.footer_text),
    [setting]
  );

  const displayLogo = setting?.logo_url || '';
  const storeName = setting?.store_name || 'Coffee Shop';
  const storeAddress = setting?.address || '';
  const storePhone = setting?.phone || '';

  const orderId = Number(order.order_id || order.id || 0);
  const orderCode = `#${String(
    Number.isFinite(orderId) && orderId > 0 ? orderId : 0
  ).padStart(5, '0')}`;
  const fallbackSubtotal = calcSubtotal(order);
  const subtotal = Math.max(
    0,
    Number(order?.amount ?? order?.subtotal_amount ?? 0),
  );
  const totalAmount = Number(order.total_amount || 0);
  const normalizedOrderType = String(order?.order_type || '').toLowerCase();
  const isDeliveryOrder = normalizedOrderType === 'delivery';
  const shippingFee = getShippingFee(order, fallbackSubtotal);
  const discountAmount = getDiscountAmount(order, fallbackSubtotal, shippingFee);
  const hasReceiverInfo = Boolean(
    order?.receiver_name || order?.receiver_phone || order?.address || order?.receiver_email
  );
  const shouldShowDeliveryInfo = isDeliveryOrder && hasReceiverInfo;
  const orderDate = new Date(order.created_at || printedAt).toLocaleString(
    'vi-VN',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  );

  useEffect(() => {
    afterPrintHandledRef.current = false;

    const timer = setTimeout(() => {
      window.print();
    }, 400);

    const handleAfterPrint = async () => {
      if (afterPrintHandledRef.current) return;
      afterPrintHandledRef.current = true;

      try {
        if (typeof onPrintSuccess === 'function') {
          Promise.resolve(onPrintSuccess(order)).catch(() => {});
        }
      } finally {
        if (typeof onDone === 'function') {
          onDone();
        }
      }
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onDone, onPrintSuccess, order]);

  return createPortal(
    <div className="printable-receipt-portal">
      <div className="printable-receipt" style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          html,
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            width: auto;
            height: auto;
            overflow: visible !important;
          }

          body > *:not(.printable-receipt-portal) {
            display: none !important;
          }

          .printable-receipt-portal {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .printable-receipt {
            position: relative !important;
            width: 80mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            display: block !important;
            background: #fff;
            z-index: auto;
          }

          .receipt-container {
            width: 74mm !important;
            max-width: 74mm !important;
            box-sizing: border-box !important;
            padding: 2.5mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
        }

        .receipt-container {
          box-sizing: border-box;
          width: 360px;
          max-width: 100%;
          margin: 0 auto;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          background: white;
          color: #0f172a;
        }

        .receipt-header {
          text-align: center;
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .receipt-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }

        .receipt-logo img {
          width: 72px;
          height: 72px;
          object-fit: contain;
          border-radius: 12px;
        }

        .store-name {
          text-transform: uppercase;
          font-size: 16px;
          line-height: 1.25;
          font-weight: 700;
          letter-spacing: 0.06em;
          margin-bottom: 2px;
          overflow-wrap: anywhere;
        }

        .center-line {
          text-align: center;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .receipt-code {
          color: #0f294d;
          text-decoration: underline;
        }

        .title-section {
          margin-top: 10px;
          border-top: 1px dashed #cbd5e1;
          padding-top: 12px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          overflow-wrap: anywhere;
        }

        .receipt-section {
          border-top: 1px dashed #cbd5e1;
          padding-top: 10px;
          margin-top: 10px;
        }

        .receipt-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .receipt-item-name {
          flex: 1;
          min-width: 0;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .receipt-item-price {
          text-align: right;
          flex-shrink: 0;
          margin-left: 12px;
          white-space: nowrap;
        }

        .receipt-total {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 13px;
          border-top: 1px dashed #cbd5e1;
          padding-top: 10px;
          margin-top: 10px;
        }

        .receipt-payment-method {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-top: 10px;
        }

        .receipt-payment-status {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-top: 10px;
        }

        .receipt-footer {
          text-align: center;
          font-size: 11px;
          margin-top: 12px;
          color: #666;
        }
      `}</style>

      <div className="receipt-container">
        {/* Header */}
        <div className="receipt-header">
          {displayLogo ? (
            <div className="receipt-logo">
              <img src={displayLogo} alt="Receipt Logo" />
            </div>
          ) : null}

          <div className="store-name">{storeName}</div>
          {storeAddress ? <div className="center-line">{storeAddress}</div> : null}
          {storePhone ? <div className="center-line">ĐT: {storePhone}</div> : null}

          {headerLines.length > 0 ? (
            <div className="receipt-section" style={{ borderTopStyle: 'solid' }}>
              {headerLines.map((line, index) => (
                <div key={`header-${index}`} className="center-line">
                  {line}
                </div>
              ))}
            </div>
          ) : null}

          <div className="title-section">HÓA ĐƠN THANH TOÁN</div>
        </div>

        <div className="receipt-section">
          <div className="receipt-item">
            <span>Mã đơn:</span>
            <span className="receipt-code">{orderCode}</span>
          </div>
          <div className="receipt-item">
            <span>Ngày:</span>
            <span>{orderDate}</span>
          </div>
          <div className="receipt-item">
            <span>Loại đơn:</span>
            <span>{getOrderTypeLabel(order.order_type)}</span>
          </div>
          {order.printed_by ? (
            <div className="receipt-item">
              <span>Người in:</span>
              <span>{order.printed_by}</span>
            </div>
          ) : null}
        </div>

        {/* Delivery Info */}
        {shouldShowDeliveryInfo && (
          <div className="receipt-section">
            {order.receiver_name && (
              <div className="receipt-item">
                <span>Người nhận:</span>
                <span style={{ textAlign: 'right' }}>{order.receiver_name}</span>
              </div>
            )}
            {order.receiver_phone && (
              <div className="receipt-item">
                <span>Số điện thoại:</span>
                <span style={{ textAlign: 'right' }}>{order.receiver_phone}</span>
              </div>
            )}
            {order.receiver_email && (
              <div className="receipt-item">
                <span>Email:</span>
                <span style={{ textAlign: 'right', wordBreak: 'break-all', maxWidth: '60%' }}>{order.receiver_email}</span>
              </div>
            )}
            {order.address && (
              <div className="receipt-item">
                <span>Địa chỉ:</span>
                <span style={{ textAlign: 'right' }}>{order.address}</span>
              </div>
            )}
          </div>
        )}


        {/* Items */}
        <div className="receipt-section">
          {(order.items || []).map((item, i) => (
            <div key={i}>
              <div className="receipt-item">
                <div className="receipt-item-name">
                  {item.product_name || item.name} ({item.size}) x{item.quantity}
                </div>
                <div className="receipt-item-price">
                  {fmt(getBaseUnitPrice(item) * getItemQuantity(item))}
                </div>
              </div>

              {/* Toppings */}
              {item.toppings && item.toppings.length > 0 && (
                <div style={{ marginLeft: '10px', marginBottom: '4px' }}>
                  {item.toppings.map((t, j) => (
                    <div key={j} className="receipt-item">
                      <span style={{ fontSize: '10px' }}>
                        + {t.name} ×{Number(t.quantity || 0) * getItemQuantity(item)}
                      </span>
                      <span style={{ fontSize: '10px' }}>
                        +
                        {fmt(
                          Number(t.price || 0) *
                            Number(t.quantity || 0) *
                            getItemQuantity(item)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Note */}
              {item.note && (
                <div style={{ fontSize: '10px', marginLeft: '10px', marginBottom: '4px', fontStyle: 'italic', color: '#666' }}>
                  Ghi chú: {item.note}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ghi chú */}
        {order.note && (
          <div className="receipt-section">
            <div className="receipt-item">
              <span>Ghi chú:</span>
              <span>{order.note}</span>
            </div>
          </div>
        )}

        <div className="receipt-section">
          <div className="receipt-item">
            <span>Tạm tính</span>
            <span>{fmt(subtotal)}</span>
          </div>
          <div className="receipt-item">
            <span>Giảm giá{order.discount_code ? ` (${order.discount_code})` : ''}</span>
            <span>-{fmt(discountAmount)}</span>
          </div>
          <div className="receipt-item">
            <span>Phí vận chuyển</span>
            <span>+{fmt(isDeliveryOrder ? shippingFee : 0)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="receipt-total">
          <span>Tổng cộng</span>
          <span>{fmt(totalAmount)}</span>
        </div>

        {/* Payment Status */}
        <div className="receipt-payment-method">
          <span>Phương thức thanh toán: </span>
          <span>{(order.payment_method || order.payment?.method) === 'cash'
            ? 'Tiền mặt'
            : 'QR PayOS'}</span>
        </div>

        {/* Payment Status */}
        <div className="receipt-payment-status">
          <span>Trạng thái thanh toán: </span>
            <span>
          {isOrderPaid(order) ? 'Đã thanh toán' : 'Chờ thanh toán'}
          </span>
        </div>


        {/* Adjustment */}
        {order.payment?.adjustment_amount != null && order.payment.adjustment_amount !== 0 && (
          <div className="receipt-section" style={{ textAlign: 'center' }}>
            {order.payment.adjustment_amount < 0
              ? `Hoàn khách: ${fmt(Math.abs(order.payment.adjustment_amount))}`
              : `Thu thêm: ${fmt(order.payment.adjustment_amount)}`}
          </div>
        )}

        {/* Footer */}
        {footerLines.length > 0 ? (
          <div className="receipt-section">
            <div className="receipt-footer">
              {footerLines.map((line, index) => (
                <div key={`footer-${index}`}>{line}</div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
    </div>,
    document.body
  );
}
