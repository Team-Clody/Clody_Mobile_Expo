/** Stages 1–5 advance every two clovers; subsequent stages advance every 14. */
export function getCloverProgress(cloverCount: number, server?: { stage: number; target: number }) {
  const total = Number.isFinite(cloverCount) ? Math.max(0, Math.floor(cloverCount)) : 0;
  const calculatedLevel = total < 10 ? Math.floor(total / 2) + 1 : Math.min(21, 6 + Math.floor((total - 10) / 14));
  const validServer = server && Number.isInteger(server.stage) && server.stage >= 1 && server.stage <= 21
    && Number.isFinite(server.target) && server.target > 0;
  const level = validServer ? server.stage : calculatedLevel;
  const required = level <= 5 ? 2 : 14;
  const calculatedMinimum = level <= 5 ? (level - 1) * 2 : 10 + (level - 6) * 14;
  const target = validServer ? server.target : calculatedMinimum + required;
  const minimum = target - required;
  return {
    level,
    total,
    target,
    completed: Math.max(0, Math.min(required, total - minimum)),
    required,
  };
}
