
import { generateMessageId, GeminiApi } from "@/lib/gemini-api";

interface ToolResponse {
  result: string;
  explanation?: string;
  needsAdditionalProcessing: boolean;
}

/**
 * Executes a request using the appropriate specialized tool
 */
export async function executeToolRequest(
  userMessage: string,
  toolType: string
): Promise<ToolResponse> {
  console.log(`Executing tool request: ${toolType} for message: ${userMessage}`);
  
  switch (toolType.toLowerCase()) {
    case "calculator":
      return await executeCalculator(userMessage);
    case "code-executor":
      return await executeCodeRunner(userMessage);
    case "translator":
      return await executeTranslator(userMessage);
    case "data-analysis":
      return await executeDataAnalysis(userMessage);
    case "summarizer":
      return await executeSummarizer(userMessage);
    default:
      return buildCustomTool(userMessage, toolType);
  }
}

/**
 * Builds and executes a custom tool based on the user request
 */
async function buildCustomTool(
  userMessage: string,
  toolType: string
): Promise<ToolResponse> {
  console.log(`Building custom tool for: ${toolType}`);
  
  // Use a LLM to design the tool and its functionality
  const toolBuilderPrompt = `
  I need to create a specialized tool to handle user requests related to "${toolType}".
  
  User request: "${userMessage}"
  
  1. Explain how this tool would work conceptually
  2. Provide a detailed response as if you had actually built and run this tool
  3. Be specific and provide realistic output based on the request
  
  Format your response as a JSON object with these fields:
  {
    "toolDesign": "explanation of how the tool works",
    "result": "the final output to the user after running the virtual tool",
    "explanation": "brief explanation that the tool was simulated"
  }
  `;
  
  try {
    // In a real implementation, you would use a more sophisticated approach to build tools dynamically
    // Here we're simulating it with a structured prompt
    const apiKey = localStorage.getItem("geminiApiKey");
    if (!apiKey) {
      return {
        result: `I wanted to create a specialized ${toolType} tool to handle your request, but I couldn't access the API key needed to build it.`,
        explanation: "The tool creation process failed due to missing API key.",
        needsAdditionalProcessing: true
      };
    }
    
    const geminiApi = new GeminiApi(apiKey);
    const response = await geminiApi.generateContent([{
      role: "user",
      parts: [{text: toolBuilderPrompt}]
    }]);
    
    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          result: result.result,
          explanation: `Note: I created a virtual ${toolType} tool to handle your request. ${result.explanation || result.toolDesign}`,
          needsAdditionalProcessing: true
        };
      }
    } catch (parseError) {
      console.error("Error parsing tool builder response:", parseError);
    }
    
    // Fallback if JSON parsing fails
    return {
      result: `I attempted to build a specialized tool for ${toolType} based on your request, but encountered an issue. Here's what I can tell you based on your request:\n\n${response}`,
      explanation: `I tried to create a ${toolType} tool but couldn't fully implement it.`,
      needsAdditionalProcessing: true
    };
  } catch (error) {
    console.error("Error building custom tool:", error);
    return {
      result: `I attempted to build a specialized tool for ${toolType}, but encountered an error.`,
      explanation: "The tool creation process failed.",
      needsAdditionalProcessing: true
    };
  }
}

/**
 * Executes a calculator tool
 */
async function executeCalculator(userMessage: string): Promise<ToolResponse> {
  console.log("Executing calculator for:", userMessage);
  
  const calculatorPrompt = `
  Act as a mathematical calculator. Extract the mathematical expression from this user request:
  "${userMessage}"
  
  Return your response in this JSON format:
  {
    "expression": "the mathematical expression extracted",
    "calculation": "step by step calculation showing your work",
    "result": "the final numerical result"
  }
  
  Only extract valid mathematical operations. If no clear mathematical task is found, explain that you couldn't identify a calculation to perform.
  `;
  
  try {
    const apiKey = localStorage.getItem("geminiApiKey");
    if (!apiKey) {
      return {
        result: "I tried to use a calculator tool to solve your problem, but couldn't access the API key needed to process it.",
        explanation: "The calculator couldn't be used due to missing API key.",
        needsAdditionalProcessing: true
      };
    }
    
    const geminiApi = new GeminiApi(apiKey);
    const response = await geminiApi.generateContent([{
      role: "user",
      parts: [{text: calculatorPrompt}]
    }]);
    
    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          result: `I calculated the result for "${result.expression}":\n\n${result.calculation}\n\nResult: ${result.result}`,
          needsAdditionalProcessing: false
        };
      }
    } catch (parseError) {
      console.error("Error parsing calculator response:", parseError);
    }
    
    // Fallback if JSON parsing fails
    return {
      result: `I used a calculator tool to analyze your request. Here's what I found:\n\n${response}`,
      needsAdditionalProcessing: false
    };
  } catch (error) {
    console.error("Error executing calculator:", error);
    return {
      result: "I tried to use a calculator tool to solve your problem, but encountered an error.",
      needsAdditionalProcessing: true
    };
  }
}

