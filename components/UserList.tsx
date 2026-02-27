"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ChatList from "./ChatList";

export default function UserList() {
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Fetch data from Convex
  const users = useQuery(api.users.getUsers);
  const me = useQuery(api.users.getMe, {
    clerkId: clerkUser?.id ?? "",
  });

  const createConversation = useMutation(api.conversations.getOrCreateConversation);

  // Loading Skeleton
  if (users === undefined || me === undefined) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!me) return <div className="p-4 text-center text-xs text-zinc-500">Profile not found.</div>;

  // 2. Filter logic: Exclude 'Me' and apply search filter
  const otherUsers = users?.filter(
    (u) => 
      u._id !== me._id && 
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = async (otherUserId: any) => {
    try {
      const conversationId = await createConversation({
        userA: me._id,
        userB: otherUserId,
      });
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-inherit">
      {/* SECTION 1: ACTIVE CHATS (Top) */}
      <div className="flex-none max-h-[45%] overflow-y-auto border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="p-4 pb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Active Chats
        </h2>
        <ChatList meId={me._id} />
      </div>

      {/* SECTION 2: SEARCH & DIRECTORY (Bottom) */}
      <div className="p-4 flex-none">
        <h2 className="pb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Find People
        </h2>
        <input
          type="text"
          placeholder="Search people..."
          className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {!otherUsers || otherUsers.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs italic">
            {searchTerm ? "No users found" : "No other users joined yet"}
          </div>
        ) : (
          otherUsers.map((user) => (
            <div
              key={user._id}
              onClick={() => handleUserClick(user._id)}
              className="flex items-center gap-3 p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors border-b border-zinc-100/50 dark:border-zinc-800/50 last:border-0"
            >
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src={user.imageUrl}
                  alt={user.name}
                  fill
                  className="rounded-full object-cover"
                />
                {user.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}