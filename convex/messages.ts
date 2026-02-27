import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Saves a new message to the database.
 */
export const send = mutation({
  args: { 
    conversationId: v.id("conversations"), 
    senderId: v.id("users"), 
    content: v.string() 
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      type: "text",
    });

    // Update conversation's timestamp to bubble it to the top
    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Fetches all messages for a specific conversation.
 */
export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

/**
 * Fetches the most recent message for sidebar chat previews.
 */
export const getLastMessage = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .order("desc") 
      .first(); 
  },
});

/**
 * Calculates unread messages created AFTER the user's lastRead timestamp.
 */
export const getUnreadCount = query({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return 0;

    const lastReadTime = conversation.lastRead?.[args.userId] || 0;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.gt(q.field("_creationTime"), lastReadTime))
      .collect();

    return messages.filter(m => m.senderId !== args.userId).length;
  },
});