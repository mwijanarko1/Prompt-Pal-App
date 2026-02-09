import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "generate-daily-quest-pool",
  { hourUTC: 0, minuteUTC: 0 },
  api.mutations.generateDailyQuestPool,
  { appId: "prompt-pal" }
);

export default crons;
