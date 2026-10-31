import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { validateAndFormatPhone } from "@/lib/utils/phone";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, countryCode = "+880" } = body;

    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return NextResponse.json(
        { error: "ইমেইল বা মোবাইল নম্বর দিন (Enter email or mobile number)." },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();

    // 1. Direct Email Identification
    if (trimmed.includes("@")) {
      return NextResponse.json({
        success: true,
        email: trimmed.toLowerCase(),
        mode: "email",
      });
    }

    // 2. Mobile Phone Number Identification (International support for all countries)
    const phoneResult = validateAndFormatPhone(trimmed, countryCode);
    if (!phoneResult.isValid) {
      return NextResponse.json(
        { error: phoneResult.error || "সঠিক মোবাইল নম্বর দিন (Please provide a valid mobile number)." },
        { status: 400 }
      );
    }

    const cleanPhone = phoneResult.cleanPhone;
    const cleanDigits = cleanPhone.replace(/\D/g, "");

    const { isSupabaseConfigured } = getAppEnv();

    // In local development / mock store mode
    if (!isSupabaseConfigured) {
      const allProfiles = devStore.getAllProfiles();
      const matched = allProfiles.find((p) => {
        const pDigits = (p.phone || "").replace(/\D/g, "");
        return pDigits === cleanDigits || p.phone === cleanPhone;
      });

      if (matched) {
        const email =
          matched.email ||
          `${matched.display_name.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"}@chaadda.com`;
        return NextResponse.json({
          success: true,
          email,
          phone: cleanPhone,
          mode: "phone",
        });
      }

      return NextResponse.json(
        {
          error:
            "এই মোবাইল নম্বরের সাথে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নম্বরটি চেক করুন অথবা নতুন একাউন্ট খুলুন।",
        },
        { status: 404 }
      );
    }

    const adminSupabase = createAdminClient();

    // Step A: Search in profiles table by phone
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("id, phone")
      .eq("phone", cleanPhone)
      .maybeSingle();

    if (profile?.id) {
      const { data: authUserRes } = await adminSupabase.auth.admin.getUserById(profile.id);
      if (authUserRes?.user?.email) {
        return NextResponse.json({
          success: true,
          email: authUserRes.user.email,
          phone: cleanPhone,
          mode: "phone",
        });
      }
    }

    // Step B: Search auth.users directly by phone or metadata phone
    try {
      const { data: authUsersData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
      if (authUsersData?.users) {
        const found = authUsersData.users.find((u) => {
          const uPhoneDigits = (u.phone || "").replace(/\D/g, "");
          const metaPhoneDigits = String(u.user_metadata?.phone || "").replace(/\D/g, "");
          return (
            (uPhoneDigits && uPhoneDigits === cleanDigits) ||
            (metaPhoneDigits && metaPhoneDigits === cleanDigits) ||
            u.phone === cleanPhone
          );
        });

        if (found?.email) {
          return NextResponse.json({
            success: true,
            email: found.email,
            phone: cleanPhone,
            mode: "phone",
          });
        }
      }
    } catch (listErr) {
      console.warn("Could not list auth users for phone resolution:", listErr);
    }

    return NextResponse.json(
      {
        error:
          "এই মোবাইল নম্বরের সাথে কোনো অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে সঠিক নম্বর দিন অথবা রেজিস্ট্রেশন করুন।",
      },
      { status: 404 }
    );
  } catch (err: unknown) {
    console.error("POST /api/auth/resolve-identifier error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal authentication error." },
      { status: 500 }
    );
  }
}
