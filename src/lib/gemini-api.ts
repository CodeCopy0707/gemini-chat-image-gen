
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

// Types
export interface GeminiMessage {
  role: "user" | "model";
  parts: {
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;
    };
  }[];
}

interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: {
    category: string;
    threshold: string;
  }[];
  tools?: any[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  }[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings: {
      category: string;
      probability: string;
    }[];
  };
}

export class GeminiApi {
  private apiKey: string;
  private apiUrl: string;
  private abortController: AbortController | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  }

  public cancelRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public async generateContent(messages: GeminiMessage[]): Promise<string> {
    this.abortController = new AbortController();
    
    try {
      const requestBody: GeminiRequest = {
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      };

      const response = await fetch(
        `${this.apiUrl}?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: this.abortController.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error:", errorData);
        throw new Error(errorData.error?.message || "Failed to generate content");
      }

      const data = await response.json() as GeminiResponse;
      
      // Check if the response was blocked
      if (data.promptFeedback?.blockReason) {
        throw new Error(`Content blocked: ${data.promptFeedback.blockReason}`);
      }
      
      // Check if we have candidates
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response generated");
      }
      
      // Get the text from the first candidate
      const textContent = data.candidates[0].content.parts
        .map(part => part.text || "")
        .join("");
        
      return textContent;
    } catch (error: any) {
      // Don't throw if it was cancelled by user
      if (error.name === "AbortError") {
        return "Request cancelled";
      }
      
      // Log and re-throw the error
      console.error("Error calling Gemini API:", error);
      toast.error(`Error: ${error.message || "Failed to generate content"}`);
      throw error;
    } finally {
      this.abortController = null;
    }
  }
}

// Helper function to convert base64 images to format needed by Gemini
export function prepareMessagesForGemini(
  messages: {
    role: "user" | "assistant";
    content: string;
    images?: string[];
  }[]
): GeminiMessage[] {
  return messages.map((msg) => {
    // Convert our message format to Gemini's format
    const role = msg.role === "assistant" ? "model" : "user";
    
    const parts: GeminiMessage["parts"] = [];
    
    // Add images if there are any (only for user messages)
    if (msg.role === "user" && msg.images && msg.images.length > 0) {
      msg.images.forEach((imageDataUrl) => {
        // Extract base64 data from the data URL
        const base64Data = imageDataUrl.split(",")[1];
        
        // Determine mime type
        const mimeType = imageDataUrl.split(";")[0].split(":")[1];
        
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      });
    }
    
    // Add text content
    if (msg.content.trim()) {
      parts.push({ text: msg.content });
    }
    
    return { role, parts };
  });
}

// Utility for generating a random message ID
export function generateMessageId(): string {
  return uuidv4();
}
