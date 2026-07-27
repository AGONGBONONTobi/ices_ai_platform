"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignOut, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface SignOutButtonProps {
  lang: string;
}

export function SignOutButton({ lang }: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleSignOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push(`/${lang}/login`);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
      id="profile-signout-btn"
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border-2 border-red-100 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-60"
    >
      {isLoading ? <CircleNotch className="w-4 h-4 animate-spin" /> : <SignOut className="w-4 h-4" />}
      Se déconnecter
    </button>
  );
}
