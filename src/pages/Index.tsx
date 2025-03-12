
import { useState, useEffect, useCallback } from "react";
import ChatHeader from "@/components/ChatHeader";
import ChatSidebar from "@/components/ChatSidebar";
import MessageList, { Message } from "@/components/MessageList";
import ChatInput from "@/components/ChatInput";
import { generateMessageId, GeminiApi, prepareMessagesForGemini } from "@/lib/gemini-api";
import { enhancedImageGeneration, isImageGenerationPrompt } from "@/lib/image-generator";
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

  const processUserMessage = useCallback(async (userMessage: string, userImages?: string[]) => {
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
      images: userImages,
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
        // Regular text response
        const messageHistory = messages.slice(-10); // Get last 10 messages for context
        const geminiMessages = prepareMessagesForGemini([
          ...messageHistory,
          userMessageObj,
        ]);
        
        assistantResponse = await geminiApi.generateContent(geminiMessages);
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
    <div className="flex h-screen w-full bg-white">
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
          
          <div className="flex flex-col w-full h-full overflow-hidden">
            <ChatHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            
            <div className="flex-1 w-full h-full overflow-hidden">
              <MessageList messages={messages} />
              <ChatInput 
                onSendMessage={processUserMessage} 
                disabled={isProcessing} 
              />
            </div>
          </div>
          
          {showWelcome && (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-white">
              <div className="text-center space-y-6 max-w-lg px-4">
                <h1 className="text-4xl font-semibold">What can I help with?</h1>
                <div className="flex justify-center">
                  <div className="animate-pulse h-8 w-36 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-500">Ask anything...</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Dismiss
                </button>
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