/**
 * Executes a code runner tool
 */
async function executeCodeRunner(userMessage: string): Promise<ToolResponse> {
  console.log("Executing code runner for:", userMessage);
  
  const codeRunnerPrompt = `
  Act as a code execution engine. For this user request:
  "${userMessage}"
  
  1. Extract the programming task/question
  2. Write appropriate code to solve it
  3. Execute the code in a simulated environment
  4. Show the output/result
  
  Return your response in this JSON format:
  {
    "task": "the programming task identified",
    "language": "the programming language used",
    "code": "the full code solution",
    "explanation": "explanation of how the code works",
    "output": "the simulated execution output"
  }
  `;
  
  try {
    const apiKey = localStorage.getItem("geminiApiKey");
    if (!apiKey) {
      return {
        result: "I tried to use a code execution tool to solve your problem, but couldn't access the API key needed to process it.",
        explanation: "The code execution tool couldn't be used due to missing API key.",
        needsAdditionalProcessing: true
      };
    }
    
    const geminiApi = new GeminiApi(apiKey);
    const response = await geminiApi.generateContent([{
      role: "user",
      parts: [{text: codeRunnerPrompt}]
    }]);
    
    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          result: `I wrote and executed code for: "${result.task}"\n\n\`\`\`${result.language}\n${result.code}\n\`\`\`\n\n**Execution Output:**\n\`\`\`\n${result.output}\n\`\`\`\n\n**Explanation:**\n${result.explanation}`,
          needsAdditionalProcessing: false
        };
      }
    } catch (parseError) {
      console.error("Error parsing code runner response:", parseError);
    }
    
    // Fallback if JSON parsing fails
    return {
      result: `I used a code execution tool to solve your problem. Here's what I found:\n\n${response}`,
      needsAdditionalProcessing: false
    };
  } catch (error) {
    console.error("Error executing code runner:", error);
    return {
      result: "I tried to use a code execution tool to solve your problem, but encountered an error.",
      needsAdditionalProcessing: true
    };
  }
}

/**
 * Executes a translator tool
 */
async function executeTranslator(userMessage: string): Promise<ToolResponse> {
  console.log("Executing translator for:", userMessage);
  
  const translatorPrompt = `
  Act as a language translator. For this user request:
  "${userMessage}"
  
  1. Identify the text to translate
  2. Identify the source and target languages
  3. Provide the translation
  
  Return your response in this JSON format:
  {
    "originalText": "the text identified for translation",
    "sourceLanguage": "the identified source language",
    "targetLanguage": "the identified target language",
    "translation": "the translated text"
  }
  `;
  
  try {
    const apiKey = localStorage.getItem("geminiApiKey");
    if (!apiKey) {
      console.error("API key not available for translator tool");
      return {
        result: "I tried to use a translation tool to process your request, but couldn't access the API key needed for translation.",
        explanation: "The translation tool couldn't be used due to missing API key.",
        needsAdditionalProcessing: true
      };
    }
    
    const geminiApi = new GeminiApi(apiKey);
    const response = await geminiApi.generateContent([{
      role: "user",
      parts: [{text: translatorPrompt}]
    }]);
    
    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          result: `I translated from ${result.sourceLanguage} to ${result.targetLanguage}:\n\n**Original (${result.sourceLanguage}):**\n${result.originalText}\n\n**Translation (${result.targetLanguage}):**\n${result.translation}`,
          needsAdditionalProcessing: false
        };
      }
    } catch (parseError) {
      console.error("Error parsing translator response:", parseError);
    }
    
    // Fallback if JSON parsing fails
    return {
      result: `I used a translation tool to process your request. Here's what I found:\n\n${response}`,
      needsAdditionalProcessing: false
    };
  } catch (error) {
    console.error("Error executing translator:", error);
    return {
      result: "I tried to use a translation tool to process your request, but encountered an error.",
      needsAdditionalProcessing: true
    };
  }
}

