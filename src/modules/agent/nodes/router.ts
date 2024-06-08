import { RunnableConfig } from "@langchain/core/runnables";
import {
  AgentState,
  NODE_BANTER,
  NODE_SPEAKER_RETRIEVER,
  NODE_WEATHER_INFO,
} from "../constants";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import {
  NODE_DATABASE_QUERY,
  NODE_JOKE,
  NODE_TALK_RETRIEVER,
} from "../constants";

export const router = async (data: AgentState, config?: RunnableConfig) => {
  const prompt = PromptTemplate.fromTemplate(`
    You are an AI agent deciding which tool to use.

    Follow the rules below to come to your conclusion:

    * If the question relates to the description of a talk and can be answered with
    the contents of the talk title or description, respond with "${NODE_TALK_RETRIEVER}"
    * For details about a speaker based on their name or bio, respond with "${NODE_SPEAKER_RETRIEVER}"
    * If the question relates to Talks, Speakers and can be answered by a database
    query, respond with "${NODE_DATABASE_QUERY}".
    * For the weather, respond with "${NODE_WEATHER_INFO}".
    * For all other queries, respond with "${NODE_BANTER}".

    Question: {question}

    {format_instructions}
  `);
  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  const parser = StructuredOutputParser.fromZodSchema(
    z.enum([
      NODE_TALK_RETRIEVER,
      NODE_DATABASE_QUERY,
      NODE_BANTER,
      NODE_WEATHER_INFO,
      NODE_SPEAKER_RETRIEVER,
    ])
  );

  const chain = prompt.pipe(llm).pipe(parser);

  return chain.invoke({
    question: data.rephrased,
    format_instructions: parser.getFormatInstructions(),
  });
};
