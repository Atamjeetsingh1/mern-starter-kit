/**
 * pages/ProfilePage.jsx
 * Displays and edits the current user's profile via useApi hook.
 */

import React, { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import { updateUserApi, uploadAvatarApi } from "../api/user.api";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";
import { Icon } from "../components/IconCollection";

const ProfilePage = () => {
  const { user, fetchMe } = useAuth();
  console.log("ProfilePage render - user data:", user);
  const { execute: updateUser, isLoading: isUpdating, error: updateError } = useApi(updateUserApi);
  const { execute: uploadAvatar, isLoading: isUploading, error: uploadError } = useApi(uploadAvatarApi);

  const [name, setName] = useState(user?.name ?? "");
  const [success, setSuccess] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Sync user data when it changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadSuccess(false);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await uploadAvatar(formData);
      await fetchMe();
      setUploadSuccess(true);
    } catch {
      // Error handled by useApi
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);

    // Safety check - ensure user ID exists (handles both MongoDB _id and mapped id)
    const userId = user?.id || user?._id;
    if (!user || !userId) {
      console.error("User data not available:", user);
      return;
    }

    try {
      await updateUser(userId, { name });
      await fetchMe(); // Refresh Redux + localStorage
      setSuccess(true);
    } catch {
      // error state is managed by useApi
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account information.</p>
      </div>

      {/* Avatar + meta */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5">
        <div className="relative group">
          <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 select-none overflow-hidden border-2 border-white shadow-sm">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
          >
            <Icon name="upload" size={24} />
          </label>
          <input
            id="avatar-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={isUploading}
          />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full capitalize">
              {user?.role}
            </span>
            {isUploading && <span className="text-xs text-gray-400 animate-pulse">Uploading...</span>}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Edit Profile</h2>

        {success && (
          <Alert type="success" message="Profile updated successfully." onClose={() => setSuccess(false)} />
        )}
        {uploadSuccess && (
          <Alert type="success" message="Avatar updated successfully." onClose={() => setUploadSuccess(false)} />
        )}
        {(updateError || uploadError) && (
          <Alert type="error" message={updateError || uploadError} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email address"
            type="email"
            value={user?.email ?? ""}
            disabled
            helperText="Email cannot be changed."
          />
          <Input
            label="Role"
            value={user?.role ?? ""}
            disabled
            helperText="Contact support to change your role."
          />

          <Button type="submit" isLoading={isUpdating}>
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;