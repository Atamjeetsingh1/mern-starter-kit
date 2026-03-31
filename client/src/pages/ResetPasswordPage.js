/**
 * pages/ResetPasswordPage.jsx
 * Reads token + email from URL query params → lets user set a new password.
 * Uses React Hook Form + Zod.
 */

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordApi } from "../api/auth.api";
import { ROUTES } from "../constants";
import AuthLayout from "../layouts/AuthLayout";
import FormInput from "../components/forms/FormInput";
import Button from "../components/Alert";
import Alert from "../components/Alert";

// ── Zod schema ─────────────────────────────────────────────────────────────
const schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password is too long."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

// ── Password strength indicator ────────────────────────────────────────────
const strength = (pwd = "") => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

const PasswordStrength = ({ password }) => {
  const s = strength(password);
  if (!password) return null;
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= s ? STRENGTH_COLORS[s] : "bg-gray-200"
              }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${s >= 3 ? "text-green-600" : s === 2 ? "text-yellow-600" : "text-red-500"}`}>
        {STRENGTH_LABELS[s]}
      </p>
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const passwordValue = watch("password", "");

  // ── Guard: missing token/email ────────────────────────────────────────
  if (!token || !email) {
    return (
      <AuthLayout title="Invalid link" subtitle="This password reset link is missing required information.">
        <Alert type="error" message="Please request a new password reset link." />
        <Link
          to="/forgot-password"
          className="block mt-5 text-center text-sm text-indigo-600 hover:underline font-medium"
        >
          Request new link
        </Link>
      </AuthLayout>
    );
  }

  const onSubmit = async ({ password, confirmPassword }) => {
    setServerError("");
    try {
      await resetPasswordApi({ token, email, password, confirmPassword });
      setSuccess(true);
      // Redirect to login after 2 s
      setTimeout(() => navigate(ROUTES.LOGIN), 2000);
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Reset failed. The link may have expired."
      );
    }
  };

  // ── Success ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <AuthLayout title="Password updated!" subtitle="You'll be redirected to login in a moment.">
        <Alert type="success" message="Your password has been reset successfully." />
        <Link
          to={ROUTES.LOGIN}
          className="block mt-5 text-center text-sm text-indigo-600 hover:underline font-medium"
        >
          Go to login →
        </Link>
      </AuthLayout>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your account."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {serverError && (
          <Alert type="error" message={serverError} onClose={() => setServerError("")} />
        )}

        <div>
          <FormInput
            label="New password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            register={register}
            errors={errors}
          />
          <PasswordStrength password={passwordValue} />
        </div>

        <FormInput
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          register={register}
          errors={errors}
        />

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;