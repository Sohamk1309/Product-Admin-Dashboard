"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../../services/authService";

export default function LoginPage() {
const router = useRouter();

const [username, setUsername] = useState("");
const [password, setPassword] = useState("");

const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const handleSubmit = async (event) => {
event.preventDefault();

// Prevent duplicate login requests
if (loading) {
  return;
}

// Clear previous error
setError("");

// Basic validation
if (!username.trim() || !password.trim()) {
  setError("Please enter both username and password.");
  return;
}

try {
  setLoading(true);

  const data = await loginUser(
    username.trim(),
    password
  );

  localStorage.setItem(
    "accessToken",
    data.accessToken
  );

  router.push("/products");
} catch (error) {
  console.error("Login failed:", error);

  setError(
    "Invalid username or password. Please try again."
  );
} finally {
  setLoading(false);
}

};

return ( <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">

  {/* Login Card */}
  <div className="w-full max-w-md">

    {/* Branding */}
    <div className="mb-6 text-center">

      <h1 className="text-3xl font-bold text-gray-900">
        Product Admin Dashboard
      </h1>

      <p className="mt-2 text-sm text-gray-500">
        Sign in to manage your products
      </p>

    </div>

    {/* Card */}
    <div className="rounded-xl border bg-white p-8 shadow-sm">

      <div className="mb-6">

        <h2 className="text-xl font-semibold text-gray-900">
          Welcome back
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter your credentials to continue.
        </p>

      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* Login Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* Username */}
        <div>

          <label
            htmlFor="username"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Username
          </label>

          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              setError("");
            }}
            placeholder="Enter your username"
            autoComplete="username"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          />

        </div>

        {/* Password */}
        <div>

          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          />

        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

      </form>

    </div>

    {/* Footer */}
    <p className="mt-6 text-center text-xs text-gray-400">
      Product Management System
    </p>

  </div>

</main>

);
}
