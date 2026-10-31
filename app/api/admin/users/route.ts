import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAppEnv } from "@/lib/config/env";
import { devStore } from "@/lib/services/dev-store";
import { Profile } from "@/types/database";


export async function GET(request: Request) {
  try {
    const { isSupabaseConfigured } = getAppEnv();

    if (!isSupabaseConfigured) {
      const devUsers = devStore.getAllProfiles().map((p) => ({
        ...p,
        email: p.email || `${p.display_name.toLowerCase().replace(/[^a-z0-9]/g, "") || "user"}@chaadda.com`,
      }));
      return NextResponse.json({ users: devUsers });
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const adminClient = createAdminClient();
    let isAuthorized = false;

    if (authUser) {
      const { data: adminProfile } = await adminClient
        .from("profiles")
        .select("id, role, account_status")
        .eq("id", authUser.id)
        .maybeSingle();

      if (
        adminProfile &&
        (adminProfile.role === "admin" || adminProfile.role === "moderator")
      ) {
        isAuthorized = true;
      }
    }

    // In local development, allow Trust & Safety Console access
    if (!isAuthorized && process.env.NODE_ENV !== "production") {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Administrator or Moderator role required." },
        { status: 403 }
      );
    }

    // Fetch all profiles using service role (bypasses RLS so suspended and banned users are included)
    const { data: profiles, error: pErr } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (pErr) {
      console.error("Failed to fetch profiles in admin API:", pErr);
      return NextResponse.json({ users: devStore.getAllProfiles() });
    }

    // Fetch auth metadata to merge verified, verified_until, phone & email
    let authUserMap = new Map<
      string,
      { meta: Record<string, unknown>; phone?: string | null; email?: string | null }
    >();
    try {
      const { data: authUsersData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (authUsersData?.users) {
        authUserMap = new Map(
          authUsersData.users.map((u) => [
            u.id,
            {
              meta: (u.user_metadata as Record<string, unknown>) || {},
              phone: u.phone || (u.user_metadata?.phone as string | undefined) || null,
              email: u.email || null,
            },
          ])
        );
      }
    } catch (authErr) {
      console.warn("Could not list auth users metadata:", authErr);
    }

    const enrichedProfiles: Profile[] = (profiles || []).map((p) => {
      const authInfo = authUserMap.get(p.id);
      const meta = authInfo?.meta || {};
      return {
        ...p,
        email: p.email || authInfo?.email || null,
        phone: p.phone || authInfo?.phone || (meta.phone as string | undefined) || null,
        verified: p.verified ?? (meta.verified as boolean | undefined) ?? false,
        verified_until:
          p.verified_until ?? (meta.verified_until as string | null | undefined) ?? null,
      } as Profile;
    });

    return NextResponse.json({ users: enrichedProfiles });
  } catch (err: unknown) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId || !updates) {
      return NextResponse.json(
        { error: "userId and updates are required." },
        { status: 400 }
      );
    }

    const { isSupabaseConfigured } = getAppEnv();

    if (!isSupabaseConfigured) {
      if (updates.account_status) {
        devStore.updateUserStatus(
          userId,
          updates.account_status,
          "admin-dev",
          updates.reason
        );
      }
      const existing = devStore.getProfile(userId);
      if (existing) {
        devStore.saveProfile({ ...existing, ...updates } as Profile);
      }
      return NextResponse.json({ success: true });
    }

    // 1. Verify caller session
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const adminClient = createAdminClient();
    let isAuthorized = false;

    if (authUser) {
      const { data: adminProfile } = await adminClient
        .from("profiles")
        .select("id, role, account_status")
        .eq("id", authUser.id)
        .maybeSingle();

      if (
        adminProfile &&
        (adminProfile.role === "admin" || adminProfile.role === "moderator")
      ) {
        if (adminProfile.role === "moderator" && updates.role === "admin") {
          return NextResponse.json(
            { error: "Forbidden: Only Administrators can promote to Admin." },
            { status: 403 }
          );
        }
        isAuthorized = true;
      }
    }

    if (!isAuthorized && process.env.NODE_ENV !== "production") {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Administrator or Moderator role required." },
        { status: 403 }
      );
    }

    // 2. Perform update using server admin client (bypasses RLS)
    const { reason, ...profileFields } = updates;

    // Sync verification metadata to Supabase Auth user_metadata
    if (updates.verified !== undefined || updates.verified_until !== undefined) {
      try {
        const { data: targetAuth } = await adminClient.auth.admin.getUserById(userId);
        if (targetAuth?.user) {
          const currentMeta = targetAuth.user.user_metadata || {};
          await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...currentMeta,
              verified: updates.verified !== undefined ? updates.verified : currentMeta.verified,
              verified_until:
                updates.verified_until !== undefined
                  ? updates.verified_until
                  : currentMeta.verified_until,
            },
          });
        }
      } catch (authMetaErr) {
        console.warn("Failed to update target user auth metadata:", authMetaErr);
      }
    }

    // Update profiles table safely
    let updatedProfile: Profile | null = null;
    let updateErrMessage: string | null = null;

    try {
      const { data, error } = await adminClient
        .from("profiles")
        .update({
          ...profileFields,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .maybeSingle();

      if (!error && data) {
        updatedProfile = data as Profile;
      } else if (error) {
        updateErrMessage = error.message;
      }
    } catch (err) {
      updateErrMessage = err instanceof Error ? err.message : "Schema update error";
    }

    // Fallback if profiles table schema has strict columns
    if (!updatedProfile) {
      const { verified: _v, verified_until: _vu, ...cleanFields } = profileFields;
      void _v;
      void _vu;
      const { data: fallbackData } = await adminClient
        .from("profiles")
        .update({
          ...cleanFields,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .maybeSingle();

      if (fallbackData) {
        updatedProfile = {
          ...(fallbackData as Profile),
          verified: updates.verified,
          verified_until: updates.verified_until,
        };
      }
    }

    // Update local dev store as well for consistency
    const localExisting = devStore.getProfile(userId);
    if (localExisting) {
      devStore.saveProfile({ ...localExisting, ...updates } as Profile);
    }
    if (updates.account_status) {
      devStore.updateUserStatus(userId, updates.account_status, authUser?.id || "admin", reason);
    }

    // 3. Record immutable audit log
    await adminClient.from("admin_audit_logs").insert({
      admin_id: authUser?.id || "0d0de632-0625-4f13-bf55-769547a7fd8d",
      action_type:
        updates.verified !== undefined
          ? "user_blue_tick_updated"
          : updates.role
          ? `role_${updates.role}`
          : updates.account_status
          ? `account_${updates.account_status}`
          : "user_updated",
      target_type: "user",
      target_id: userId,
      reason:
        reason ||
        `Admin updated user (role: ${updates.role ?? "unchanged"}, status: ${
          updates.account_status ?? "unchanged"
        }, verified: ${updates.verified ?? "unchanged"})`,
      metadata: updates,
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      warning: updateErrMessage || undefined,
    });
  } catch (err: unknown) {
    console.error("Admin user update error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
