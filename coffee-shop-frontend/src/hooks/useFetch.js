import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFetch
 * @param {Function} fetcher - function gọi API (VD: () => categoryService.getAll(params))
 * @param {Object} options
 * @param {boolean} options.immediate - có gọi API ngay khi mount hay không
 * @param {*} options.initialData - data mặc định
 */
const useFetch = (fetcher, options = {}) => {
  const { immediate = true, initialData = null } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetcher(...args);

        if (isMountedRef.current) {
          setData(result);
        }

        return result;
      } catch (err) {
        if (isMountedRef.current) {
          setError(err);
        }
        throw err;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [fetcher]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    execute,   // refetch / gọi thủ công
    setData,   // optimistic update
  };
};

export default useFetch;
