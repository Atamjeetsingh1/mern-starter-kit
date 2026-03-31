/**
 * components/upload/ImageGalleryUpload.jsx
 * Multi-image uploader that shows a preview grid.
 * - Upload up to `maxImages` images
 * - Individual remove
 * - Progress per image
 * - Returns array of Cloudinary URLs via onSuccess
 *
 * Usage:
 *   <ImageGalleryUpload
 *     onUpload={uploadImagesApi}
 *     onSuccess={(files) => setImages(files.map(f => f.secure_url))}
 *     maxImages={6}
 *     existingImages={post.images}
 *   />
 */

import React, { useRef, useState } from "react";
import { Icon } from "../IconCollection";

const ImageGalleryUpload = ({
  onUpload,
  onSuccess,
  onError,
  maxImages       = 6,
  maxSizeMB       = 5,
  existingImages  = [],    // Array of URLs already saved
  disabled        = false,
  className       = "",
}) => {
  const [saved,     setSaved]     = useState(existingImages);   // already on server
  const [queued,    setQueued]    = useState([]);                // local previews
  const [uploading, setUploading] = useState(false);
  const [errors,    setErrors]    = useState([]);
  const inputRef = useRef(null);

  const maxBytes = maxSizeMB * 1024 * 1024;
  const remaining = maxImages - saved.length - queued.length;

  const addFiles = (files) => {
    const valid = [];
    const errs  = [];

    Array.from(files).slice(0, remaining).forEach((f) => {
      if (!f.type.startsWith("image/")) {
        errs.push(`"${f.name}" is not an image.`);
      } else if (f.size > maxBytes) {
        errs.push(`"${f.name}" exceeds ${maxSizeMB} MB.`);
      } else {
        valid.push({ file: f, preview: URL.createObjectURL(f) });
      }
    });

    setErrors(errs);
    if (valid.length) setQueued((p) => [...p, ...valid]);
  };

  const removeQueued = (idx) => {
    setQueued((p) => {
      URL.revokeObjectURL(p[idx].preview);
      return p.filter((_, i) => i !== idx);
    });
  };

  const removeSaved = (url) => setSaved((p) => p.filter((u) => u !== url));

  const handleUpload = async () => {
    if (!queued.length) return;
    setUploading(true);
    setErrors([]);

    try {
      const files    = queued.map((q) => q.file);
      const response = await onUpload(files);
      const data     = response.data?.data?.files ?? [];

      // Revoke object URLs
      queued.forEach((q) => URL.revokeObjectURL(q.preview));
      setQueued([]);

      const newUrls = data.map((f) => f.secure_url);
      setSaved((p) => [...p, ...newUrls]);
      onSuccess?.(data);
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed.";
      setErrors([msg]);
      onError?.(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {/* Saved images */}
        {saved.map((url) => (
          <div key={url} className="relative aspect-square rounded-xl overflow-hidden group">
            <img src={url} alt="" className="h-full w-full object-cover" />
            {!disabled && (
              <button
                onClick={() => removeSaved(url)}
                className="
                  absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white
                  flex items-center justify-center opacity-0 group-hover:opacity-100
                  transition-opacity
                "
                aria-label="Remove image"
              >
                <Icon name="close" size={12} />
              </button>
            )}
          </div>
        ))}

        {/* Queued (local preview) */}
        {queued.map((q, i) => (
          <div key={q.preview} className="relative aspect-square rounded-xl overflow-hidden group">
            <img src={q.preview} alt="" className="h-full w-full object-cover opacity-70" />
            <div className="absolute inset-0 flex items-center justify-center">
              {uploading ? (
                <svg className="animate-spin h-5 w-5 text-white drop-shadow" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              ) : (
                <button
                  onClick={() => removeQueued(i)}
                  className="h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                  aria-label="Remove"
                >
                  <Icon name="close" size={13} />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add tile */}
        {remaining > 0 && !disabled && (
          <button
            onClick={() => inputRef.current?.click()}
            className="
              aspect-square rounded-xl border-2 border-dashed border-gray-200
              flex flex-col items-center justify-center gap-1
              text-gray-400 hover:border-indigo-400 hover:text-indigo-500
              transition-colors bg-gray-50 hover:bg-indigo-50/40
            "
            aria-label="Add images"
          >
            <Icon name="plus" size={20} />
            <span className="text-xs">Add</span>
          </button>
        )}
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
      />

      {/* Errors */}
      {errors.map((e, i) => (
        <p key={i} className="text-xs text-red-500">{e}</p>
      ))}

      {/* Upload button */}
      {queued.length > 0 && !uploading && (
        <button
          onClick={handleUpload}
          className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Upload {queued.length} image{queued.length > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
};

export default ImageGalleryUpload;