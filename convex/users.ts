import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Syncs Clerk user data with the Convex database.
 * Called on initial login to ensure a local record exists.
 */
export const storeUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user !== null) return user._id;

    // Create new user record
    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      clerkId: args.clerkId,
      imageUrl: args.imageUrl,
      isOnline: true,
      lastSeen: Date.now(),
    });
  },
});

/**
 * Updates presence status when the user closes the tab or switches visibility.
 */
export const updatePresence = mutation({
  args: { userId: v.id("users"), isOnline: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      isOnline: args.isOnline,
      lastSeen: Date.now(),
    });
  },
});

/**
 * Standard query to fetch the current user record.
 */
export const getMe = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

/**
 * Fetches all users from the database.
 * Useful for building a user directory or search functionality.
 */
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

/**
 * Resolves the other participant in a 1-on-1 conversation.
 */
export const getOtherUser = query({
  args: { conversationId: v.id("conversations"), currentUserId: v.id("users") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return null;

    const otherUserId = conversation.participants.find(id => id !== args.currentUserId);
    if (!otherUserId) return null;

    return await ctx.db.get(otherUserId);
  },
});