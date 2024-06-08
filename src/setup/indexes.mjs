import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from "dotenv";

async function main() {
  config({ path: "./.env.local" });

  console.log(`🗃️ Connecting to ${process.env.NEO4J_URI}`);

  // const embeddings = new OllamaEmbeddings({
  //   model: "nomic-embed-text",
  // });

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPEN_AI_API_KEY,
  });

  await createTalkVectorIndex(embeddings);
  await createSpeakerVectorIndex(embeddings);
}

async function createTalkVectorIndex(embeddings) {
  try {
    console.log("talk_embeddings_openai");

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

    await store.close();
  } catch (e) {
    console.error(e);
  }
}

async function createSpeakerVectorIndex(embeddings) {
  try {
    console.log("speaker_embeddings_openai");

    const store = await Neo4jVectorStore.fromExistingGraph(embeddings, {
      url: process.env.NEO4J_URI,
      username: process.env.NEO4J_USERNAME,
      password: process.env.NEO4J_PASSWORD,
      nodeLabel: "Speaker",
      textNodeProperties: ["bio"],
      indexName: "speaker_embeddings_openai",
      embeddingNodeProperty: "embedding",
    });

    await store.close();
  } catch (e) {
    console.error(e);
  }
}

main();
