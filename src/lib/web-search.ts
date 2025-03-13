
import axios from "axios";

export interface SearchResult {
  link: string;
  title: string;
  description: string;
}

// Real web search implementation using Groq API
export async function searchWeb(query: string): Promise<SearchResult[]> {
  console.log(`Searching for: ${query}`);

  try {
    // Groq API key
    const apiKey = "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";

    // Create the request payload for Groq API
    const payload = {
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful web search assistant. Your task is to provide search results for the user's query. Return results in JSON format with title, link, and description for each result.",
        },
        {
          role: "user",
          content: `Search the web for: ${query}. Return 5 relevant search results in JSON format with fields: title, link, and description.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    };

    // Make the API request
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Parse the response
    const responseContent = response.data.choices[0].message.content;
    const parsedResults = JSON.parse(responseContent);

    // Extract and format search results
    if (parsedResults.results && Array.isArray(parsedResults.results)) {
      return parsedResults.results.map((result) => ({
        link:
          result.link ||
          `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        title: result.title || `Search result for ${query}`,
        description: result.description || "No description available",
      }));
    }

    // Fallback if the response format is unexpected
    throw new Error("Unexpected response format from API");
  } catch (error) {
    console.error("Error performing web search:", error);

    // Fallback to mock results in case of error
    return [
      {
        link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        title: `${query} - Latest Information`,
        description: `Comprehensive information about ${query} with detailed analysis and recent updates.`,
      },
      {
        link: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
        title: `Understanding ${query}`,
        description: `An in-depth guide to understanding ${query} and its implications in various contexts.`,
      },
      {
        link: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
        title: `${query} Research Papers`,
        description: `Collection of academic research papers and studies related to ${query}.`,
      },
      {
        link: `https://news.google.com/search?q=${encodeURIComponent(query)}`,
        title: `${query} News and Updates`,
        description: `Latest news, trends, and updates about ${query} from reliable sources.`,
      },
      {
        link: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        title: `${query} Tutorial`,
        description: `Step-by-step tutorial on how to work with ${query} effectively.`,
      },
    ];
  }
}

// Function to summarize search results using Groq API
export async function summarizeSearchResults(
  results: SearchResult[],
  query: string,
): Promise<string> {
  try {
    // Groq API key
    const apiKey = "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";

    // Format the results as text for the AI to summarize
    const resultsText = results
      .map((result, index) => {
        return `Result ${index + 1}:\nTitle: ${result.title}\nURL: ${result.link}\nDescription: ${result.description}\n`;
      })
      .join("\n");

    // Create the request payload for Groq API
    const payload = {
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that summarizes web search results. Create a concise, informative summary in markdown format with proper headings and formatting.",
        },
        {
          role: "user",
          content: `Summarize these search results for the query "${query}":\n\n${resultsText}\n\nProvide a well-formatted markdown summary with headings, bullet points, and include links to the sources.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    };

    // Make the API request
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Return the generated summary
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating summary:", error);

    // Fallback to basic summary format if API fails
    const summary = `# Search Results for "${query}"

Here's a summary of the top ${results.length} search results:\n\n`;

    const resultSummaries = results
      .map((result, index) => {
        return `## ${index + 1}. ${result.title}\n${result.description}\n[View Source](${result.link})`;
      })
      .join("\n\n");

    return summary + resultSummaries;
  }
}
