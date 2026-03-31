/**
 * pages/ProfilePage.jsx
 * Displays and edits the current user's profile via useApi hook.
 */

import React, { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import { updateUserApi } from "../api/user.api";
import { uploadAvatarApi } from "../api/upload.api";
import AvatarUpload from "../components/upload/AvatarUpload";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";
import { Icon } from "../components/IconCollection";

const ProfilePage = () => {
  const { user, fetchMe } = useAuth();
  console.log("ProfilePage render - user data:", user);
  const { execute: updateUser, isLoading: isUpdating, error: updateError } = useApi(updateUserApi);

  const [name, setName] = useState(user?.name ?? "");
  const [success, setSuccess] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Sync user data when it changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
    }
  }, [user]);


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
        <AvatarUpload
          currentUrl={user?.avatar}
          name={user?.name || ""}
          onUpload={uploadAvatarApi}
          onSuccess={() => {
            fetchMe();
            setUploadSuccess(true);
          }}
          onError={() => setUploadSuccess(false)}
        />
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full capitalize">
              {user?.role}
            </span>
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
        {updateError && (
          <Alert type="error" message={updateError} />
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