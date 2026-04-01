/**
 * pages/SettingsPage.jsx
 * Account settings with tabbed sections:
 *   Profile · Change Password · Notifications · Danger Zone
 * Uses React Hook Form + Zod for all forms.
 */

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useAuth from "@/hooks/useAuth";
import useApi from "@/hooks/useApi";
import { updateUserApi } from "@/api/user.api";
import { uploadAvatarApi } from "@/api/upload.api";
import { profileSchema, changePasswordSchema } from "@/utils/validators";
import { checkPasswordStrength } from "@/utils/validators";
import Tabs           from "@/components/ui/Tabs";
import Card           from "@/components/ui/Card";
import FormInput      from "@/components/forms/FormInput";
import FormTextarea   from "@/components/forms/FormTextarea";
import Button         from "@/components/Button";
import Alert          from "@/components/Alert";
import Toggle         from "@/components/ui/Toggle";
import Badge          from "@/components/ui/Badge";
import AvatarUpload   from "@/components/upload/AvatarUpload";
import ConfirmDialog  from "@/components/ui/ConfirmDialog";
import { Icon }       from "@/components/icons/IconCollection";

// ── Profile tab ────────────────────────────────────────────────────────────
const ProfileTab = ({ user, fetchMe }) => {
  const { execute: updateUser, isLoading } = useApi(updateUserApi);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver:      zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "", phone: "", bio: "" },
  });

  const onSubmit = async (data) => {
    setError(""); setSuccess(false);
    try {
      await updateUser(user._id, data);
      await fetchMe();
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      {/* Avatar */}
      <Card title="Profile photo">
        <div className="flex items-center gap-5">
          <AvatarUpload
            currentUrl={user?.avatar}
            name={user?.name}
            onUpload={uploadAvatarApi}
            onSuccess={fetchMe}
            size="xl"
          />
          <div>
            <p className="text-sm font-medium text-gray-800">Profile picture</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · Max 5 MB</p>
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card title="Personal information">
        {success && <Alert type="success" message="Profile updated!" onClose={() => setSuccess(false)} className="mb-4" />}
        {error   && <Alert type="error"   message={error}           onClose={() => setError("")}   className="mb-4" />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput label="Full name"  name="name"  register={register} errors={errors}
            rules={{ required: true }} />
          <FormInput label="Email address" name="email" type="email"
            value={user?.email} disabled helperText="Email cannot be changed." />
          <FormInput label="Phone number" name="phone" type="tel"
            register={register} errors={errors} placeholder="+1 234 567 8900" />
          <FormTextarea label="Bio" name="bio" register={register} errors={errors}
            watch={watch} maxLength={300} rows={3} placeholder="Tell us a little about yourself…" />

          <div className="flex items-center justify-between pt-2">
            <Badge color="indigo" className="capitalize">{user?.role}</Badge>
            <Button type="submit" isLoading={isLoading}>Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// ── Password tab ───────────────────────────────────────────────────────────
const PasswordTab = ({ user }) => {
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPwd  = watch("newPassword", "");
  const strength = checkPasswordStrength(newPwd);

  const onSubmit = async (data) => {
    setError(""); setSuccess(false);
    try {
      // Call your change-password API here
      // await changePasswordApi({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      setSuccess(true);
      reset();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
    }
  };

  return (
    <div className="max-w-xl">
      <Card title="Change password" subtitle="You'll be logged out of all other sessions.">
        {success && <Alert type="success" message="Password changed successfully!" onClose={() => setSuccess(false)} className="mb-4" />}
        {error   && <Alert type="error"   message={error}                          onClose={() => setError("")}     className="mb-4" />}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput label="Current password" name="currentPassword" type="password"
            register={register} errors={errors} autoComplete="current-password" />

          <div>
            <FormInput label="New password" name="newPassword" type="password"
              register={register} errors={errors} autoComplete="new-password" />
            {newPwd && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= strength.score
                        ? ["","bg-red-400","bg-orange-400","bg-blue-400","bg-green-500"][strength.score]
                        : "bg-gray-200"
                    }`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strength.color}`}>{strength.label}</p>
              </div>
            )}
          </div>

          <FormInput label="Confirm new password" name="confirmPassword" type="password"
            register={register} errors={errors} autoComplete="new-password" />

          <div className="flex justify-end pt-1">
            <Button type="submit" isLoading={isSubmitting}>Update password</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// ── Notifications tab ──────────────────────────────────────────────────────
const NotificationsTab = () => {
  const [prefs, setPrefs] = useState({
    emailMarketing:  false,
    emailSecurity:   true,
    emailDigest:     true,
    pushAll:         false,
    pushMentions:    true,
  });

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const groups = [
    {
      title: "Email notifications",
      items: [
        { key: "emailSecurity",  label: "Security alerts",      desc: "Login attempts, password changes." },
        { key: "emailDigest",    label: "Weekly digest",         desc: "Summary of activity on your account." },
        { key: "emailMarketing", label: "Product updates",       desc: "New features and announcements." },
      ],
    },
    {
      title: "Push notifications",
      items: [
        { key: "pushMentions", label: "Mentions",       desc: "When someone mentions you." },
        { key: "pushAll",      label: "All activity",   desc: "Every action on your account." },
      ],
    },
  ];

  return (
    <div className="max-w-xl space-y-6">
      {groups.map((group) => (
        <Card key={group.title} title={group.title}>
          <div className="space-y-5">
            {group.items.map((item) => (
              <Toggle
                key={item.key}
                checked={prefs[item.key]}
                onChange={() => toggle(item.key)}
                label={item.label}
                description={item.desc}
                labelPosition="right"
              />
            ))}
          </div>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button>Save preferences</Button>
      </div>
    </div>
  );
};

// ── Danger zone tab ────────────────────────────────────────────────────────
const DangerTab = ({ user }) => {
  const [showDelete, setShowDelete] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="max-w-xl space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-gray-800">Delete account</p>
            <p className="text-sm text-gray-500 mt-1">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
            Delete
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={async () => { /* call deleteAccountApi then logout */ setShowDelete(false); }}
        title="Delete your account?"
        description={`This will permanently delete "${user?.name}"'s account and all data. You cannot undo this.`}
        confirmLabel="Yes, delete my account"
        variant="danger"
      />
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "profile",       label: "Profile",       icon: <Icon name="user"     size={14} /> },
  { id: "password",      label: "Password",      icon: <Icon name="lock"     size={14} /> },
  { id: "notifications", label: "Notifications", icon: <Icon name="bell"     size={14} /> },
  { id: "danger",        label: "Danger zone",   icon: <Icon name="warning"  size={14} /> },
];

const SettingsPage = () => {
  const [tab, setTab] = useState("profile");
  const { user, fetchMe } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account preferences.</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} variant="underline" />

      <div className="pt-2">
        {tab === "profile"       && <ProfileTab       user={user} fetchMe={fetchMe} />}
        {tab === "password"      && <PasswordTab      user={user} />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "danger"        && <DangerTab        user={user} />}
      </div>
    </div>
  );
};

export default SettingsPage;