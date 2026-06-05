export function generateId(): string {
  let id: string;

  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    id = globalThis.crypto.randomUUID();
  } else {
    id =
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).substring(2, 15);
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[ID GENERATED]", id);
  }

  return id;
}
