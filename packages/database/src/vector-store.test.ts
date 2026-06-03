import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getEmbeddingDimensions, toPgVectorLiteral } from "./vector-store.js";

describe("vector-store utils", () => {
  it("uses 768 dimensions by default", () => {
    assert.equal(getEmbeddingDimensions(), 768);
  });

  it("formats pgvector literal", () => {
    const vector = Array.from({ length: 768 }, (_, i) => i * 0.001);
    const literal = toPgVectorLiteral(vector);
    assert.match(literal, /^\[/);
    assert.match(literal, /\]$/);
    assert.equal(literal.split(",").length, 768);
  });

  it("rejects wrong dimension count", () => {
    assert.throws(() => toPgVectorLiteral([1, 2, 3]));
  });
});
