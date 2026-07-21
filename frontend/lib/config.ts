/**
 * Domain configuration for the Video Context Graph
 */

export const DOMAIN = {
  id: "video-context-graph",
  name: "Video Context Graph",
  description:
    "Video understanding as a knowledge graph — TwelveLabs extracts what is shown, said, and written per segment; Neo4j merges the same entities across videos.",
  tagline: "Video is evidence",
};

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const NODE_COLORS: Record<string, string> = {
  Video: "#8b5cf6",
  Segment: "#0ea5e9",
  Entity: "#f59e0b",
  Topic: "#10b981",
  Person: "#22c55e",
  Organization: "#3b82f6",
  Location: "#a855f7",
  Object: "#eab308",
};

export const NODE_SIZES: Record<string, number> = {
  Video: 34,
  Segment: 20,
  Entity: 22,
  Topic: 22,
};

export const DEFAULT_CYPHER = `MATCH (v:Video)-[r:HAS_SEGMENT]->(s:Segment) RETURN v, r, s LIMIT 100`;

export const SCHEMA_NODE_SIZE = 30;
export const SCHEMA_REL_COLOR = "#94a3b8";

export interface GraphData {
  results: Record<string, unknown>[];
}

export interface DemoScenario {
  name: string;
  prompts: string[];
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    name: "Explore",
    prompts: [
      "What videos do we have and what are they about?",
      "Show me the graph around the rabbit",
    ],
  },
  {
    name: "Find a moment",
    prompts: [
      "Find the moment where a butterfly lands on the rabbit",
      "Where does the rabbit eat an apple?",
    ],
  },
  {
    name: "Cross-video",
    prompts: [
      "Which entities appear in more than one video?",
      "What connects the two clips to each other?",
    ],
  },
];
