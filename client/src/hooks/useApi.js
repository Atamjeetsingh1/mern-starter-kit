/**
 * hooks/useApi.js
 * Generic hook for calling any async API function with loading / error state.
 *
 * Usage:
 *   const { execute, data, isLoading, error } = useApi(getUserByIdApi);
 *   await execute(userId);
 */

import { useState, useCallback } from "react";

/**
 * @template T
 * @param {(...args: any[]) => Promise<import('axios').AxiosResponse<T>>} apiFunc
 */
const useApi = (apiFunc) => {
  const [data, setData]         = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState(null);

  /**
   * execute — calls apiFunc with provided args, manages state automatically.
   * Returns the response data so callers can use it inline if needed.
   */
  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFunc(...args);
        const result = response.data?.data ?? response.data;
        setData(result);
        return result;
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "An unexpected error occurred.";
        setError(msg);
        throw err; // Re-throw so callers can handle if needed
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { execute, data, isLoading, error, reset };
};

export default useApi;