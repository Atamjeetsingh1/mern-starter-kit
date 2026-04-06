/**
 * models/User.js
 * Mongoose schema + model for the User collection.
 * Password hashing is handled via a pre-save hook so it's automatic
 * regardless of where a user is created/updated.
 */

const mongoose = require("mongoose");
const { hashPassword } = require("../utils/password.utils");
const { USER_ROLES } = require("../constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [60, "Name cannot exceed 60 characters."],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true, // Creates a unique index automatically
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."],
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password must be at least 8 characters."],
      select: false, // Never return password in query results by default
    },

    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: `Role must be one of: ${Object.values(USER_ROLES).join(", ")}`,
      },
      default: USER_ROLES.CUSTOMER,
    },

    // ── Media ──────────────────────────────────────────────────────────────
    avatar: {
      type: String,
      default: null,   // Cloudinary secure_url stored here after upload
    },

    coverImage: {
      type: String,
      default: null,
    },

    // Stores the hashed refresh token so we can invalidate sessions server-side
    refreshToken: {
      type: String,
      select: false,
    },

    // ── Password reset ─────────────────────────────────────────────────
    // Stores SHA-256 hash of the plain token sent to the user's email.
    // Plain token is NEVER stored — only the hash for comparison.
    resetPasswordToken: {
      type: String,
      select: false,        // Never returned in queries by default
    },
    // Token expiry — set to 15 min from generation time
    resetPasswordExpire: {
      type: Date,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Email verification ─────────────────────────────────────────────────
    // Set to true after the user clicks the verification link.
    // Use the requireVerified middleware to gate protected routes.
    isEmailVerified: {
      type:    Boolean,
      default: false,
      index:   true,   // Allows efficient queries: "find all unverified users"
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationOTP: {
      type: String,
      select: false,
    },
    emailVerificationExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt & updatedAt automatically
    versionKey: false, // Remove __v field
    toJSON: {
      // Strip all sensitive fields when serialising to JSON responses
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpire;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationOTP;
        delete ret.emailVerificationExpire;
        return ret;
      },
    },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
// email already has unique: true which creates an index.
// Add compound indexes below as the app grows, e.g.:
// userSchema.index({ role: 1, createdAt: -1 });

// ── Pre-save hook: hash password on create / password change ──────────────
userSchema.pre("save", async function () {
  // Only hash if the password field was modified
  if (!this.isModified("password")) return;

  this.password = await hashPassword(this.password);
});

// ── Instance method: expose role check ────────────────────────────────────
userSchema.methods.hasRole = function (role) {
  return this.role === role;
};

const User = mongoose.model("User", userSchema);

module.exports = User;