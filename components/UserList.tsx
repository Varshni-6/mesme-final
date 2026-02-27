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

  // 1. Fetch the full list of users
  const users = useQuery(api.users.getUsers);

  // 2. Get your own record from Convex
  const me = useQuery(api.users.getMe, {
    clerkId: clerkUser?.id ?? "",
  });

  const createConversation = useMutation(api.conversations.getOrCreateConversation);

  // Handle loading state
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

  // Handle "Not Found" state (me is null)
  if (!me) {
    return (
      <div className="p-4 text-center text-sm text-zinc-500">
        User profile not found. Please try logging in again.
      </div>
    );
  }

  // Filter users based on search term and exclude yourself
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      user.clerkId !== me?.clerkId
  );

  const handleUserClick = async (otherUserId: any) => {
    if (!me) return;

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
      {/* 1. Active Chat List Section */}
      <div className="flex-none max-h-[40%] overflow-y-auto border-b border-zinc-100 dark:border-zinc-800">
        <ChatList meId={me._id} />
      </div>

      {/* 2. Search Section */}
      <div className="p-4 flex-none">
        <h2 className="pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Find People
        </h2>
        <input
          type="text"
          placeholder="Search people..."
          className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 3. User Search Results */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
              <span className="text-xl">🔍</span>
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {searchTerm ? "No users found" : "No one else is here yet"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {searchTerm ? "Try a different name" : "Invite some friends to join Mesme!"}
            </p>
          </div>
        ) : (
          filteredUsers.map((user) => (
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
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}