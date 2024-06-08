import { sleep } from "@/utils";
import { detectCommand } from "./commands";
import { buildAgentWorkflow } from "./agent-workflow";

type RunInput = {
  message: string;
};

// TODO: This needs to be exportable
type CompiledStateGraph = any;

// TODO: Update
let agent: CompiledStateGraph;

// tag::call[]
export async function call(
  message: string,
  sessionId: string
): Promise<string> {
  // Detect slash commands
  const command = detectCommand(message, sessionId);

  if (typeof command === "string") {
    return command;
  }

  // Singleton agent
  if (agent === undefined) {
    agent = await buildAgentWorkflow();
  }
  // Output
  const res = await agent.invoke(
    {
      input: message,
    },
    {
      configurable: {
        sessionId,
      },
    }
  );

  return res.output;
}
// end::call[]
