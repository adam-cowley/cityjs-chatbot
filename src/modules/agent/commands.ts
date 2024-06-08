import { clearHistory } from "./history";

export async function detectCommand(
  input: string,
  sessionId: string
): Promise<string | undefined> {
  if (input === "/clear" || input === "/c") {
    await clearHistory(sessionId);

    return "👌";
  }
}
