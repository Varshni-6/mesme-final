"use client";

import { useEffect, useState } from "react";
import { useUser, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import Link from "next/link";

export default function Home() {
  const { user, isLoaded } = useUser();
  const storeUser = useMutation(api.users.storeUser);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const syncUser = async () => {
      try {
        await storeUser({
          name: user.fullName || user.firstName || "User",
          email: user.emailAddresses[0].emailAddress,
          clerkId: user.id,
          imageUrl: user.imageUrl,
        });
        setIsSynced(true);
      } catch (err) {
        console.error("Sync failed:", err);
      }
    };

    syncUser();
  }, [user, isLoaded, storeUser]);

  return (
    // Updated: Changed bg-[#F2EFE9] to bg-background
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background font-sans transition-colors duration-300">
      <div className="flex flex-col items-center gap-12 text-center">
        <h1 className="text-6xl font-extrabold tracking-tight text-[#3C2F2F] dark:text-zinc-50">
          Welcome to Mesme
        </h1>

        <SignedIn>
          <div className="flex flex-col items-center gap-6">
            {isSynced ? (
              <div className="flex flex-col items-center gap-6">
                <p className="font-medium text-[#8B7355] dark:text-zinc-400">
                  Logged in as {user?.firstName}
                </p>
                <Link 
                  href="/chat" 
                  className="px-8 py-4 bg-[#3C2F2F] text-white rounded-xl hover:bg-[#2A1F1F] dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200 transition-all transform hover:scale-105 font-semibold shadow-xl"
                >
                  Enter Chat
                </Link>
                <div className="mt-4">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[#3C2F2F] border-t-transparent rounded-full animate-spin dark:border-zinc-50" />
                <p className="text-[#8B7355] animate-pulse font-medium">
                  Syncing your profile...
                </p>
              </div>
            )}
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex flex-col gap-6 items-center">
            <div className="px-8 py-4 bg-[#3C2F2F] text-white rounded-xl font-semibold transition-transform hover:scale-105 cursor-pointer shadow-lg dark:bg-zinc-100 dark:text-black">
              <SignInButton mode="modal" />
            </div>
            <p className="text-[#8B7355] dark:text-zinc-400">Sign in to start messaging.</p>
          </div>
        </SignedOut>
      </div>
    </main>
  );
}