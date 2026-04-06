import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    const shopName = localStorage.getItem("cached_store_name") || "Coffee Shop";
    document.title = title ? `${title} | ${shopName}` : shopName;
  }, [title]);
}
