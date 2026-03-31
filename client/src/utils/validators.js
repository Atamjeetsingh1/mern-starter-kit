/**
 * utils/validators.js
 * Reusable Zod schemas and validation helpers shared across forms.
 * Import individual schemas and compose them with .merge() / .extend().
 */

import { z } from "zod";

// ── Primitive field schemas ────────────────────────────────────────────────

export const nameSchema = z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(60, "Name cannot exceed 60 characters.")
    .trim();

export const emailSchema = z
    .string()
    .min(1, "Email is required.")
    .email("Enter a valid email address.")
    .toLowerCase()
    .trim();

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password cannot exceed 72 characters.");

export const confirmPasswordSchema = (passwordField = "password") =>
    z.string().min(1, "Please confirm your password.");

export const phoneSchema = z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal(""));

export const urlSchema = z
    .string()
    .url("Enter a valid URL.")
    .optional()
    .or(z.literal(""));

// ── Composite auth schemas ─────────────────────────────────────────────────

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required."),
});

export const registerSchema = z
    .object({
        name: nameSchema,
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string().min(1, "Please confirm your password."),
        role: z.enum(["customer", "provider"]).default("customer"),
    })
    .refine((d) => d.password === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match.",
    });

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const resetPasswordSchema = z
    .object({
        password: passwordSchema,
        confirmPassword: z.string().min(1, "Please confirm your password."),
    })
    .refine((d) => d.password === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match.",
    });

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required."),
        newPassword: passwordSchema,
        confirmPassword: z.string().min(1, "Please confirm your new password."),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        path: ["confirmPassword"],
        message: "Passwords do not match.",
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
        path: ["newPassword"],
        message: "New password must be different from your current password.",
    });

// ── Profile schema ─────────────────────────────────────────────────────────

export const profileSchema = z.object({
    name: nameSchema,
    phone: phoneSchema,
    website: urlSchema,
    bio: z.string().max(300, "Bio cannot exceed 300 characters.").optional(),
});

// ── Password strength checker (non-Zod) ───────────────────────────────────

/**
 * Score a password's strength 0-4.
 * @param {string} pwd
 * @returns {{ score: 0|1|2|3|4, label: string, color: string }}
 */
export const checkPasswordStrength = (pwd = "") => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const clamped = Math.min(4, score);
    const meta = [
        { label: "Too short", color: "text-gray-400" },
        { label: "Weak", color: "text-red-500" },
        { label: "Fair", color: "text-orange-500" },
        { label: "Good", color: "text-blue-500" },
        { label: "Strong", color: "text-green-600" },
    ];

    return { score: clamped, ...meta[clamped] };
};