export type UpdateStatus = "latest" | "softUpdate" | "hardUpdate";

export interface UpdateVersionPolicy {
  hardVersion: string;
  softVersion: string;
}

export interface AppUpdateResult {
  status: UpdateStatus;
  currentVersion: string;
  latestVersion: string;
}

interface ParsedVersion {
  release: string[];
  prerelease: string[];
}

// Keep numeric identifiers as strings so large components do not lose precision.
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function parseVersion(input: string): ParsedVersion | null {
  if (typeof input !== "string" || input.length > 256) return null;
  const match = SEMVER.exec(input.trim());
  if (!match) return null;
  const prerelease = match[4]?.split(".") ?? [];
  if (prerelease.some((part) => /^\d+$/.test(part) && /^0\d/.test(part))) {
    return null;
  }
  return { release: match.slice(1, 4), prerelease };
}

function compareNumeric(left: string, right: string): number {
  if (left.length !== right.length) return left.length < right.length ? -1 : 1;
  return left === right ? 0 : left < right ? -1 : 1;
}

/** SemVer precedence; malformed versions have no ordering. */
export function compareAppVersions(left: string, right: string): number | null {
  const first = parseVersion(left);
  const second = parseVersion(right);
  if (!first || !second) return null;

  for (let index = 0; index < 3; index += 1) {
    const order = compareNumeric(first.release[index], second.release[index]);
    if (order !== 0) return order;
  }

  if (!first.prerelease.length || !second.prerelease.length) {
    if (first.prerelease.length === second.prerelease.length) return 0;
    return first.prerelease.length ? -1 : 1;
  }

  const count = Math.max(first.prerelease.length, second.prerelease.length);
  for (let index = 0; index < count; index += 1) {
    const a = first.prerelease[index];
    const b = second.prerelease[index];
    if (a === undefined || b === undefined) return a === undefined ? -1 : 1;
    if (a === b) continue;
    const aNumeric = /^\d+$/.test(a);
    const bNumeric = /^\d+$/.test(b);
    if (aNumeric && bNumeric) return compareNumeric(a, b);
    if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
    return a < b ? -1 : 1;
  }
  return 0;
}

/** Invalid or absent Remote Config values cannot block access to the app. */
export function evaluateUpdatePolicy(
  currentVersion: string,
  policy: UpdateVersionPolicy,
): AppUpdateResult {
  const current = currentVersion.trim();
  const hardComparison = compareAppVersions(current, policy.hardVersion);
  if (hardComparison !== null && hardComparison < 0) {
    return {
      status: "hardUpdate",
      currentVersion: current,
      latestVersion: policy.hardVersion.trim(),
    };
  }

  const softComparison = compareAppVersions(current, policy.softVersion);
  if (softComparison !== null && softComparison < 0) {
    return {
      status: "softUpdate",
      currentVersion: current,
      latestVersion: policy.softVersion.trim(),
    };
  }

  return { status: "latest", currentVersion: current, latestVersion: current };
}

/** Only an official store listing for the requested platform is accepted. */
export function validateStoreUrl(
  input: string,
  platform: "android" | "ios",
): string {
  if (!input || input.length > 2048) return "";
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port) {
      return "";
    }
    if (platform === "android") {
      return url.hostname === "play.google.com" &&
        url.pathname === "/store/apps/details" &&
        /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/.test(url.searchParams.get("id") ?? "")
        ? url.toString()
        : "";
    }
    return url.hostname === "apps.apple.com" && /\/id\d+\/?$/.test(url.pathname)
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}
