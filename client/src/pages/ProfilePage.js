/**
 * pages/ProfilePage.jsx
 * Displays and edits the current user's profile via useApi hook.
 */

import React, { useState } from "react";
import useAuth from "../hooks/useAuth";
import useApi from "../hooks/useApi";
import { updateUserApi } from "../api/user.api";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

const ProfilePage = () => {
  const { user, fetchMe } = useAuth();
  const { execute: updateUser, isLoading, error } = useApi(updateUserApi);

  const [name, setName] = useState(user?.name ?? "");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    try {
      await updateUser(user._id, { name });
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
        <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 select-none">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="mt-1 inline-block text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full capitalize">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Edit Profile</h2>

        {success && (
          <Alert type="success" message="Profile updated successfully." onClose={() => setSuccess(false)} />
        )}
        {error && <Alert type="error" message={error} />}

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

          <Button type="submit" isLoading={isLoading}>
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;