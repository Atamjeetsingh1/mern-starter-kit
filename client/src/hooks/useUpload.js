/**
 * hooks/useUpload.js
 * Generic upload hook — handles progress, errors, and result state
 * for any upload API function.
 *
 * Usage:
 *   const { upload, progress, isUploading, result, error, reset } =
 *     useUpload(uploadSingleApi);
 *
 *   const handleFile = async (file) => {
 *     const data = await upload(file);
 *     console.log(data.file.secure_url);
 *   };
 */

import { useState, useCallback } from "react";

const useUpload = (uploadFn) => {
  const [progress,    setProgress]    = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [result,      setResult]      = useState(null);
  const [error,       setError]       = useState(null);

  const upload = useCallback(
    async (...args) => {
      try {
        setIsUploading(true);
        setProgress(0);
        setError(null);
        setResult(null);

        // Pass a progress callback as the last argument
        const response = await uploadFn(...args, setProgress);
        const data = response.data?.data ?? response.data;

        setResult(data);
        setProgress(100);
        return data;
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Upload failed. Please try again.";
        setError(msg);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFn]
  );

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setResult(null);
    setError(null);
  }, []);

  return { upload, progress, isUploading, result, error, reset };
};

export default useUpload;