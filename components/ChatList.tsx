"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import ChatItem from "./ChatItem";

export default function ChatList({ meId }: { meId: Id<"users"> }) {
  const conversations = useQuery(api.conversations.getMyConversations, { userId: meId });

  // 1. Loading State (Skeleton)
  if (conversations === undefined) {
    return (
      <div className="px-4 py-3 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
              <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Empty State (No chats yet)
  if (conversations.length === 0) {
    return (
      <div className="px-4 py-6 text-center border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-xs font-medium text-zinc-400">No active chats</p>
        <p className="text-[10px] text-zinc-500 mt-1 italic">
          Search for a user below to start a conversation!
        </p>
      </div>
    );
  }

  // 3. Active List State
  return (
    <div className="flex flex-col">
      <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        Recent Chats
      </h2>
      <div className="flex flex-col">
        {conversations.map((chat) => (
          <ChatItem key={chat._id} conversationId={chat._id} meId={meId} />
        ))}
      </div>
      <hr className="my-2 border-zinc-100 dark:border-zinc-800" />
    </div>
  );
}