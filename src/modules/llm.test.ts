import { config } from "dotenv";
import { llm } from "./llm";

describe("LLM Test", () => {
  beforeAll(async () => {
    config({ path: ".env.local" });
  });

  describe("OpenAI", () => {
    it("should have an OpenAI API Key", () => {
      expect(process.env.OPENAI_API_KEY).toBeDefined();
      expect(process.env.OPENAI_API_KEY).toContain("sk-");
    });

    it("should be defined and invokable", async () => {
      expect(llm).toBeDefined();

      const res = await llm.invoke("How do LLMs work?");

      expect(res).toBeDefined();
      console.log(res);
    });
  });
});
