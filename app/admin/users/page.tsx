"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  UserX, 
  Pencil, 
  X, 
  Check, 
  RotateCcw,
  User,
  Shield,
  Crown,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-context";
import { fetchAdminUsers, updateUserByAdmin, setAccountStatus, setUserVerification } from "@/lib/services/admin-service";
import { Profile } from "@/types/database";
import { calculateAge } from "@/lib/utils";
import {
  isProfileVerified,
  getVerificationDetails,
  calculateVerificationExpiry,
  VerificationDurationPreset,
} from "@/lib/utils/verification";
import { BlueTickBadge } from "@/components/ui/blue-tick-badge";

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState<{
    display_name: string;
    city: string;
    bio: string;
    role: Profile["role"];
    account_status: Profile["account_status"];
    reason: string;
  }>({
    display_name: "",
    city: "",
    bio: "",
    role: "user",
    account_status: "active",
    reason: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Dedicated Blue Tick Management Modal State
  const [blueTickUser, setBlueTickUser] = useState<Profile | null>(null);
  const [blueTickPreset, setBlueTickPreset] = useState<VerificationDurationPreset | "revoke">("1_month");
  const [blueTickReason, setBlueTickReason] = useState("");
  const [isUpdatingBlueTick, setIsUpdatingBlueTick] = useState(false);

  const openBlueTickModal = (u: Profile) => {
    setBlueTickUser(u);
    setBlueTickReason("");
    if (!isProfileVerified(u)) {
      setBlueTickPreset("1_month");
    } else if (!u.verified_until) {
      setBlueTickPreset("lifetime");
    } else {
      setBlueTickPreset("1_month");
    }
  };

  const closeBlueTickModal = () => {
    setBlueTickUser(null);
    setIsUpdatingBlueTick(false);
  };

  const handleSaveBlueTick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blueTickUser || !currentAdmin) return;

    setIsUpdatingBlueTick(true);
    try {
      const isRevoke = blueTickPreset === "revoke";
      const verified = !isRevoke;
      const verified_until = isRevoke ? null : calculateVerificationExpiry(blueTickPreset);

      const res = await setUserVerification(
        blueTickUser.id,
        currentAdmin.id,
        verified,
        verified_until,
        blueTickReason.trim() || undefined
      );

      if (res.success) {
        const durationLabels: Record<string, string> = {
          "1_month": "১ মাস (1 Month)",
          "2_months": "২ মাস (2 Months)",
          "3_months": "৩ মাস (3 Months)",
          "6_months": "৬ মাস (6 Months)",
          "1_year": "১ বছর (1 Year)",
          "lifetime": "আজীবন / স্থায়ী (Lifetime)",
          "revoke": "বাতিল (Revoked)",
        };
        setActionNotice({
          text: isRevoke
            ? `"${blueTickUser.display_name}"-এর ব্লু টিক সফলভাবে বাতিল করা হয়েছে।`
            : `"${blueTickUser.display_name}"-কে ব্লু টিক দেওয়া হয়েছে (${durationLabels[blueTickPreset] || blueTickPreset})।`,
          type: "success",
        });
        closeBlueTickModal();
        await loadData();
      } else {
        setActionNotice({
          text: res.error || "ব্লু টিক আপডেট করতে সমস্যা হয়েছে।",
          type: "error",
        });
      }
    } catch (err: unknown) {
      setActionNotice({
        text: err instanceof Error ? err.message : "Error saving verification.",
        type: "error",
      });
    } finally {
      setIsUpdatingBlueTick(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const data = await fetchAdminUsers();
        if (mounted) setUsers(data);
      } catch (err) {
        console.error("Error loading users:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const openEditModal = (u: Profile) => {
    setEditingUser(u);
    setEditForm({
      display_name: u.display_name || "",
      city: u.city || "",
      bio: u.bio || "",
      role: u.role || "user",
      account_status: u.account_status || "active",
      reason: "",
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setIsSaving(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !currentAdmin) return;

    setIsSaving(true);
    try {
      const res = await updateUserByAdmin(editingUser.id, currentAdmin.id, {
        display_name: editForm.display_name.trim(),
        city: editForm.city.trim(),
        bio: editForm.bio.trim(),
        role: editForm.role,
        account_status: editForm.account_status,
        reason: editForm.reason.trim() || undefined,
      });

      if (res.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  display_name: editForm.display_name.trim(),
                  city: editForm.city.trim(),
                  bio: editForm.bio.trim(),
                  role: editForm.role,
                  account_status: editForm.account_status,
                }
              : u
          )
        );
        setActionNotice({
          text: `Updated profile for "${editForm.display_name}" successfully (Role: ${editForm.role}, Status: ${editForm.account_status})`,
          type: "success",
        });
        closeEditModal();
        await loadData();
      } else {
        setActionNotice({
          text: res.error || "Failed to update profile.",
          type: "error",
        });
      }
    } catch (err: unknown) {
      setActionNotice({
        text: err instanceof Error ? err.message : "Error saving changes.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleQuickStatusChange = async (userId: string, newStatus: Profile["account_status"]) => {
    const adminId = currentAdmin?.id || "admin";
    // 1. Optimistically update local users state immediately
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, account_status: newStatus } : u))
    );

    const ok = await setAccountStatus(userId, newStatus, adminId, `Quick admin action: ${newStatus}`);
    if (ok) {
      const statusLabels: Record<string, string> = {
        active: "Active",
        suspended: "Suspended",
        banned: "Banned",
      };
      setActionNotice({
        text: `User status changed to ${statusLabels[newStatus] || newStatus}`,
        type: "success",
      });
    } else {
      setActionNotice({
        text: `Failed to update status to ${newStatus}`,
        type: "error",
      });
    }
    await loadData();
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      u.city.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.account_status === statusFilter;
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const activeCount = users.filter((u) => u.account_status === "active").length;
  const suspendedCount = users.filter((u) => u.account_status === "suspended").length;
  const bannedCount = users.filter((u) => u.account_status === "banned").length;

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">User Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search, inspect, edit user permissions, and moderate platform accounts.
          </p>
        </div>

        {/* Interactive Status Filter Counters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
              statusFilter === "all"
                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                : "border-border/80 bg-card hover:bg-secondary text-muted-foreground"
            }`}
          >
            <span>All: {users.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
            className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
              statusFilter === "active"
                ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 ring-2 ring-emerald-500/30 font-bold"
                : "border-border/80 bg-card hover:bg-secondary text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Active: {activeCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "suspended" ? "all" : "suspended")}
            className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
              statusFilter === "suspended"
                ? "border-amber-500 bg-amber-500/15 text-amber-400 ring-2 ring-amber-500/30 font-bold"
                : "border-border/80 bg-card hover:bg-secondary text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Suspended: {suspendedCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "banned" ? "all" : "banned")}
            className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
              statusFilter === "banned"
                ? "border-rose-500 bg-rose-500/15 text-rose-400 ring-2 ring-rose-500/30 font-bold"
                : "border-border/80 bg-card hover:bg-secondary text-foreground"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Banned: {bannedCount}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div
          className={`rounded-2xl border p-4 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all ${
            actionNotice.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {actionNotice.type === "success" ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          )}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or ID..."
            className="w-full rounded-2xl border border-border/80 bg-card py-2.5 pl-10 pr-4 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-border/80 bg-card px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none shadow-sm"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-2xl border border-border/80 bg-card px-3.5 py-2.5 text-xs font-semibold focus:border-primary focus:outline-none shadow-sm"
        >
          <option value="all">All Roles</option>
          <option value="user">User (Member)</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      {/* Responsive View 1: Mobile & Tablet Cards (< md screens) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card rounded-3xl border border-border">
            Loading platform members...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card rounded-3xl border border-border">
            {statusFilter === "banned"
              ? "কোনো বহিষ্কৃত (Banned) ব্যবহারকারী নেই।"
              : statusFilter === "suspended"
              ? "কোনো স্থগিত (Suspended) ব্যবহারকারী নেই।"
              : "No users matching criteria."}
          </div>
        ) : (
          filteredUsers.map((u) => {
            const age = calculateAge(u.date_of_birth);
            return (
              <div
                key={u.id}
                className="rounded-3xl border border-border/80 bg-card p-4 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500/20 to-amber-500/10 text-primary font-bold text-sm border border-rose-500/20">
                      {u.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link href={`/profile/${u.id}`} className="font-bold text-sm hover:text-primary">
                          {u.display_name}
                        </Link>
                        <BlueTickBadge profile={u} size="sm" />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {age} yrs • {u.gender} • {u.city}
                      </p>
                      <div className="flex flex-col gap-0.5 mt-1 text-[11px] font-mono">
                        {u.email && (
                          <span className="text-sky-400 flex items-center gap-1 truncate font-sans">
                            ✉️ {u.email}
                          </span>
                        )}
                        {u.phone && (
                          <span className="text-rose-400 flex items-center gap-1 font-sans font-semibold">
                            📱 {u.phone}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        {isProfileVerified(u) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                            Blue Tick: {getVerificationDetails(u).badgeTextBengali}
                          </span>
                        ) : getVerificationDetails(u).isExpired ? (
                          <span className="inline-flex text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            মেয়াদ শেষ (Expired)
                          </span>
                        ) : (
                          <span className="inline-flex text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">
                            ব্লু টিক নেই
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status & Role Badges */}
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                        u.account_status === "active"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : u.account_status === "suspended"
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {u.account_status}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        u.role === "admin"
                          ? "bg-rose-500 text-white"
                          : u.role === "moderator"
                          ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(u)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white text-xs font-bold shadow-sm shadow-rose-500/25 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => openBlueTickModal(u)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Blue Tick</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {u.account_status === "active" && (
                      <>
                        <button
                          onClick={() => handleQuickStatusChange(u.id, "suspended")}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 text-[11px] font-bold transition-colors"
                        >
                          Suspend
                        </button>
                        <button
                          onClick={() => handleQuickStatusChange(u.id, "banned")}
                          className="px-2.5 py-1 rounded-xl bg-destructive/10 hover:bg-destructive hover:text-white text-destructive text-[11px] font-bold transition-colors"
                        >
                          Ban
                        </button>
                      </>
                    )}
                    {u.account_status === "suspended" && (
                      <>
                        <button
                          onClick={() => handleQuickStatusChange(u.id, "active")}
                          className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 text-[11px] font-bold transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleQuickStatusChange(u.id, "banned")}
                          className="px-2.5 py-1 rounded-xl bg-destructive/10 hover:bg-destructive hover:text-white text-destructive text-[11px] font-bold transition-colors"
                        >
                          Ban
                        </button>
                      </>
                    )}
                    {u.account_status === "banned" && (
                      <>
                        <button
                          onClick={() => handleQuickStatusChange(u.id, "active")}
                          className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 text-[11px] font-bold transition-colors"
                        >
                          Unban
                        </button>
                        <button
                          onClick={() => handleQuickStatusChange(u.id, "suspended")}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 text-[11px] font-bold transition-colors"
                        >
                          Suspend
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Responsive View 2: Desktop Full-Width Table (>= md screens) */}
      <div className="hidden md:block rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-secondary/50 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
              <tr>
                <th className="p-4 pl-6">Member</th>
                <th className="p-4">Age / Gender</th>
                <th className="p-4">Location</th>
                <th className="p-4">Blue Tick</th>
                <th className="p-4">Status</th>
                <th className="p-4">Role</th>
                <th className="p-4 pr-6 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    {statusFilter === "banned"
                      ? "কোনো বহিষ্কৃত (Banned) ব্যবহারকারী নেই।"
                      : statusFilter === "suspended"
                      ? "কোনো স্থগিত (Suspended) ব্যবহারকারী নেই।"
                      : "No users matching criteria."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const age = calculateAge(u.date_of_birth);
                  return (
                    <tr key={u.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="p-4 pl-6 font-bold text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500/20 to-amber-500/10 text-primary font-bold text-xs border border-rose-500/20 shrink-0">
                            {u.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <Link href={`/profile/${u.id}`} className="hover:text-primary transition-colors block">
                              {u.display_name}
                            </Link>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground font-mono mt-0.5">
                              {u.email ? (
                                <span className="font-sans font-medium text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                                  ✉️ {u.email}
                                </span>
                              ) : null}
                              {u.phone ? (
                                <span className="font-sans font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                                  📱 {u.phone}
                                </span>
                              ) : null}
                              <span>ID: {u.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {age} yrs • <span className="capitalize">{u.gender}</span>
                      </td>
                      <td className="p-4 text-muted-foreground whitespace-nowrap">
                        {u.city || "Dhaka"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {isProfileVerified(u) ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold text-[11px]">
                            <span className="h-3.5 w-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <Check className="h-2 w-2 stroke-[3.5]" />
                            </span>
                            <span>{getVerificationDetails(u).badgeTextBengali}</span>
                          </div>
                        ) : getVerificationDetails(u).isExpired ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            মেয়াদ শেষ
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium text-muted-foreground bg-secondary/60">
                            ব্লু টিক নেই
                          </span>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                            u.account_status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : u.account_status === "suspended"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-destructive/10 text-destructive border border-destructive/20"
                          }`}
                        >
                          {u.account_status}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === "admin"
                              ? "bg-rose-500 text-white shadow-xs"
                              : u.role === "moderator"
                              ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Dedicated Blue Tick Button */}
                          <button
                            onClick={() => openBlueTickModal(u)}
                            title="Manage Blue Tick duration & status"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white transition-all text-xs font-bold shadow-xs active:scale-95"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Blue Tick</span>
                          </button>

                          {/* Pen / Edit Icon Button */}
                          <button
                            onClick={() => openEditModal(u)}
                            title="Edit Role, Status & Details"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold shadow-xs active:scale-95"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Quick Status Buttons */}
                          {u.account_status === "active" && (
                            <>
                              <button
                                onClick={() => handleQuickStatusChange(u.id, "suspended")}
                                className="px-2.5 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 text-xs font-bold transition-colors"
                                title="Suspend User"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => handleQuickStatusChange(u.id, "banned")}
                                className="px-2.5 py-1.5 rounded-xl border border-destructive/20 bg-destructive/10 hover:bg-destructive hover:text-white text-destructive text-xs font-bold transition-colors"
                                title="Permanently Ban User"
                              >
                                Ban
                              </button>
                            </>
                          )}
                          {u.account_status === "suspended" && (
                            <>
                              <button
                                onClick={() => handleQuickStatusChange(u.id, "active")}
                                className="px-2.5 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 text-xs font-bold transition-colors"
                                title="Restore User to Active"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => handleQuickStatusChange(u.id, "banned")}
                                className="px-2.5 py-1.5 rounded-xl border border-destructive/20 bg-destructive/10 hover:bg-destructive hover:text-white text-destructive text-xs font-bold transition-colors"
                                title="Escalate to Permanent Ban"
                              >
                                Ban
                              </button>
                            </>
                          )}
                          {u.account_status === "banned" && (
                            <>
                              <button
                                onClick={() => handleQuickStatusChange(u.id, "active")}
                                className="px-2.5 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-500 text-xs font-bold transition-colors"
                                title="Unban User"
                              >
                                Unban
                              </button>
                              <button
                                onClick={() => handleQuickStatusChange(u.id, "suspended")}
                                className="px-2.5 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 text-xs font-bold transition-colors"
                                title="Downgrade to Suspended"
                              >
                                Suspend
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Edit User Modal (Triggered by Pen Icon) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white font-black text-lg shadow-md shadow-rose-500/20">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <span>Edit User: {editingUser.display_name}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {editingUser.id}
                  </p>
                </div>
              </div>

              <button
                onClick={closeEditModal}
                className="h-8 w-8 rounded-full border border-border hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              {/* 1. Account Role Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  System Role & Privileges
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "user", label: "User", desc: "Dating Member", icon: User, color: "text-foreground" },
                    { value: "moderator", label: "Moderator", desc: "Safety Reviewer", icon: Shield, color: "text-amber-500" },
                    { value: "admin", label: "Admin", desc: "Full Control", icon: Crown, color: "text-rose-500" },
                  ].map((r) => {
                    const Icon = r.icon;
                    const isSelected = editForm.role === r.value;
                    return (
                      <button
                        type="button"
                        key={r.value}
                        onClick={() => setEditForm((prev) => ({ ...prev, role: r.value as Profile["role"] }))}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30"
                            : "border-border/80 hover:bg-secondary/40"
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-1 ${r.color}`} />
                        <span className="text-xs font-black">{r.label}</span>
                        <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Account Status Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Account Standing (Moderation Status)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "active", label: "Active", desc: "Allowed to login & discover", icon: ShieldCheck, color: "text-emerald-500" },
                    { value: "suspended", label: "Suspended", desc: "Temporary restriction", icon: Clock, color: "text-amber-500" },
                    { value: "banned", label: "Banned", desc: "Permanent block", icon: UserX, color: "text-destructive" },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isSelected = editForm.account_status === s.value;
                    return (
                      <button
                        type="button"
                        key={s.value}
                        onClick={() => setEditForm((prev) => ({ ...prev, account_status: s.value as Profile["account_status"] }))}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30"
                            : "border-border/80 hover:bg-secondary/40"
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-1 ${s.color}`} />
                        <span className="text-xs font-black">{s.label}</span>
                        <span className="text-[10px] text-muted-foreground">{s.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Profile Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, display_name: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Bio / About
                </label>
                <textarea
                  rows={2}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="User bio..."
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* 4. Action Note / Audit Reason */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  Reason for Modification (Audit Trail Note)
                </label>
                <input
                  type="text"
                  value={editForm.reason}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Granted moderator access / Cleared false report / User requested name change"
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs focus:border-primary focus:outline-none"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  This note will be permanently logged in the Admin Audit Trail.
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-6 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-bold shadow-md shadow-rose-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Blue Tick Duration Modal */}
      {blueTickUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30 shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black tracking-tight">
                      Blue Tick (ব্লু টিক ভেরিফিকেশন)
                    </h2>
                    <BlueTickBadge profile={blueTickUser} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Member: <span className="font-bold text-foreground">{blueTickUser.display_name}</span> ({blueTickUser.id.slice(0, 8)}...)
                  </p>
                  {(blueTickUser.email || blueTickUser.phone) && (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 flex-wrap">
                      {blueTickUser.email && (
                        <span className="text-sky-400 font-sans">✉️ {blueTickUser.email}</span>
                      )}
                      {blueTickUser.phone && (
                        <span className="text-rose-400 font-semibold font-sans">📱 {blueTickUser.phone}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeBlueTickModal}
                disabled={isUpdatingBlueTick}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Status Box */}
            <div className="rounded-2xl bg-secondary/50 border border-border p-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">বর্তমান স্ট্যাটাস:</span>
              {isProfileVerified(blueTickUser) ? (
                <span className="inline-flex items-center gap-1 font-bold text-sky-400">
                  <Check className="h-3.5 w-3.5" />
                  <span>সক্রিয় ({getVerificationDetails(blueTickUser).formattedExpiry})</span>
                </span>
              ) : getVerificationDetails(blueTickUser).isExpired ? (
                <span className="font-bold text-amber-400">মেয়াদ শেষ (Expired)</span>
              ) : (
                <span className="font-medium text-muted-foreground">ব্লু টিক দেওয়া হয়নি</span>
              )}
            </div>

            <form onSubmit={handleSaveBlueTick} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">
                  ব্লু টিক প্রদর্শনের মেয়াদ নির্ধারণ করুন (Facebook / Tinder Style):
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "1_month", label: "১ মাস (1 Month)", desc: "৩০ দিন সক্রিয়", days: 30 },
                    { id: "2_months", label: "২ মাস (2 Months)", desc: "৬০ দিন সক্রিয়", days: 60 },
                    { id: "3_months", label: "৩ মাস (3 Months)", desc: "৯০ দিন সক্রিয়", days: 90 },
                    { id: "6_months", label: "৬ মাস (6 Months)", desc: "১৮০ দিন সক্রিয়", days: 180 },
                    { id: "1_year", label: "১ বছর (1 Year)", desc: "৩৬৫ দিন সক্রিয়", days: 365 },
                    { id: "lifetime", label: "আজীবন / স্থায়ী", desc: "কোনো মেয়াদ শেষ হবে না", days: Infinity },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBlueTickPreset(opt.id as VerificationDurationPreset)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-0.5 ${
                        blueTickPreset === opt.id
                          ? "border-sky-500 bg-sky-500/15 shadow-sm ring-1 ring-sky-500/30"
                          : "border-border bg-card hover:bg-secondary/60"
                      }`}
                    >
                      <span className={`text-xs font-bold ${blueTickPreset === opt.id ? "text-sky-400" : "text-foreground"}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Revoke Option */}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setBlueTickPreset("revoke")}
                    className={`w-full p-2.5 rounded-2xl border text-center transition-all text-xs font-bold ${
                      blueTickPreset === "revoke"
                        ? "border-destructive bg-destructive/15 text-destructive ring-1 ring-destructive/30"
                        : "border-border/80 bg-secondary/30 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    }`}
                  >
                    🚫 ব্লু টিক বাতিল / রিমুভ করুন (Revoke Blue Tick)
                  </button>
                </div>
              </div>

              {/* Expiry Preview */}
              {blueTickPreset !== "revoke" && (
                <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-2.5 text-xs text-sky-400 flex items-center justify-between">
                  <span>নতুন মেয়াদ শেষ হবে:</span>
                  <span className="font-bold">
                    {blueTickPreset === "lifetime"
                      ? "স্থায়ী (Lifetime • No Expiration)"
                      : new Date(calculateVerificationExpiry(blueTickPreset) || "").toLocaleDateString("bn-BD", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  অ্যাডমিন নোট / কারণ (Audit Trail)
                </label>
                <input
                  type="text"
                  value={blueTickReason}
                  onChange={(e) => setBlueTickReason(e.target.value)}
                  placeholder="e.g. সেলফি যাচাই সম্পন্ন / VIP সাবস্ক্রিপশন ব্লু টিক অনুমোদন"
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeBlueTickModal}
                  disabled={isUpdatingBlueTick}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingBlueTick}
                  className={`inline-flex items-center gap-1.5 px-6 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 ${
                    blueTickPreset === "revoke"
                      ? "bg-destructive hover:bg-destructive/90"
                      : "bg-sky-500 hover:bg-sky-600 shadow-sky-500/25"
                  }`}
                >
                  {isUpdatingBlueTick ? (
                    <span>আপডেট হচ্ছে...</span>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{blueTickPreset === "revoke" ? "ব্লু টিক বাতিল করুন" : "ব্লু টিক নিশ্চিত করুন"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
