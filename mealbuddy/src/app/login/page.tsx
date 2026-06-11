"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, passcode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isSignUp ? "Welcome to MealBuddy! 🎉" : "Welcome back! 👋");
      window.location.href = isSignUp ? "/family" : "/";
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-500 to-purple-700 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="text-7xl mb-3 animate-bounce-slow">🍽️</div>
        <h1 className="text-4xl font-display font-black text-white">
          Meal Buddy
        </h1>
        <p className="text-purple-100 mt-1 font-medium">
          Shop smarter. Eat better.
        </p>
      </div>

      <div className="card w-full max-w-sm p-6">
        <h2 className="text-xl font-display font-black mb-5 text-center">
          {isSignUp ? "Create account" : "Welcome back!"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Your name
            </label>
            <input
              className="input"
              placeholder="e.g. Mum, Jamie, Dad..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Passcode
            </label>
            <input
              className="input"
              type="password"
              placeholder="Choose a passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
              minLength={4}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? "Loading…" : isSignUp ? "Create account 🚀" : "Sign in 👋"}
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-gray-500">
          {isSignUp ? "Already have an account?" : "New here?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-purple-600 font-bold underline"
          >
            {isSignUp ? "Sign in" : "Create account"}
          </button>
        </p>
      </div>
    </div>
  );
}
