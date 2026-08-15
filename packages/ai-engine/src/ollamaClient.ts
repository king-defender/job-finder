import { loadOllamaConfig, OllamaConfig } from "./config";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatResponse {
  message: { role: string; content: string };
  done: boolean;
}

export class OllamaClient {
  private readonly config: OllamaConfig;

  constructor(config: OllamaConfig = loadOllamaConfig()) {
    this.config = config;
  }

  /** Freeform text completion (e.g. cover letter drafting). */
  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await this.callChatEndpoint(messages);
    return response.message.content;
  }

  /**
   * Structured completion — asks the model to return JSON matching the shape
   * described in the prompt, then parses it. Callers are responsible for
   * validating the parsed shape; this only guarantees valid JSON, not schema
   * correctness (weaker local models can still return well-formed but wrong JSON).
   */
  async generateJson<T>(messages: ChatMessage[]): Promise<T> {
    const response = await this.callChatEndpoint(messages, "json");
    try {
      return JSON.parse(response.message.content) as T;
    } catch (error) {
      throw new Error(
        `Model returned invalid JSON: ${response.message.content.slice(0, 200)}`,
      );
    }
  }

  private async callChatEndpoint(
    messages: ChatMessage[],
    format?: "json",
  ): Promise<OllamaChatResponse> {
    const url = `${this.config.host}/api/chat`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          stream: false,
          ...(format ? { format } : {}),
        }),
      });
    } catch (error) {
      throw new Error(
        `Could not reach Ollama at ${this.config.host}. Is it running? (${(error as Error).message})`,
      );
    }

    if (!res.ok) {
      throw new Error(`Ollama request failed: ${res.status} ${await res.text()}`);
    }

    return (await res.json()) as OllamaChatResponse;
  }
}
