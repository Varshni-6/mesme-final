"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export default function MessageInput({ 
  conversationId, 
  meId 
}: { 
  conversationId: Id<"conversations">; 
  meId: Id<"users"> 
}) {
  const [content, setContent] = useState("");
  const sendMessage = useMutation(api.messages.send);
  const setTyping = useMutation(api.conversations.setTyping);
  
  const lastTypingTime = useRef<number>(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);

    const now = Date.now();
    // Throttling logic: Reduced to 800ms for snappier real-time feedback
    if (now - lastTypingTime.current > 800) {
      lastTypingTime.current = now;
      setTyping({ conversationId, userId: meId });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const tempContent = content;
    setContent(""); 

    try {
      await sendMessage({
        conversationId,
        senderId: meId,
        content: tempContent,
      });
      // Reset the timer so the next message starts the indicator immediately
      lastTypingTime.current = 0;
    } catch (error) {
      console.error("Failed to send message:", error);
      setContent(tempContent); 
    }
  };

  return (
    <form onSubmit={handleSend} className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <input
        type="text"
        value={content}
        onChange={handleInputChange}
        placeholder="Type a message..."
        className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all text-zinc-900 dark:text-zinc-100"
      />
    </form>
  );
}