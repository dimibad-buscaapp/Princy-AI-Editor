import assert from "node:assert/strict";
import test from "node:test";
import { PasswordService } from "./password.service.js";

test("PasswordService hashes and verifies passwords", async () => {
  const service = new PasswordService({ rounds: 4 });
  const password = "princy-test-password";
  const passwordHash = await service.hashPassword(password);

  assert.notEqual(passwordHash, password);
  assert.equal(await service.verifyPassword(password, passwordHash), true);
  assert.equal(await service.verifyPassword("wrong-password", passwordHash), false);
});

test("PasswordService rejects empty passwords", async () => {
  const service = new PasswordService({ rounds: 4 });

  await assert.rejects(() => service.hashPassword(""), /Password is required/);
  assert.equal(await service.verifyPassword("", "hash"), false);
});
