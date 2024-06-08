import { config } from "dotenv";
import { driver, auth } from "neo4j-driver";

describe("Environment Test", () => {
  beforeAll(async () => {
    config({ path: ".env.local" });
  });

  describe("Neo4j", () => {
    it("should have neo4j credentials", async () => {
      expect(process.env.NEO4J_URI).toBeDefined();
      expect(process.env.NEO4J_URI).toContain("://");

      expect(process.env.NEO4J_USERNAME).toBeDefined();
      expect(process.env.NEO4J_USERNAME).toEqual("neo4j");
      expect(process.env.NEO4J_PASSWORD).toBeDefined();
    });

    it("should connect to Neo4j", async () => {
      const instance = driver(
        process.env.NEO4J_URI,
        auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
      );

      const verify = await instance.verifyAuthentication();

      expect(verify).toBeTruthy();

      await instance.close();
    });
  });

  describe("OpenAI", () => {
    it("should have an OpenAI API Key", () => {
      expect(process.env.OPENAI_API_KEY).toBeDefined();
      expect(process.env.OPENAI_API_KEY).toContain("sk-");
    });
  });
});
