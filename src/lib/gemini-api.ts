
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/components/MessageList';

const DEFAULT_MODEL = "gemini-pro";
const VISION_MODEL = "gemini-pro-vision";
const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

// Define the structure expected by the Gemini API
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

export class GeminiApi {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Convert our app's message format to Gemini API format
  private formatMessages(messages: GeminiMessage[]): any[] {
    return messages.map(message => ({
      role: message.role,
      parts: message.parts
    }));
  }

  // Generate content using the Gemini API
  async generateContent(
    messages: GeminiMessage[],
    options: {
      model?: string;
      temperature?: number;
      topK?: number;
      topP?: number;
      maxOutputTokens?: number;
    } = {}
  ): Promise<string> {
    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      topK = 40,
      topP = 0.95,
      maxOutputTokens = 8192,
    } = options;

    // Determine if we need to use the vision model (if any message contains an image)
    const useVisionModel = messages.some(message => 
      message.parts.some(part => part.inlineData?.mimeType?.startsWith('image/'))
    );

    const actualModel = useVisionModel ? VISION_MODEL : model;
    
    const requestBody = {
      contents: this.formatMessages(messages),
      generationConfig: {
        temperature,
        topK,
        topP,
        maxOutputTokens,
      },
    };

    try {
      const response = await fetch(
        `${API_ENDPOINT}/${actualModel}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gemini API Error: ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        return "I'm sorry, I couldn't generate a response for that.";
      }

      // Extract the text content from the response
      return data.candidates[0].content.parts
        .map((part: any) => part.text || '')
        .join('');
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }
}

// Utility function to prepare messages for Gemini API
export function prepareMessagesForGemini(messages: Message[]): GeminiMessage[] {
  return messages.map(message => {
    const geminiMessage: GeminiMessage = {
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    };

    // If message has images, add them as parts
    if (message.images && message.images.length > 0) {
      message.images.forEach(imageUrl => {
        // Extract base64 data from the data URL
        const base64Data = imageUrl.split(',')[1];
        const mimeType = imageUrl.split(';')[0].split(':')[1];

        geminiMessage.parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      });
    }

    return geminiMessage;
  });
}

// Generate a unique message ID
export function generateMessageId(): string {
  return uuidv4();
}
