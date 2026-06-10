"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        // 1. Create account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        // 2. Sign in immediately (email confirmation is off)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          toast.success("Account created! Please sign in.");
          setIsSignUp(false);
          return;
        }

        // 3. Save profile
        if (signUpData.user) {
          await supabase.from("profiles").upsert(
            {
              id: signUpData.user.id,
              display_name: displayName.trim() || email.split("@")[0],
            },
            { onConflict: "id" }
          );
        }

        toast.success("Welcome to MealBuddy! 🎉");
        // Full reload so server components pick up the new session cookie
        window.location.href = "/family";
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
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
