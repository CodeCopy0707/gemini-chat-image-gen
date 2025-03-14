
import { useState, useEffect, useCallback } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatSidebar from "@/components/ChatSidebar";
import MessageList, { Message } from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";
import RoleSelector, { Role } from "@/components/RoleSelector";
import { generateMessageId, GeminiApi, prepareMessagesForGemini } from "@/lib/gemini-api";
import { enhancedImageGeneration, isImageGenerationPrompt } from "@/lib/image-generator";
import { searchWeb, summarizeSearchResults } from "@/lib/web-search";
import { toast } from "sonner";
import ApiKeyInput from "@/components/ApiKeyInput";
import { PlusCircle, Search, Lightbulb, Mic, Settings } from "lucide-react";

// Default API key from the project specifications
const DEFAULT_API_KEY = "AIzaSyBXzTBmok03zex9Xu6BzNEQpiUhP0NFh58";

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [geminiApi, setGeminiApi] = useState<GeminiApi | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [conversations, setConversations] = useState<{ id: string; title: string; date: Date }[]>([
    { id: "default", title: "New chat", date: new Date() }
  ]);
  const [activeConversation, setActiveConversation] = useState<string>("default");
  const [activeRole, setActiveRole] = useState<Role | null>(null);

  // Initialize Gemini API with provided key
  useEffect(() => {
    if (apiKey) {
      setGeminiApi(new GeminiApi(apiKey));
    }
  }, [apiKey]);

  // Check for stored API key on load
  useEffect(() => {
    const storedApiKey = localStorage.getItem("geminiApiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    } else {
      setApiKey(DEFAULT_API_KEY);
    }
  }, []);

  const handleRoleSelect = (role: Role) => {
    setActiveRole(role);
    // If we already have messages, let the user know the role has changed
    if (messages.length > 0) {
      toast.info(`Role changed to ${role.name}. New messages will use this role.`);
    }
  };

  const processUserMessage = useCallback(async (
    userMessage: string, 
    options: {
      images?: string[];
      useReasoning?: boolean;
      useWebSearch?: boolean;
      useThinking?: boolean;
    } = {}
  ) => {
    if (!geminiApi) return;
    
    // Hide welcome screen when user interacts
    if (showWelcome) {
      setShowWelcome(false);
    }
    
    // Add user message to the chat
    const userMessageObj: Message = {
      id: generateMessageId(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
      images: options.images,
    };
    
    setMessages((prev) => [...prev, userMessageObj]);
    
    // Check if this is an image generation request
    const shouldGenerateImage = isImageGenerationPrompt(userMessage);
    
    try {
      setIsProcessing(true);
      
      // Add loading message from assistant
      const assistantMessageId = generateMessageId();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isLoading: true,
        },
      ]);
      
      let assistantResponse = "";
      let generatedImageUrl: string | null = null;
      let webSearchResults = null;
      let reasoningProcess = null;
      let thinkingProcess = null;
      
      // Prepare system prompt with role information
      let rolePrompt = "";
      if (activeRole) {
        rolePrompt = `You are acting as ${activeRole.name}. ${activeRole.description}\n\n`;
      }
      
      // Perform web search if enabled
      if (options.useWebSearch) {
        try {
          console.log("Performing web search for:", userMessage);
          const searchResults = await searchWeb(userMessage);
          
          if (searchResults && searchResults.length > 0) {
            webSearchResults = {
              query: userMessage,
              results: searchResults
            };
            
            // Summarize the search results
            const searchSummary = await summarizeSearchResults(searchResults, userMessage);
            assistantResponse = searchSummary;
          }
        } catch (error) {
          console.error("Web search error:", error);
          toast.error("Error performing web search. Falling back to standard response.");
        }
      }
      
      // If no web search or web search failed, proceed with standard response
      if (!assistantResponse) {
        // Try to generate image if the user appears to be asking for one
        if (shouldGenerateImage) {
          const imageResult = await enhancedImageGeneration(userMessage, {
            quality: "ultra-high",
            detailLevel: "16k",
            style: "photorealistic",
            aspectRatio: "16:9"
          });
          
          if (imageResult.success && imageResult.data) {
            generatedImageUrl = imageResult.data;
            assistantResponse = `Here's the image I generated based on your request:\n\n*${userMessage}*`;
          } else {
            // If image generation failed, fall back to regular text response
            const messageHistory = messages.slice(-100); // Get last 100 messages for context
            
            // Inject role information if available
            const systemMessage: Message | null = rolePrompt ? {
              id: generateMessageId(),
              role: "user",
              content: rolePrompt,
              timestamp: new Date()
            } : null;
            
            const geminiMessages = prepareMessagesForGemini(
              systemMessage 
                ? [systemMessage, ...messageHistory, userMessageObj]
                : [...messageHistory, userMessageObj]
            );
            
            assistantResponse = await geminiApi.generateContent(geminiMessages);
            assistantResponse += "\n\n*Note: I tried to generate an image but encountered an error. I've provided a text response instead.*";
          }
        } else {
          // Regular text response with optional reasoning and thinking
          const messageHistory = messages.slice(-100); // Get last 100 messages for context
          
          // Inject role information if available
          const systemMessage: Message | null = rolePrompt ? {
            id: generateMessageId(),
            role: "user",
            content: rolePrompt,
            timestamp: new Date()
          } : null;
          
          // If thinking mode is enabled, get thinking process first
          if (options.useThinking) {
            const thinkingPrompt = `I need to answer the following question or request: "${userMessage}". 
            Let me think carefully about how to approach this problem step by step. I'll explore different aspects, consider relevant knowledge, and organize my thoughts.
            I should show my detailed thought process so that someone can follow my reasoning.`;
            
            const thinkingMessages = prepareMessagesForGemini([
              ...(systemMessage ? [systemMessage] : []),
              {
                id: generateMessageId(),
                role: "user",
                content: thinkingPrompt,
                timestamp: new Date()
              },
            ]);
            
            thinkingProcess = await geminiApi.generateContent(thinkingMessages);
          }
          
          // If reasoning mode is enabled, get reasoning process
          if (options.useReasoning) {
            const reasoningPrompt = `I need to answer the following question or request: "${userMessage}". 
            Let me think step by step to reach a well-reasoned conclusion. 
            I should consider relevant facts, potential approaches, and logical reasoning.`;
            
            const reasoningMessages = prepareMessagesForGemini([
              ...(systemMessage ? [systemMessage] : []),
              {
                id: generateMessageId(),
                role: "user",
                content: reasoningPrompt,
                timestamp: new Date()
              },
            ]);
            
            reasoningProcess = await geminiApi.generateContent(reasoningMessages);
            
            // Then get the final answer using the reasoning
            const finalPrompt = `Based on my reasoning: ${reasoningProcess}
            
            Here is my concise, helpful response to the original question: "${userMessage}"`;
            
            const finalMessages = prepareMessagesForGemini([
              ...(systemMessage ? [systemMessage] : []),
              ...messageHistory,
              {
                id: generateMessageId(),
                role: "user", 
                content: finalPrompt,
                timestamp: new Date()
              }
            ]);
            
            assistantResponse = await geminiApi.generateContent(finalMessages);
          } else if (options.useThinking) {
            // If only thinking mode is enabled, use that to generate the final response
            const finalPrompt = `Based on my thinking process: ${thinkingProcess}
            
            Now I'll provide a clear, concise, and helpful response to the original question: "${userMessage}"`;
            
            const finalMessages = prepareMessagesForGemini([
              ...(systemMessage ? [systemMessage] : []),
              ...messageHistory,
              {
                id: generateMessageId(),
                role: "user", 
                content: finalPrompt,
                timestamp: new Date()
              }
            ]);
            
            assistantResponse = await geminiApi.generateContent(finalMessages);
          } else {
            // Standard response without reasoning or thinking
            const geminiMessages = prepareMessagesForGemini([
              ...(systemMessage ? [systemMessage] : []),
              ...messageHistory,
              userMessageObj,
            ]);
            
            assistantResponse = await geminiApi.generateContent(geminiMessages);
          }
        }
      }
      
      // Update the assistant message with the actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: assistantResponse,
                isLoading: false,
                images: generatedImageUrl ? [generatedImageUrl] : undefined,
                reasoning: options.useReasoning ? reasoningProcess : undefined,
                thinking: options.useThinking ? thinkingProcess : undefined,
                webSearch: webSearchResults
              }
            : msg
        )
      );
      
      // Update conversation title if this is the first exchange
      if (messages.length === 0 && conversations.find(c => c.id === activeConversation)?.title === "New chat") {
        // Create a title based on the first user message
        const title = userMessage.length > 30 
          ? `${userMessage.substring(0, 30)}...` 
          : userMessage;
          
        setConversations(prev => 
          prev.map(conv => 
            conv.id === activeConversation 
              ? { ...conv, title } 
              : conv
          )
        );
      }
    } catch (error: any) {
      console.error("Error processing message:", error);
      
      // Update the assistant message with an error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "I'm sorry, I encountered an error processing your request. Please try again.",
                isLoading: false,
              }
            : msg
        )
      );
      
      toast.error(`Error: ${error.message || "Failed to process your request"}`);
    } finally {
      setIsProcessing(false);
    }
  }, [geminiApi, messages, activeConversation, conversations, showWelcome, activeRole]);

  const handleNewChat = () => {
    const newConversationId = generateMessageId();
    setConversations([
      ...conversations,
      { id: newConversationId, title: "New chat", date: new Date() }
    ]);
    setActiveConversation(newConversationId);
    setMessages([]);
    setSidebarOpen(false);
    setShowWelcome(true);
  };

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    localStorage.setItem("geminiApiKey", key);
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {apiKey ? (
        <>
          <ChatSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onNewChat={handleNewChat}
            conversations={conversations}
            activeConversation={activeConversation}
            setActiveConversation={(id) => {
              setActiveConversation(id);
              setSidebarOpen(false);
            }}
          />
          
          <div className="flex flex-col w-full h-full overflow-hidden bg-white">
            <div className="border-b bg-white flex items-center justify-between px-4 py-2 shadow-sm">
              <div className="flex items-center">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors mr-2"
                >
                  <PlusCircle className="h-5 w-5 text-gray-600" />
                </button>
                <h1 className="text-lg font-medium text-gray-800">ChatGPT</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <RoleSelector onRoleSelect={handleRoleSelect} activeRole={activeRole} />
                <button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
                  <Settings className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              {showWelcome ? (
                <div className="welcome-container">
                  <h1 className="welcome-title">What can I help with?</h1>
                  <div className="input-container">
                    <span className="input-placeholder">Ask anything...</span>
                  </div>
                  <div className="controls-row mt-6">
                    <button className="control-button">
                      <Search className="h-4 w-4" />
                      Web Search
                    </button>
                    <button className="control-button">
                      <Lightbulb className="h-4 w-4" />
                      Reasoning
                    </button>
                    <button className="control-button">
                      <Mic className="h-4 w-4" />
                      Voice
                    </button>
                  </div>
                </div>
              ) : (
                <MessageList messages={messages} />
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="chat-input-container">
                <ChatInput 
                  onSendMessage={processUserMessage} 
                  disabled={isProcessing} 
                />
                <div className="footer-text mt-2">
                  ChatGPT may display inaccurate info, including about people, so double-check its responses.
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <ApiKeyInput onSubmit={handleApiKeySubmit} />
      )}
    </div>
  );
};

export default Index;
