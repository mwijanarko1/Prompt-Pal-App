import type * as ZustandMiddleware from "zustand/middleware";

// Metro resolves the ESM barrel on web, which leaves raw `import.meta` in the bundle.
// Requiring the CommonJS entry keeps the bundle browser-safe while preserving types.
const middleware = require("zustand/middleware") as typeof ZustandMiddleware;

export const { createJSONStorage, persist } = middleware;
