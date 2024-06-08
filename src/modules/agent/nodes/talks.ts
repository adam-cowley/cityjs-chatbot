import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnablePick,
  RunnableSequence,
} from "@langchain/core/runnables";
import { DynamicStructuredTool } from "langchain/tools";

export async function initTalksRetrievalChain() {
  // Specify embedding model
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPEN_AI_API_KEY,
  });

  // Create vector store
  const store = await Neo4jVectorStore.fromExistingGraph(embeddings, {
    url: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
    nodeLabel: "Talk",
    textNodeProperties: ["title", "description"],
    indexName: "talk_embeddings_openai",
    embeddingNodeProperty: "embedding",
    retrievalQuery: `
RETURN node.description AS text, score,
node {
    .time, .title,
    url: 'https://athens.cityjsconf.org/'+ node.url,
    speaker: [
    (node)-[:GIVEN_BY]->(s) |
    s { .name, .company, .x_handle, .bio }
    ][0],
    room: [ (node)-[:IN_ROOM]->(r) | r.name ][0],
    tags: [ (node)-[:HAS_TAG]->(t) | t.name ]

} AS metadata
`,
  });

  // Retrieve Documents from Vector Index
  const retriever = store.asRetriever();

  // 1. create a prompt template
  const prompt = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `You are a helpful assistant helping users with queries
      about the CityJS Athens conference.
      Answer the user's question to the best of your ability.
      If you do not know the answer, just say you don't know.
      `
    ),
    SystemMessagePromptTemplate.fromTemplate(
      `
      Here are some talks to help you answer the question.
      Don't use your pre-trained knowledge to answer the question.
      Always include a full link to the meetup.
      If the answer isn't included in the documents, say you don't know.

      Documents:
      {documents}
    `
    ),
    // new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate(`Question: {message}`),
  ]);

  // 2. choose an LLM
  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.9,
  });

  // 3. parse the response
  const parser = new StringOutputParser();

  // 4. runnable sequence (LCEL)
  const chain = RunnableSequence.from<
    { message: string; documents?: string },
    string
  >([
    RunnablePassthrough.assign({
      documents: new RunnablePick("message").pipe(
        retriever.pipe((docs) => JSON.stringify(docs))
      ),
    }),
    prompt,
    llm,
    parser,
  ]);

  return chain;
}

export function talkSearchTool() {
  return new DynamicStructuredTool({
    name: "talks-semantic",
    description:
      "useful when the user wants to find information about a talk by its description",
    schema: z.object({
      message: z.string(),
    }),
    func: async (input) => {
      const chain = await initTalksRetrievalChain();
      return chain.invoke({
        message: input.message,
      });
    },
  });
}
