import { END, START, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";

import { rephraseQuestion } from "./nodes/rephrase";
import { router } from "./nodes/router";
import {
  AgentState,
  NODE_SPEAKER_RETRIEVER,
  NODE_WEATHER_INFO,
  NODE_DATABASE_QUERY,
  NODE_JOKE,
  NODE_REPHRASE,
  NODE_TALK_RETRIEVER,
  NODE_BANTER,
  NODE_SAVE_RESPONSE,
} from "./constants";
import { initTalksRetrievalChain } from "./nodes/talks";
import { initSpeakerRetrievalChain } from "./nodes/speakers";
import { initCypherQAChain } from "./nodes/database";
import { tellJoke } from "./nodes/joke";
import { weatherForecast } from "./nodes/weather";
import { banter } from "./nodes/banter";
import { saveResponse } from "./nodes/save-response";

const agentState: StateGraphArgs<AgentState>["channels"] = {
  input: null,
  rephrased: null,
  messages: null,
  output: null,
  log: {
    value: (x: string[], y: string[]) => x.concat(y),
    default: () => [],
  },
};

export async function buildAgentWorkflow() {
  const talkChain = await initTalksRetrievalChain();
  const speakerChain = await initSpeakerRetrievalChain();
  const databaseChain = await initCypherQAChain();

  const model = new ChatOpenAI({
    temperature: 0,
  });

  const graph = new StateGraph({
    channels: agentState,
  })

    // 1. Get conversation history and rephrase the question
    .addNode(NODE_REPHRASE, rephraseQuestion)
    .addEdge(START, NODE_REPHRASE)

    // 2. route the request
    .addConditionalEdges(NODE_REPHRASE, router)

    // 99. End by saving the conversation history
    .addNode(NODE_SAVE_RESPONSE, saveResponse)
    .addEdge(NODE_SAVE_RESPONSE, END)

    // 3. Call Vector tool
    .addNode(NODE_TALK_RETRIEVER, async (data: AgentState) => {
      const output = await talkChain.invoke({ message: data.rephrased });
      return { output };
    })
    .addEdge(NODE_TALK_RETRIEVER, NODE_SAVE_RESPONSE)

    // 4. Call CypherQAChain
    .addNode(NODE_DATABASE_QUERY, async (data: AgentState) => {
      const res = await databaseChain.invoke({
        query: data.rephrased,
      });

      return { output: res.result };
    })
    .addEdge(NODE_DATABASE_QUERY, NODE_SAVE_RESPONSE)

    // 5. Tell a joke
    .addNode(NODE_JOKE, tellJoke)
    .addEdge(NODE_JOKE, NODE_SAVE_RESPONSE)

    // 5. General Chat & Banter
    .addNode(NODE_BANTER, banter)
    .addEdge(NODE_BANTER, NODE_SAVE_RESPONSE)

    // Speaker info
    .addNode(NODE_SPEAKER_RETRIEVER, async (data: AgentState) => {
      const output = await speakerChain.invoke({ message: data.input });
      return { output };
    })
    .addEdge(NODE_SPEAKER_RETRIEVER, NODE_SAVE_RESPONSE)

    // Weather
    .addNode(NODE_WEATHER_INFO, weatherForecast)
    .addEdge(NODE_WEATHER_INFO, END);

  const app = await graph.compile();

  return app;
}
