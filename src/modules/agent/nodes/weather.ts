import { AgentState } from "../constants";

export const weatherForecast = async (data: AgentState) => {
  return {
    output: "It's going to be HOT! 🔥🔥🔥",
  };
};
