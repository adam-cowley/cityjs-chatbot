import { config } from "dotenv";
import { driver, auth } from "neo4j-driver";
import { AgentState } from "../constants";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { rephraseQuestion } from "./rephrase";

describe("Environment Test", () => {
  beforeAll(async () => {
    config({ path: ".env.local" });
  });

  describe("rephrase", () => {
    it("should should rephrase a question about a talk", async () => {
      const state: AgentState = {
        input: "What is the talk about?",
        messages: [
          new HumanMessage("Can you recommend a talk?"),
          new AIMessage('I recommend "Foo Bar" by Baz'),
        ],
        rephrased: "",
        output: "",
        log: [],
      };

      const response = await rephraseQuestion(state);

      expect(response.rephrased).toBe(
        'What is the description of "Foo Bar" by Baz?'
      );
    });

    it("should should rephrase a question about a speaker", async () => {
      const state: AgentState = {
        input: "Can you tell me more about the speaker?",
        messages: [
          new HumanMessage("Can you recommend a talk?"),
          new AIMessage('I recommend the talk "Foo Bar"'),
        ],
        rephrased: "",
        output: "",
        log: [],
      };

      const response = await rephraseQuestion(state);

      expect(response.rephrased).toContain("Foo Bar");
    });
  });
});
