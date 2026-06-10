"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, displayName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.needsSignIn) {
          toast.success("Account created! Please sign in.");
          setIsSignUp(false);
          return;
        }
        toast.success("Welcome to MealBuddy! 🎉");
        window.location.href = "/family";
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        window.location.href = "/";
      }
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
          Shop smarter. Eat Better. ❤️
        </p>
      </div>

      <div className="card w-full max-w-sm p-6">
        <h2 className="text-xl font-display font-black mb-5 text-center">
          {isSignUp ? "Create account" : "Welcome back!"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Your name
              </label>
              <input
                className="input"
                placeholder="e.g. Mum, Jamie, Dad..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Email</label>
            <input
              className="input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Password
            </label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