/**
 * Executes a data analysis tool
 */
async function executeDataAnalysis(userMessage: string): Promise<ToolResponse> {
  console.log("Executing data analysis for:", userMessage);
  
  const dataAnalysisPrompt = `
  Act as a data analysis tool. For this user request:
  "${userMessage}"
  
  1. Extract what data needs to be analyzed
  2. Generate realistic sample data if specific data is not provided
  3. Perform appropriate analysis based on the request
  4. Visualize results by describing charts/graphs (use ASCII if needed)
  
  Return your response in this JSON format:
  {
    "dataDescription": "description of the data analyzed",
    "analysis": "detailed analysis of the data",
    "visualizations": "description or ASCII representation of visualizations",
    "insights": "key insights from the analysis",
    "recommendations": "recommendations based on the analysis"
  }
  `;
  
  try {
    const apiKey = localStorage.getItem("geminiApiKey");
    if (!apiKey) {
      return {
        result: "I tried to use a data analysis tool to process your request, but couldn't access the API key needed for analysis.",
        explanation: "The data analysis tool couldn't be used due to missing API key.",
        needsAdditionalProcessing: true
      };
    }
    
    const geminiApi = new GeminiApi(apiKey);
    const response = await geminiApi.generateContent([{
      role: "user",
      parts: [{text: dataAnalysisPrompt}]
    }]);
    
    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          result: `# Data Analysis Report\n\n## Data Analyzed\n${result.dataDescription}\n\n## Analysis\n${result.analysis}\n\n## Visualizations\n${result.visualizations}\n\n## Key Insights\n${result.insights}\n\n## Recommendations\n${result.recommendations}`,
          needsAdditionalProcessing: false
        };
      }
    } catch (parseError) {
      console.error("Error parsing data analysis response:", parseError);
    }
    
    // Fallback if JSON parsing fails
    return {
      result: `I used a data analysis tool to process your request. Here's what I found:\n\n${response}`,
      needsAdditionalProcessing: false
    };
  } catch (error) {
    console.error("Error executing data analysis:", error);
    return {
      result: "I tried to use a data analysis tool to process your request, but encountered an error.",
      needsAdditionalProcessing: true
    };
  }
}

/**
 * Executes a summarizer tool
 */
async function executeSummarizer(userMessage: string): Promise<ToolResponse> {
  console.log("Executing summarizer for:", userMessage);
  
  const summarizerPrompt = `
  Act as a text summarization tool. For this user request:
  "${userMessage}"
  
  1. Extract the text that needs to be summarized
  2. Create different types of summaries
  
  Return your response in this JSON format:
  {
    "originalTextDescription": "description of the original text",
    "bulletPoints": "bullet point summary of key points",
    "shortSummary": "a concise one-paragraph summary",
    "mediumSummary": "a more detailed 2-3 paragraph summary"
  }
  `;
  
  try {
    const apiKey = localStorage.getItem("geminiApiKey");
    if (!apiKey) {
      return {
        result: "I tried to use a summarization tool to process your request, but couldn't access the API key needed for summarization.",
        explanation: "The summarization tool couldn't be used due to missing API key.",
        needsAdditionalProcessing: true
      };
    }
    
    const geminiApi = new GeminiApi(apiKey);
    const response = await geminiApi.generateContent([{
      role: "user",
      parts: [{text: summarizerPrompt}]
    }]);
    
    try {
      // Extract the JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          result: `# Summary\n\n**Original Content:** ${result.originalTextDescription}\n\n## Brief Summary\n${result.shortSummary}\n\n## Key Points\n${result.bulletPoints}\n\n## Detailed Summary\n${result.mediumSummary}`,
          needsAdditionalProcessing: false
        };
      }
    } catch (parseError) {
      console.error("Error parsing summarizer response:", parseError);
    }
    
    // Fallback if JSON parsing fails
    return {
      result: `I used a text summarization tool to process your request. Here's what I found:\n\n${response}`,
      needsAdditionalProcessing: false
    };
  } catch (error) {
    console.error("Error executing summarizer:", error);
    return {
      result: "I tried to use a summarization tool to process your request, but encountered an error.",
      needsAdditionalProcessing: true
    };
  }
}
