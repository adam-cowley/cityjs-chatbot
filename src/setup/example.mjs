import { config } from "dotenv";

config({ path: ".env.local" });

import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";

// import the Ollama dependency
import { ChatOllama } from "@langchain/community/chat_models";

// swap out your LLM
const llm = new ChatOllama({
  model: "llama3:7b",
});

async function main() {
  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
  });

  const response = await llm.invoke(
    "Who are the best football team in Athens?"
  );

  console.log(response);
  // Athens is home to several well-known football clubs,
  // each with a rich history and passionate fan base.

  const template = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are a helpful assistant providing attend`
    ),
  ]);
}

main();
