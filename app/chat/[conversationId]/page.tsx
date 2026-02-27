"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import MessageInput from "../../../components/MessageInput";
import MessageList from "../../../components/MessageList";
import { Id } from "../../../convex/_generated/dataModel";

export default function ConversationPage({ 
  params: paramsPromise 
}: { 
  params: Promise<{ conversationId: string }> 
}) {
  // 1. Next.js 15 Promise unwrapping
  const resolvedParams = use(paramsPromise);
  const conversationId = resolvedParams.conversationId as Id<"conversations">;

  const { user: clerkUser } = useUser();
  const markAsRead = useMutation(api.conversations.markAsRead);
  
  // 2. Fetch identities and conversation context
  const me = useQuery(api.users.getMe, { 
    clerkId: clerkUser?.id ?? "" 
  });

  const otherUser = useQuery(
    api.users.getOtherUser, 
    me ? { conversationId, currentUserId: me._id } : "skip"
  );

  const conversation = useQuery(api.conversations.getConversation, { conversationId });
  const messages = useQuery(api.messages.list, { conversationId });

  // 3. Side Effect: Read Receipts
  // Updates the database whenever new messages arrive or the user views the chat
  useEffect(() => {
    if (me && conversationId) {
      markAsRead({ conversationId, userId: me._id });
    }
  }, [conversationId, me?._id, markAsRead, messages?.length]); 

  // 4. Typing Indicator Logic
  const isTyping = () => {
    if (!conversation?.typing || !otherUser) return false;
    const lastTyped = conversation.typing[otherUser._id] || 0;
    // Window of 3 seconds to consider the user "active"
    return Date.now() - lastTyped < 3000;
  };

  // Pulse effect to force re-render every second (checks the 3s typing window)
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // 5. Unified Loading State
  if (me === undefined || otherUser === undefined) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-zinc-500 animate-pulse">
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      {/* Header Section */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10">
         <div className="flex items-center gap-3">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {otherUser?.name || "User"}
            </p>
            {otherUser?.isOnline ? (
              <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase tracking-wider">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Online
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
                Offline
              </span>
            )}
         </div>
      </div>

      {/* Main Message Area */}
      <MessageList conversationId={conversationId} meId={me._id} />

      {/* Real-time Feedback Area */}
      <div className="h-7"> {/* Fixed height prevents the input bar from jumping */}
        {isTyping() && (
          <div className="px-6 py-1 flex items-center gap-2 text-[11px] text-zinc-500 italic">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1 h-1 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            {otherUser?.name} is typing...
          </div>
        )}
      </div>

      {/* Input Section */}
      <MessageInput 
        conversationId={conversationId} 
        meId={me._id} 
      />
    </div>
  );
}