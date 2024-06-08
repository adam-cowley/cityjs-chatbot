import { load } from "cheerio";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { Neo4jGraph } from "@langchain/community/graphs/neo4j_graph";
import { OpenAI } from "@langchain/openai";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { z } from "zod";
import { config } from "dotenv";

async function getTalkUrls() {
  const res = await fetch("https://athens.cityjsconf.org");
  const html = await res.text();
  const $ = load(html);

  return $('a[href*="talk"]')
    .map((i, el) => $(el).attr("href"))
    .get()
    .filter((el, index, data) => data.indexOf(el) === index);
}

async function extractTalkInformation(url) {
  const res = await fetch(`https://athens.cityjsconf.org${url}`);
  const html = await res.text();

  const $ = load(html);
  const main = $("main").html();

  const summarise_prompt = PromptTemplate.fromTemplate(`
  Use the following HTML from a conference website to
  identify information about the talk and speaker.

  {format_instructions}

  HTML:
  ----
  {html}
  ----`);

  const parser = StructuredOutputParser.fromZodSchema(
    z.object({
      title: z.string().describe("title of the talk"),
      time: z
        .string()
        .describe("time of the talk in 24 hour format, eg: 12:34:00"),
      room: z.string().describe("the room in which the talk will take place"),
      description: z
        .string()
        .describe("a one sentence summary of the talk abstract"),
      // ...
      tags: z
        .string()
        .array()
        .describe(
          "a set of tags to use to categorise the talk in lower snake case, eg: graph-database"
        ),
      speaker: z.object({
        name: z.string().describe("name of the speaker"),
        company: z.string().describe("the company that the speaker works for"),
        x_handle: z
          .string()
          .describe("their handle for X (formerly Twitter) beginning with @"),
        bio: z.string().describe("the bio for the speaker"),
      }),
    })
  );

  const format_instructions = parser.getFormatInstructions();

  const llm = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4-turbo",
  });

  const summarise_chain = RunnableSequence.from([
    summarise_prompt,
    llm,
    parser,
  ]);

  const summary = await summarise_chain.invoke({
    html: main,
    format_instructions: format_instructions,
  });

  return summary;
}

async function main() {
  config({ path: "./.env.local" });

  const graph = await Neo4jGraph.initialize({
    url: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
  });

  const details = [];
  const errors = [];

  const talks = await getTalkUrls();

  for (const talk of talks) {
    try {
      const info = await extractTalkInformation(talk);

      await graph.query(
        `
        MERGE (t:Talk {url: $talk})
        SET t.title = $info.title, t.time = $info.time,
            t.description = $info.description

        MERGE (r:Room {name: $info.room})
        MERGE (t)-[:IN_ROOM]->(r)

        MERGE (s:Speaker {name: $info.speaker.name})
        SET s += $info.speaker

        MERGE (t)-[:GIVEN_BY]->(s)

        FOREACH (tag IN $info.tags |
            MERGE (tg:Tag {name: toLower(tag)})
            MERGE (t)-[:HAS_TAG]->(tg)
        )
      `,
        { talk, info },
        "WRITE"
      );

      details.push(info);
    } catch (e) {
      errors.push({
        talk,
        error: e.message,
      });
    }
  }

  await graph.close();

  console.log(`Loaded ${details.length} talks`);
  console.log(errors);
}

main();
