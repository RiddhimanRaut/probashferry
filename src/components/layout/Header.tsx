"use client";

import { useAuthContext } from "@/providers/AuthProvider";
import { LogIn, LogOut, User } from "lucide-react";

export default function Header({ onTitleClick }: { onTitleClick?: () => void }) {
  const { user, loading, signIn, signOut } = useAuthContext();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 safe-top">
      <div className="flex items-center justify-between px-4 py-3 bg-paper/80 backdrop-blur-md">
        <button onClick={onTitleClick} className="heading-display text-lg text-terracotta hover:text-terracotta-dark transition-colors">
          Probashferry
        </button>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-paper animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-charcoal/70 hidden sm:inline">
                {user.displayName?.split(" ")[0]}
              </span>
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center">
                  <User size={16} className="text-terracotta" />
                </div>
              )}
              <button onClick={signOut} className="text-charcoal/50 hover:text-terracotta transition-colors p-1" aria-label="Sign out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={signIn} className="flex items-center gap-1.5 text-sm text-terracotta hover:text-terracotta-dark transition-colors">
              <LogIn size={16} />
              <span className="hidden sm:inline">Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
