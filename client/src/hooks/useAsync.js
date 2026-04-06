/**
 * hooks/useAsync.js
 * Manages the full lifecycle of any async operation:
 * idle → loading → success | error.
 *
 * Unlike useApi, this hook is not tied to Axios — works with
 * any promise-returning function (fetch, indexedDB, timers, etc.)
 *
 * Usage:
 *   const { execute, status, value, error } = useAsync(fetchUserData);
 *
 *   useEffect(() => { execute(userId); }, [userId]);
 *
 *   if (status === "loading") return <Skeleton />;
 *   if (status === "error")   return <Error message={error.message} />;
 *   return <UserCard user={value} />;
 */

import { useState, useCallback, useRef } from "react";

const STATUS = { IDLE: "idle", LOADING: "loading", SUCCESS: "success", ERROR: "error" };

const useAsync = (asyncFn, immediate = false) => {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [value,  setValue]  = useState(null);
  const [error,  setError]  = useState(null);

  // Prevent state updates on unmounted component
  const mountedRef = useRef(true);
  useState(() => () => { mountedRef.current = false; });

  const execute = useCallback(async (...args) => {
    if (!mountedRef.current) return;
    setStatus(STATUS.LOADING);
    setValue(null);
    setError(null);

    try {
      const result = await asyncFn(...args);
      if (!mountedRef.current) return result;
      setValue(result);
      setStatus(STATUS.SUCCESS);
      return result;
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err);
      setStatus(STATUS.ERROR);
      throw err;
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    setStatus(STATUS.IDLE);
    setValue(null);
    setError(null);
  }, []);

  return {
    execute,
    reset,
    status,
    value,
    error,
    isIdle:    status === STATUS.IDLE,
    isLoading: status === STATUS.LOADING,
    isSuccess: status === STATUS.SUCCESS,
    isError:   status === STATUS.ERROR,
  };
};

export default useAsync;