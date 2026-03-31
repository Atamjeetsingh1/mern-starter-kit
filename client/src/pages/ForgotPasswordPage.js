/**
 * pages/ForgotPasswordPage.jsx
 * User enters their email → we send a reset link.
 * Uses React Hook Form + Zod for validation.
 */

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../api/auth.api";
import { ROUTES } from "../constants";
import AuthLayout  from "../layouts/AuthLayout";
import FormInput   from "../components/forms/FormInput";
import Button      from "../components/Button";
import Alert       from "../components/Alert";
import { MailIcon } from "../components/IconCollection";

// ── Zod schema ─────────────────────────────────────────────────────────────
const schema = z.object({
  email: z.string().min(1, "Email is required.").email("Enter a valid email address."),
});

const ForgotPasswordPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      await forgotPasswordApi(data);
      setSubmitted(true);
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    }
  };

  // ── Success state ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent a password reset link to your inbox."
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center py-6 gap-3 text-center">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <MailIcon size={24} className="text-green-600" />
            </div>
            <p className="text-sm text-gray-600 max-w-xs">
              The link expires in <strong>15 minutes</strong>. Check your spam folder if
              you don't see it.
            </p>
          </div>
          <Link
            to={ROUTES.LOGIN}
            className="block text-center text-sm text-indigo-600 hover:underline font-medium"
          >
            ← Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link."
      footerText="Remembered it?"
      footerLinkText="Log in"
      footerLinkTo={ROUTES.LOGIN}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {serverError && <Alert type="error" message={serverError} onClose={() => setServerError("")} />}

        <FormInput
          label="Email address"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          register={register}
          errors={errors}
          leftIcon={<MailIcon size={15} />}
        />

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;