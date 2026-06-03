import { z } from "zod";

export const memoryScopeSchema = z.enum(["USER", "PROJECT", "CONVERSATION", "WORKSPACE"]);

export const createMemorySchema = z.object({
  scope: memoryScopeSchema.default("PROJECT"),
  projectId: z.string().optional(),
  userId: z.string().optional(),
  conversationId: z.string().optional(),
  workspaceId: z.string().optional(),
  title: z.string().optional(),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const updateMemorySchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const deleteMemorySchema = z.object({
  id: z.string()
});

export const searchMemorySchema = z.object({
  query: z.string().min(1),
  scope: memoryScopeSchema.optional(),
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
  userId: z.string().optional(),
  workspaceId: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  mode: z.enum(["text", "semantic", "hybrid"]).optional()
});

export const embedMemorySchema = z.object({
  chunkId: z.string().optional(),
  chunkIds: z.array(z.string()).optional(),
  projectId: z.string().optional()
});

export const reindexMemorySchema = z.object({
  projectId: z.string().optional(),
  conversationId: z.string().optional()
});

export const ragMemorySchema = z.object({
  query: z.string().min(1),
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional()
});
