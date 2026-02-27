"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser, UserButton } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import Image from "next/image";
import UserList from "../../components/UserList";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const params = useParams();
  const updatePresence = useMutation(api.users.updatePresence);
  
  const me = useQuery(api.users.getMe, { clerkId: user?.id ?? "" });
  const lastStatusSent = useRef<boolean | null>(null);

  useEffect(() => {
    if (!me) return;

    if (lastStatusSent.current !== true) {
      updatePresence({ userId: me._id, isOnline: true });
      lastStatusSent.current = true;
    }

    const interval = setInterval(() => {
      updatePresence({ userId: me._id, isOnline: true });
    }, 30000);

    const handleUnload = () => {
      updatePresence({ userId: me._id, isOnline: false });
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, [me?._id, updatePresence]);

  return (
    // Updated root div to use bg-background
    <div className="flex h-screen w-full bg-background transition-colors duration-300">
      <aside className={`
        ${params?.conversationId ? 'hidden md:flex' : 'flex'} 
        flex-col w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 bg-background
      `}>
        <div className="p-4 font-bold border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="Mesme Logo" 
              width={32} 
              height={32} 
              className="rounded-lg shadow-sm"
            />
            <span className="text-xl tracking-tight text-black dark:text-white font-semibold">Mesme</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <UserList />
        </div>
      </aside>

      {/* Updated main to use bg-background */}
      <main className={`
        flex-1 flex-col h-full overflow-hidden bg-background
        ${!params?.conversationId ? 'hidden md:flex' : 'flex'}
      `}>
        {children}
      </main>
    </div>
  );
}