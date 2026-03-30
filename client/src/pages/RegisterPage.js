/**
 * pages/RegisterPage.jsx
 * Registration form with role selection.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { ROUTES, USER_ROLES } from "../constants";
import AuthLayout from "../layouts/AuthLayout";
import Input from "../components/Input";
import Button from "../components/Button";
import Alert from "../components/Alert";

const INITIAL_FORM = {
  name: "",
  email: "",
  password: "",
  confirm: "",
  role: USER_ROLES.CUSTOMER,
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, resetError, isAuthenticated } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.DASHBOARD, { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    if (error) resetError();
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required.";
    if (!form.email) next.email = "Email is required.";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirm) next.confirm = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Exclude confirm from the payload
    const { confirm, ...payload } = form;
    await register(payload);
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Start your journey today."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo={ROUTES.LOGIN}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && <Alert type="error" message={error} onClose={resetError} />}

        <Input
          label="Full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Jane Doe"
          autoComplete="name"
          required
        />

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
          helperText="Minimum 8 characters."
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />

        <Input
          label="Confirm password"
          type="password"
          name="confirm"
          value={form.confirm}
          onChange={handleChange}
          error={errors.confirm}
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />

        {/* Role selector */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">I am a…</label>
          <div className="flex gap-3">
            {[USER_ROLES.CUSTOMER, USER_ROLES.PROVIDER].map((r) => (
              <label
                key={r}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer
                  text-sm font-medium transition-colors capitalize
                  ${form.role === r
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"}
                `}
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={form.role === r}
                  onChange={handleChange}
                  className="sr-only"
                />
                {r}
              </label>
            ))}
          </div>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;