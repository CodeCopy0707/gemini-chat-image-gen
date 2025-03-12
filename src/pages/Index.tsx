
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
    { id: "default", title: "New conversation", date: new Date() }
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
        const imageResult = await enhancedImageGeneration(userMessage);
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
      if (messages.length === 0 && conversations.find(c => c.id === activeConversation)?.title === "New conversation") {
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
  }, [geminiApi, messages, activeConversation, conversations]);

  const handleNewChat = () => {
    const newConversationId = generateMessageId();
    setConversations([
      ...conversations,
      { id: newConversationId, title: "New conversation", date: new Date() }
    ]);
    setActiveConversation(newConversationId);
    setMessages([]);
  };

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-background to-muted/20">
      {apiKey ? (
        <>
          <ChatSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onNewChat={handleNewChat}
            conversations={conversations}
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
          />
          
          <div className={cn(
            "flex flex-col w-full transition-all duration-300",
            sidebarOpen ? "md:ml-80" : ""
          )}>
            <ChatHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            
            <div className="flex-1 flex flex-col overflow-hidden">
              <MessageList messages={messages} />
              <ChatInput 
                onSendMessage={processUserMessage} 
                disabled={isProcessing} 
              />
            </div>
          </div>
          
          {showWelcome && (
            <InitialWelcome 
              onDismiss={() => setShowWelcome(false)} 
              onExampleClick={(text) => processUserMessage(text)}
            />
          )}
        </>
      ) : (
        <ApiKeyInput onSubmit={handleApiKeySubmit} />
      )}
    </div>
  );
};

export default Index;
