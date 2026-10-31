"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, AlertCircle, ArrowRight, Phone, Eye, EyeOff, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-context";

const COUNTRY_CODES = [
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+1", flag: "🇺🇸", name: "USA / Canada" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
];

export default function LoginPage() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("phone");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+880");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!password) {
      setError("পাসওয়ার্ড দিন (Password is required).");
      setLoading(false);
      return;
    }

    let targetEmail = "";

    try {
      if (loginMethod === "email") {
        if (!email.trim()) {
          setError("অনুগ্রহ করে আপনার ইমেইল দিন (Please enter your email).");
          setLoading(false);
          return;
        }
        targetEmail = email.trim().toLowerCase();
      } else {
        if (!phone.trim()) {
          setError("অনুগ্রহ করে আপনার মোবাইল নম্বর দিন (Please enter your mobile phone number).");
          setLoading(false);
          return;
        }

        // Resolve phone number to registered email account
        const resolveRes = await fetch("/api/auth/resolve-identifier", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: phone.trim(), countryCode }),
        });

        const resolveData = await resolveRes.json();
        if (!resolveRes.ok || resolveData.error || !resolveData.email) {
          setError(
            resolveData.error ||
              "এই নম্বরের সাথে কোনো অ্যাকাউন্ট পাওয়া যায়নি। সঠিক নম্বর দিন অথবা রেজিস্ট্রেশন করুন।"
          );
          setLoading(false);
          return;
        }
        targetEmail = resolveData.email;
      }

      // Authenticate with Supabase
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (authError) {
        if (
          authError.message.toLowerCase().includes("invalid login credentials") ||
          authError.message.toLowerCase().includes("invalid_grant")
        ) {
          setError("ভুল পাসওয়ার্ড অথবা অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে পাসওয়ার্ডটি চেক করুন।");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      const activeProfile = await refreshAuth();
      router.refresh();

      if (activeProfile?.account_status === "banned") {
        await supabase.auth.signOut();
        setError("This account has been permanently banned due to safety violations.");
        setLoading(false);
        return;
      }

      if (activeProfile?.account_status === "suspended") {
        await supabase.auth.signOut();
        setError("This account is temporarily suspended by platform moderators.");
        setLoading(false);
        return;
      }

      if (activeProfile?.role === "admin" || activeProfile?.role === "moderator") {
        router.push("/admin");
      } else if (activeProfile && !activeProfile.profile_complete) {
        router.push("/onboarding");
      } else {
        router.push("/discover");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log in. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-7 rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="text-center">
          <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500/10 to-amber-500/10 border border-rose-500/20 p-2 shadow-lg shadow-rose-500/10 mb-4 overflow-hidden">
            <Image
              src="/logo-icon.png"
              alt="CHA ADDA Logo"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">স্বাগতম (Welcome back)</h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Sign in to continue discovering genuine connections.
          </p>
        </div>

        {/* Method Toggle: Mobile Number vs Email */}
        <div className="grid grid-cols-2 p-1 bg-secondary/60 rounded-2xl border border-border/60">
          <button
            type="button"
            onClick={() => {
              setLoginMethod("phone");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              loginMethod === "phone"
                ? "bg-primary text-primary-foreground shadow-sm shadow-rose-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            <span>মোবাইল নম্বর (Phone)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod("email");
              setError(null);
            }}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              loginMethod === "email"
                ? "bg-primary text-primary-foreground shadow-sm shadow-rose-500/20"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>ইমেইল (Email)</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {loginMethod === "phone" ? (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                মোবাইল নম্বর (Mobile Phone Number)
              </label>
              <div className="flex gap-2">
                <div className="relative w-36 shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-background py-2 pl-3 pr-7 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={`${c.code}-${c.name}`} value={c.code}>
                        {c.flag} {c.code} ({c.name})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground text-[10px]">
                    ▼
                  </div>
                </div>

                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={countryCode === "+880" ? "01712345678" : "Mobile number"}
                    className="w-full h-11 rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <Globe className="h-3 w-3 text-primary/70 shrink-0" />
                <span>যেকোনো দেশের নম্বর দিয়ে লগইন করা যাবে (All countries supported).</span>
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                ইমেইল ঠিকানা (Email Address)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 rounded-xl border border-border bg-background py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                পাসওয়ার্ড (Password)
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl border border-border bg-background py-2 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? "লগইন হচ্ছে..." : "সাইন ইন করুন (Sign In)"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Registration Link */}
        <div className="text-center text-xs text-muted-foreground pt-2">
          এখনো অ্যাকাউন্ট নেই? (Don’t have an account?){" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            নতুন অ্যাকাউন্ট তৈরি করুন (Register)
          </Link>
        </div>
      </div>
    </div>
  );
}
