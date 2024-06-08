import { PromptTemplate } from "@langchain/core/prompts";
import { AgentState } from "../constants";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";

export const banter = async (data: AgentState) => {
  const prompt = PromptTemplate.fromTemplate(`
    You are a chatbot who has been asked a question that is outside of your
    responsibilities.  Bring the conversation back on track by reminding
    the user that your purpose is to answer information about the conference.

    Provide some whitty banter as you respond.

    If the user is saying hello, respond to them in a polite way asking
    them if you can help them.

    If you can, provide a JavaScript snippet to answer the user's question.

    They said: {input}
    In the context of the conversation they mean: {rephrased}
  `);
  const llm = new ChatOpenAI();

  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  const output = await chain.invoke({
    input: data.input,
    rephrased: data.rephrased,
  });

  return {
    output,
  };
};
