import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

function QRDisplay({ url,qrString  }) {
  const [qrSrc, setQrSrc] = useState('');

  useEffect(() => {
    // Ưu tiên dùng qrString (VietQR EMV) nếu có, fallback sang checkout URL
    const content = qrString || url;
    if (!content) return;

    QRCode.toDataURL(content, {
      width: 200,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
      .then(setQrSrc)
      .catch(console.error);
  }, [url, qrString]);

  if (!qrSrc)
    return (
      <div className='w-52 h-52 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center'>
        <Loader2 size={24} className='animate-spin text-gray-300 dark:text-gray-600' />
      </div>
    );

  return (
    <img
      src={qrSrc}
      alt='QR thanh toán'
      className='w-52 h-52 rounded-2xl border-2 border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none'
    />
  );
}

export default QRDisplay;
