export interface OllamaConfig {
  host: string;
  model: string;
}

export function loadOllamaConfig(): OllamaConfig {
  return {
    host: process.env.OLLAMA_HOST ?? "http://localhost:11434",
    model: process.env.AI_MODEL ?? "qwen3:8b",
  };
}
