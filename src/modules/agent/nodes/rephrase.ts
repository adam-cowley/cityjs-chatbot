import { getHistory } from "../../../modules/agent/history";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import { RunnableConfig, RunnableSequence } from "@langchain/core/runnables";
import { AgentState } from "../constants";
import { ChatOpenAI } from "@langchain/openai";

export const rephraseQuestion = async (
  data: AgentState,
  config?: RunnableConfig
) => {
  const llm = new ChatOpenAI({ temperature: 0 });
  const history =
    data.messages ?? (await getHistory(config?.configurable?.sessionId, 5));

  const rephrase = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(`
      Use the following conversation history to rephrase the input
      into a standalone question that will be used by an LLM to answer
      a specific question.  The rephrased question should be a succinct, directed question
      directed at the LLM.

      Always mention the name of the speaker of the conversation when rephrasing
      the question.

      For example, if you see the following conversation:

      * Human: Can you recommend a talk?
      * AI: I recommend "Jumping through Hoops" by John Doe
      * Human: What is the talk about?

      The rephrased question should be:
      What is the description of Jumping Through Hoops by John Doe?

      If the conversation is:

      * Human: Who is the speaker?
      * AI: The speaker is Jane Smith, an expert in artificial intelligence.
      * Human: Can you tell me more about the speaker?
      *
      The rephrased question should be:
      Can you provide more information about the speaker "Jane Smith"?


    `),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate(`Input: {input}`),
  ]);

  const rephraseChain = RunnableSequence.from([
    rephrase,
    llm,
    new StringOutputParser(),
  ]);

  const rephrased = await rephraseChain.invoke({
    history,
    input: data.input,
  });

  console.log({
    input: data.input,
    messages: JSON.stringify(history),
    sessionId: config?.configurable?.sessionId,
    rephrased,
  });

  return {
    history,
    rephrased,
  };
};
