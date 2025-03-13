
import { useState, useEffect, useCallback } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatSidebar from "@/components/ChatSidebar";
import MessageList, { Message } from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";
import { generateMessageId, GeminiApi, prepareMessagesForGemini } from "@/lib/gemini-api";
import { enhancedImageGeneration, isImageGenerationPrompt } from "@/lib/image-generator";
import { searchWeb, summarizeSearchResults } from "@/lib/web-search";
import { toast } from "sonner";
import InitialWelcome from "@/components/InitialWelcome";
import ApiKeyInput from "@/components/ApiKeyInput";
import { cn } from "@/lib/utils";

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
  const [chatSectionCollapsed, setChatSectionCollapsed] = useState(false);

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
    const userMessageObj = {
      id: generateMessageId(),
      role: "user" as const,
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
          role: "assistant" as const,
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
            const messageHistory = messages.slice(-10); // Get last 10 messages for context
            const geminiMessages = prepareMessagesForGemini([
              ...messageHistory,
              userMessageObj,
            ]);
            
            assistantResponse = await geminiApi.generateContent(geminiMessages);
            assistantResponse += "\n\n*Note: I tried to generate an image but encountered an error. I've provided a text response instead.*";
          }
        } else {
          // Regular text response with optional reasoning and thinking
          const messageHistory = messages.slice(-10); // Get last 10 messages for context
          
          // If thinking mode is enabled, get thinking process first
          if (options.useThinking) {
            const thinkingPrompt = `I need to answer the following question or request: "${userMessage}". 
            Let me think carefully about how to approach this problem step by step. I'll explore different aspects, consider relevant knowledge, and organize my thoughts.
            I should show my detailed thought process so that someone can follow my reasoning.`;
            
            const thinkingMessages = prepareMessagesForGemini([
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
          msg.id === generateMessageId()
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
  }, [geminiApi, messages, activeConversation, conversations, showWelcome]);

  const handleNewChat = () => {
    const newConversationId = generateMessageId();
    setConversations([
      ...conversations,
      { id: newConversationId, title: "New chat", date: new Date() }
    ]);
    setActiveConversation(newConversationId);
    setMessages([]);
    setSidebarOpen(false); // Close sidebar on mobile after selecting a chat
  };

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    localStorage.setItem("geminiApiKey", key);
  };

  return (
    <div className="chat-layout">
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
              setSidebarOpen(false); // Close sidebar on mobile after selecting a chat
            }}
          />
          
          <div className="main-content">
            <ChatHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            
            <div className={cn(
              "messages-container thin-scrollbar",
              chatSectionCollapsed && "hidden"
            )}>
              <MessageList messages={messages} />
            </div>
            
            <div className="fixed-input-container">
              <div className="max-w-3xl mx-auto w-full">
                <ChatInput 
                  onSendMessage={processUserMessage} 
                  disabled={isProcessing} 
                />
              </div>
            </div>
          </div>
          
          {showWelcome && (
            <div className="welcome-screen">
              <div className="welcome-content">
                <h1>Welcome to Gemini AI Chat</h1>
                <p>Ask me anything or start exploring the available features below.</p>
                <div className="flex flex-col space-y-4 mt-8">
                  <button 
                    className="primary-button"
                    onClick={() => setShowWelcome(false)}
                  >
                    Start New Chat
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => processUserMessage("Tell me about yourself and what you can do.")}
                  >
                    Get to know Gemini
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <ApiKeyInput onSubmit={handleApiKeySubmit} />
      )}
    </div>
  );
};

export default Index;
