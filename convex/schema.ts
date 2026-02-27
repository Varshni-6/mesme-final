import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    imageUrl: v.string(),
    isOnline: v.optional(v.boolean()), 
    lastSeen: v.optional(v.number()),  
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.string()),
    admin: v.optional(v.id("users")),
    updatedAt: v.optional(v.number()), 
    // lastRead stores { [userId]: timestamp } for read receipts
    lastRead: v.optional(v.any()),
    // typing stores { [userId]: lastTypedTimestamp } for real-time indicators
    typing: v.optional(v.any()), 
  }),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("image")),
    // Tracks if a message has been retracted/deleted
    isDeleted: v.optional(v.boolean()), 
  }).index("by_conversationId", ["conversationId"]),
});