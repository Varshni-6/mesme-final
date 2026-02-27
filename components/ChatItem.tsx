"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Image from "next/image";
import { Id } from "../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { formatTimestamp } from "../lib/utils";

export default function ChatItem({ 
  conversationId, 
  meId 
}: { 
  conversationId: Id<"conversations">, 
  meId: Id<"users"> 
}) {
  const router = useRouter();
  
  // 1. Fetch the recipient's info
  const otherUser = useQuery(api.users.getOtherUser, { 
    conversationId, 
    currentUserId: meId 
  });
  
  // 2. Fetch the most recent message snippet
  const lastMessage = useQuery(api.messages.getLastMessage, { conversationId });

  // 3. Fetch the unread count
  const unreadCount = useQuery(api.messages.getUnreadCount, { 
    conversationId, 
    userId: meId 
  });

  if (!otherUser) return null;

  return (
    <div
      onClick={() => router.push(`/chat/${conversationId}`)}
      className="flex items-center gap-3 p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
    >
      <div className="relative w-10 h-10 flex-shrink-0">
        <Image
          src={otherUser.imageUrl}
          alt={otherUser.name}
          fill
          className="rounded-full object-cover"
        />
        {otherUser.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {otherUser.name}
          </p>
          
          {/* Timestamp and Unread Badge Container */}
          <div className="flex flex-col items-end gap-1">
            {lastMessage && (
              <span className="text-[10px] text-zinc-400">
                {formatTimestamp(lastMessage._creationTime)}
              </span>
            )}
            {unreadCount ? (
              <span className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                {unreadCount}
              </span>
            ) : null}
          </div>
        </div>
        
        <p className={`text-xs truncate ${unreadCount ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-500"}`}>
          {lastMessage ? lastMessage.content : "No messages yet"}
        </p>
      </div>
    </div>
  );
}