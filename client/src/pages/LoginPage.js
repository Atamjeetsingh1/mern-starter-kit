/**
 * pages/LoginPage.jsx
 * Login form — dispatches loginUser thunk, redirects to intended destination.
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES } from "../constants";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";
import SocialAuthButtons from "../components/SocialAuthButtons";

const INITIAL_FORM = { email: "", password: "" };

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, resetError, isAuthenticated } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname ?? ROUTES.DASHBOARD;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Clear redux error when user starts typing again
  const handleChange = (e) => {
    if (error) resetError();
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Client-side validation before hitting the server
  const validate = () => {
    const next = {};
    if (!form.email) next.email = "Email is required.";
    if (!form.password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(form);
    // If fulfilled, the useEffect above handles redirect
    if (result.meta?.requestStatus === "rejected") return;
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue."
      footerText="Don't have an account?"
      footerLinkText="Create one"
      footerLinkTo={ROUTES.REGISTER}
    >
      {/* Social login buttons */}
      <SocialAuthButtons mode="login" disabled={isLoading} />

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-gray-500">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Server-level error */}
        {error && (
          <Alert type="error" message={error} onClose={resetError} />
        )}

        <Input
          label="Email address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          className="mt-2"
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;