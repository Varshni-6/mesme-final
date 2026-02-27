"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { formatTimestamp } from "../lib/utils";

export default function MessageList({ 
  conversationId, 
  meId 
}: { 
  conversationId: Id<"conversations">; 
  meId: Id<"users"> 
}) {
  const messages = useQuery(api.messages.list, { conversationId });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages === undefined) {
    return (
      <div className="flex-1 p-4 space-y-4 flex flex-col">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`w-1/3 h-10 bg-zinc-200/50 rounded-lg animate-pulse ${i % 2 === 0 ? "self-end" : "self-start"}`} />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-white/50 rounded-2xl flex items-center justify-center mb-4 border border-zinc-200">
          <span className="text-2xl">👋</span>
        </div>
        <h3 className="text-sm font-semibold text-[#3E322E]">
          Start the conversation
        </h3>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
      {messages.map((msg) => {
        const isMe = msg.senderId === meId;
        return (
          <div
            key={msg._id}
            className={`max-w-[80%] p-3 rounded-2xl text-sm flex flex-col shadow-sm ${
              isMe
                ? "bg-[#3E322E] text-white self-end rounded-br-none"
                : "bg-white text-[#3E322E] self-start rounded-bl-none border border-zinc-200"
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <span>{msg.content}</span>
            </div>

            <span className={`text-[10px] mt-1 opacity-60 self-end font-medium`}>
              {formatTimestamp(msg._creationTime)}
            </span>
          </div>
        );
      })}
      
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}