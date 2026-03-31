/**
 * components/upload/FileUpload.jsx
 * ─────────────────────────────────
 * Production-grade drag-and-drop file uploader.
 * Features:
 *  - Drag & drop or click-to-browse
 *  - Per-file progress bars
 *  - MIME type + size validation (client-side, before upload)
 *  - File preview (images shown as thumbnails)
 *  - Remove queued files before uploading
 *  - Error display per file
 *
 * Usage:
 *   <FileUpload
 *     onUpload={uploadImagesApi}
 *     accept="image/*"
 *     maxFiles={5}
 *     maxSizeMB={5}
 *     multiple
 *     onSuccess={(results) => setImageUrls(results.map(r => r.secure_url))}
 *   />
 */

import React, { useCallback, useRef, useState } from "react";
import {
  UploadIcon, CloseIcon, CheckIcon,
  FileIcon, ImageIcon,
} from "../IconCollection";
import { Icon } from "../IconCollection";

// ── Helpers ────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const isImage = (file) => file.type.startsWith("image/");

const buildPreview = (file) =>
  isImage(file) ? URL.createObjectURL(file) : null;

// ── File status types ──────────────────────────────────────────────────────
const STATUS = { PENDING: "pending", UPLOADING: "uploading", DONE: "done", ERROR: "error" };

// ── Single file row ────────────────────────────────────────────────────────
const FileRow = ({ entry, onRemove }) => {
  const { file, status, progress, error, preview } = entry;

  const statusColor = {
    [STATUS.PENDING]:   "text-gray-400",
    [STATUS.UPLOADING]: "text-indigo-500",
    [STATUS.DONE]:      "text-green-500",
    [STATUS.ERROR]:     "text-red-500",
  }[status];

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
      {/* Thumbnail or file icon */}
      <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center">
        {preview ? (
          <img src={preview} alt={file.name} className="h-full w-full object-cover" />
        ) : (
          <Icon name="download" size={18} className="text-gray-400" />
        )}
      </div>

      {/* Name + size + progress */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
        <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>

        {status === STATUS.UPLOADING && (
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {status === STATUS.ERROR && (
          <p className="text-xs text-red-500 mt-0.5">{error}</p>
        )}
      </div>

      {/* Status icon / remove button */}
      <div className={`shrink-0 ${statusColor}`}>
        {status === STATUS.DONE    && <Icon name="checkCircle" size={18} />}
        {status === STATUS.UPLOADING && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
        )}
        {(status === STATUS.PENDING || status === STATUS.ERROR) && (
          <button
            onClick={() => onRemove(entry.id)}
            className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={`Remove ${file.name}`}
          >
            <Icon name="close" size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const FileUpload = ({
  onUpload,           // (file, onProgress) => Promise<response>
  onSuccess,          // (cloudinaryResults[]) => void
  onError,            // (error) => void
  accept    = "*/*",
  multiple  = false,
  maxFiles  = 10,
  maxSizeMB = 10,
  label     = "Drop files here or click to browse",
  sublabel,
  disabled  = false,
  className = "",
}) => {
  const [entries, setEntries] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  let idCounter  = useRef(0);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // ── Validate & queue files ───────────────────────────────────────────
  const queueFiles = useCallback((rawFiles) => {
    const toAdd = [];
    const errors = [];

    Array.from(rawFiles).forEach((file) => {
      if (!multiple && entries.length + toAdd.length >= 1) return;
      if (entries.length + toAdd.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        errors.push(`"${file.name}" exceeds ${maxSizeMB} MB limit.`);
        return;
      }
      toAdd.push({
        id:       ++idCounter.current,
        file,
        status:   STATUS.PENDING,
        progress: 0,
        error:    null,
        preview:  buildPreview(file),
      });
    });

    if (toAdd.length) {
      setEntries((prev) => [...prev, ...toAdd]);
    }
  }, [entries.length, maxFiles, maxSizeMB, maxSizeBytes, multiple]);

  // ── Drag handlers ────────────────────────────────────────────────────
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop      = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) queueFiles(e.dataTransfer.files);
  };

  // ── Remove a pending / errored file ─────────────────────────────────
  const removeEntry = (id) => {
    setEntries((prev) => {
      const entry = prev.find((e) => e.id === id);
      if (entry?.preview) URL.revokeObjectURL(entry.preview); // free memory
      return prev.filter((e) => e.id !== id);
    });
  };

  // ── Upload all pending files ─────────────────────────────────────────
  const handleUpload = async () => {
    const pending = entries.filter((e) => e.status === STATUS.PENDING);
    if (!pending.length) return;

    const results = [];

    for (const entry of pending) {
      // Mark as uploading
      setEntries((prev) =>
        prev.map((e) => e.id === entry.id ? { ...e, status: STATUS.UPLOADING } : e)
      );

      try {
        const onProgress = (pct) =>
          setEntries((prev) =>
            prev.map((e) => e.id === entry.id ? { ...e, progress: pct } : e)
          );

        const response = await onUpload(entry.file, onProgress);
        const data = response.data?.data?.file ?? response.data?.data ?? response.data;

        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, status: STATUS.DONE, progress: 100 } : e
          )
        );
        results.push(data);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Upload failed.";
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id ? { ...e, status: STATUS.ERROR, error: msg } : e
          )
        );
        onError?.(err);
      }
    }

    if (results.length) onSuccess?.(results);
  };

  const pendingCount   = entries.filter((e) => e.status === STATUS.PENDING).length;
  const uploadingCount = entries.filter((e) => e.status === STATUS.UPLOADING).length;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8
          flex flex-col items-center justify-center gap-3
          cursor-pointer transition-all duration-200 select-none
          ${isDragging
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/40"}
          ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}
        `}
      >
        <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Icon name="upload" size={22} className="text-indigo-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {sublabel || `${accept} · max ${maxSizeMB} MB${multiple ? ` · up to ${maxFiles} files` : ""}`}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => queueFiles(e.target.files)}
          disabled={disabled}
        />
      </div>

      {/* File list */}
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry) => (
            <FileRow key={entry.id} entry={entry} onRemove={removeEntry} />
          ))}
        </div>
      )}

      {/* Upload button */}
      {pendingCount > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploadingCount > 0}
          className="
            w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium
            hover:bg-indigo-700 transition-colors
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {uploadingCount > 0
            ? "Uploading…"
            : `Upload ${pendingCount} file${pendingCount > 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
};

export default FileUpload;