"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { SignOut, User, CaretDown } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

interface UserMenuProps {
  user: {
    email: string | null;
    full_name: string | null;
    plan: string | null;
  };
  lang: string;
}

export function UserMenu({ user, lang }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const initials = user.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "?";

  const isPro = user.plan === "pro";

  const handleSignOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push(`/${lang}/login`);
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        id="user-menu-btn"
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-violet-50 transition-colors group"
      >
        {/* Avatar */}
        <div
          className="relative w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
        >
          {initials}
          {isPro && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
          )}
        </div>
        <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
          {user.full_name || user.email}
        </span>
        <CaretDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 w-56 z-50 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 py-2 overflow-hidden">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-slate-800 truncate">{user.full_name || "Utilisateur"}</p>
                {isPro ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Pro</span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wider">Free</span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href={`/${lang}/profile`}
                onClick={() => setOpen(false)}
                id="profile-link"
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
              >
                <User className="w-4 h-4" />
                Mon profil
              </Link>

              <button
                onClick={handleSignOut}
                disabled={isLoading}
                id="signout-btn"
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <SignOut className="w-4 h-4" />
                {isLoading ? "Déconnexion..." : "Se déconnecter"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
