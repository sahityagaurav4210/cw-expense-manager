export * from "./files.helpers.js";
export * from "./system.helpers.js";

export function validateRecords(payload: Record<string, unknown>): boolean {
  let isValid = true;
  const enteries = Object.entries(payload);

  for (const [key, value] of enteries) {
    if (!key || !value) {
      isValid = false;
      break;
    }

    if (!payload[key]) {
      isValid = false;
      break;
    }
  }

  return isValid;
}
