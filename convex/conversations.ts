import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Fetches all conversations for the current user.
 * Active chats are sorted to the top based on the updatedAt timestamp.
 */
export const getMyConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // 1. Fetch all conversations
    const allConversations = await ctx.db
      .query("conversations")
      .collect();

    // 2. Filter to find where the user is a participant
    const myConversations = allConversations.filter((conv) => 
      conv.participants.includes(args.userId)
    );

    // 3. Sort by updatedAt descending
    return myConversations.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  },
});

/**
 * Fetches a single conversation by its ID.
 * Direct database get for real-time metadata like typing status.
 */
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

/**
 * Starts a new chat or returns an existing one.
 */
export const getOrCreateConversation = mutation({
  args: { 
    userA: v.id("users"), 
    userB: v.id("users") 
  },
  handler: async (ctx, args) => {
    // 1. Check if a 1-on-1 conversation already exists
    const allConversations = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("isGroup"), false))
      .collect();

    const existing = allConversations.find((conv) => 
      (conv.participants.includes(args.userA) && conv.participants.includes(args.userB))
    );

    if (existing) {
      return existing._id;
    }

    // 2. If it doesn't exist, create it
    return await ctx.db.insert("conversations", {
      participants: [args.userA, args.userB],
      isGroup: false,
      updatedAt: Date.now(),
      typing: {}, 
      lastRead: {}, 
    });
  },
});

/**
 * Updates the typing status for a specific user.
 * We use a Map-like structure { [userId]: timestamp } to allow
 * multiple users to type at once in group settings.
 */
export const setTyping = mutation({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    
    // Update the timestamp for the specific user while preserving others
    const typing = { 
      ...conversation?.typing, 
      [args.userId]: Date.now() 
    };
    
    await ctx.db.patch(args.conversationId, { typing });
  },
});

/**
 * Updates the 'lastRead' timestamp for a specific user.
 * This allows the UI to calculate unread counts by comparing message 
 * creation times to this value.
 */
export const markAsRead = mutation({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    const lastRead = { 
      ...conversation?.lastRead, 
      [args.userId]: Date.now() 
    };
    await ctx.db.patch(args.conversationId, { lastRead });
  },
});