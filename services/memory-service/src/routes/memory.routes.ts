import { authenticate, asyncHandler, validateBody, type AuthenticatedRequest } from "@princy/core";
import type { Express } from "express";
import {
  createMemorySchema,
  deleteMemorySchema,
  embedMemorySchema,
  ragMemorySchema,
  reindexMemorySchema,
  searchMemorySchema,
  updateMemorySchema
} from "../schemas/memory.schemas.js";
import { EmbeddingService } from "../services/embedding.service.js";
import { MemoryService } from "../services/memory.service.js";
import { RagService } from "../services/rag.service.js";

export function registerMemoryRoutes(app: Express) {
  const memoryService = new MemoryService();
  const embeddingService = new EmbeddingService();
  const ragService = new RagService();
  const auth = authenticate();

  app.post("/memory/create", auth, validateBody(createMemorySchema), asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const chunk = await memoryService.create(request.body, user.id);
    response.status(201).json({ chunk });
  }));

  app.post("/memory/search", auth, validateBody(searchMemorySchema), asyncHandler(async (request, response) => {
    const results = await ragService.search(request.body);
    response.json({ results });
  }));

  app.post("/memory/rag", auth, validateBody(ragMemorySchema), asyncHandler(async (request, response) => {
    const results = await ragService.retrieve(request.body);
    response.json({ results });
  }));

  app.put("/memory/update", auth, validateBody(updateMemorySchema), asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const { id, ...data } = request.body;
    const chunk = await memoryService.update(id, data, user.id);
    response.json({ chunk });
  }));

  app.delete("/memory/delete", auth, validateBody(deleteMemorySchema), asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    await memoryService.delete(request.body.id, user.id);
    response.json({ success: true });
  }));

  app.get("/memory/project/:projectId", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const chunks = await memoryService.getProjectMemory(String(request.params.projectId), user.id);
    response.json({ chunks });
  }));

  app.get("/memory/conversation/:conversationId", auth, asyncHandler(async (request, response) => {
    const chunks = await memoryService.getConversationMemory(String(request.params.conversationId));
    response.json({ chunks });
  }));

  app.post("/memory/embed", auth, validateBody(embedMemorySchema), asyncHandler(async (request, response) => {
    const { chunkId, chunkIds, projectId } = request.body;
    if (chunkId) {
      const embedding = await embeddingService.embedChunk(chunkId);
      response.json({ embeddings: [embedding] });
      return;
    }
    if (chunkIds?.length) {
      const embeddings = await embeddingService.embedMany(chunkIds);
      response.json({ embeddings });
      return;
    }
    if (projectId) {
      const embeddings = await embeddingService.reindex({ projectId });
      response.json({ embeddings });
      return;
    }
    response.status(400).json({ error: "validation_error", message: "Provide chunkId, chunkIds, or projectId." });
  }));

  app.post("/memory/reindex", auth, validateBody(reindexMemorySchema), asyncHandler(async (request, response) => {
    const embeddings = await embeddingService.reindex(request.body);
    response.json({ embeddings, count: embeddings.length });
  }));
}
