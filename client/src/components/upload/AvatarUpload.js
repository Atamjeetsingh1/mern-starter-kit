/**
 * components/upload/AvatarUpload.jsx
 * Clickable avatar circle with a camera-icon overlay.
 * Selecting a file immediately uploads and previews it.
 *
 * Usage:
 *   <AvatarUpload
 *     currentUrl={user.avatar}
 *     name={user.name}
 *     onUpload={uploadAvatarApi}
 *     onSuccess={(result) => dispatch(updateAvatar(result.secure_url))}
 *   />
 */

import React, { useRef, useState } from "react";
import { Icon } from "../IconCollection";
import useUpload from "../../hooks/useUpload";
import Avatar from "../Avatar";

const AvatarUpload = ({
  currentUrl,
  name = "",
  onUpload,
  onSuccess,
  onError,
  size = "xl",    // matches Avatar size prop
  disabled = false,
}) => {
  const [preview, setPreview] = useState(currentUrl);
  const inputRef = useRef(null);
  const { upload, isUploading, error } = useUpload(onUpload);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview instantly — don't wait for cloud
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const data = await upload(file);
      // Replace local blob with the real Cloudinary URL
      URL.revokeObjectURL(localUrl);
      setPreview(data?.file?.secure_url ?? localUrl);
      onSuccess?.(data?.file ?? data);
    } catch (err) {
      // Revert preview on failure
      setPreview(currentUrl);
      onError?.(err);
    }

    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const SIZE_MAP = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };
  const px = SIZE_MAP[size] ?? 64;

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="relative inline-block group">
        {/* Avatar */}
        <Avatar name={name} src={preview} size={size} />

        {/* Overlay — shown on hover or while uploading */}
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          disabled={disabled}
          aria-label="Change profile picture"
          className={`
            absolute inset-0 rounded-full flex items-center justify-center
            bg-black/40 text-white
            transition-opacity duration-150
            ${isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {isUploading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <Icon name="edit" size={Math.max(14, px / 3)} />
          )}
        </button>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center max-w-[140px]">{error}</p>
      )}
    </div>
  );
};

export default AvatarUpload;