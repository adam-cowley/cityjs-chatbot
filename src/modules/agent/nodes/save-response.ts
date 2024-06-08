import { RunnableConfig } from "@langchain/core/runnables";
import { AgentState } from "../constants";
import { saveHistory } from "../history";

export const saveResponse = async (
  data: AgentState,
  config?: RunnableConfig
) => {
  console.log(data);

  await saveHistory(config?.configurable?.sessionId, data.input, data.output);

  return {};
};
