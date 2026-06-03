export function createDatabaseReadinessCheck(ping: () => Promise<unknown>) {
  return async () => {
    try {
      await ping();
      return true;
    } catch {
      return false;
    }
  };
}
