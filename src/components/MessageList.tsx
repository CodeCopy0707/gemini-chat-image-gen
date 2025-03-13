
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[];
  isLoading?: boolean;
  reasoning?: string;
  webSearch?: {
    query: string;
    results: {
      link: string;
      title: string;
      description: string;
    }[];
  };
}

interface MessageListProps {
  messages: Message[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Enhanced auto-scroll with smooth behavior and increased delay
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollableDiv = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableDiv) {
        // Detect if user has scrolled up
        const isScrolledToBottom = scrollableDiv.scrollHeight - scrollableDiv.scrollTop <= scrollableDiv.clientHeight + 100;
        
        if (isScrolledToBottom) {
          setTimeout(() => {
            scrollableDiv.scrollTo({
              top: scrollableDiv.scrollHeight,
              behavior: 'smooth'
            });
          }, 200);
          setShowScrollButton(false);
        } else {
          setShowScrollButton(true);
        }

        // Add scroll event listener
        const handleScroll = () => {
          const isNearBottom = scrollableDiv.scrollHeight - scrollableDiv.scrollTop <= scrollableDiv.clientHeight + 100;
          setShowScrollButton(!isNearBottom);
        };

        scrollableDiv.addEventListener('scroll', handleScroll);
        return () => scrollableDiv.removeEventListener('scroll', handleScroll);
      }
    }
  }, [messages, imagesLoaded]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollableDiv = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableDiv) {
        scrollableDiv.scrollTo({
          top: scrollableDiv.scrollHeight,
          behavior: 'smooth'
        });
        setShowScrollButton(false);
      }
    }
  };

  const handleImageLoad = (imageUrl: string) => {
    setImagesLoaded((prev) => ({ ...prev, [imageUrl]: true }));
  };

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <h3 className="text-4xl font-semibold">What can I help with?</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative h-[calc(100vh-180px)] overflow-hidden" ref={scrollAreaRef}>
      <ScrollArea className="h-full pb-32">
        <div className="w-full mx-auto">
          {messages.map((message) => {
            const isExpanded = expandedMessages[message.id] !== false; // Default to expanded
            
            return (
              <div
                key={message.id}
                className={cn(
                  "py-8 px-4 md:px-8",
                  message.role === "assistant" ? "bg-gray-50" : "bg-white"
                )}
              >
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-1",
                      message.role === "user" ? "bg-gray-300" : "bg-emerald-500"
                    )}>
                      {message.role === "user" ? (
                        <UserIcon />
                      ) : (
                        <BotIcon />
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium text-lg">
                          {message.role === "user" ? "You" : "Gemini"}
                        </div>
                        
                        {(message.reasoning || (message.webSearch && message.webSearch.results.length > 0)) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMessageExpansion(message.id)}
                            className="text-gray-500"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                <span className="text-xs">Hide details</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                <span className="text-xs">Show details</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      
                      {message.images && message.images.length > 0 && (
                        <div className="mb-4 space-y-3">
                          {message.images.map((img, index) => (
                            <div key={index} className="relative">
                              {!imagesLoaded[img] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
                                  <ImageIcon className="h-10 w-10 text-gray-400 animate-pulse" />
                                </div>
                              )}
                              <img
                                src={img}
                                alt={`Uploaded image ${index + 1}`}
                                className="rounded-md max-h-96 w-auto object-contain"
                                onLoad={() => handleImageLoad(img)}
                                style={{ display: imagesLoaded[img] ? "block" : "none" }}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {message.isLoading ? (
                        <div className="space-y-3">
                          <Skeleton className="h-6 w-[300px]" />
                          <Skeleton className="h-6 w-[250px]" />
                          <Skeleton className="h-6 w-[200px]" />
                        </div>
                      ) : (
                        <>
                          <div className={cn(
                            "prose prose-lg max-w-none leading-relaxed",
                            message.role === "assistant" ? "prose-neutral" : ""
                          )}>
                            {message.role === "assistant" ? (
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            ) : (
                              <p className="text-xl">{message.content}</p>
                            )}
                          </div>
                          
                          {/* Reasoning section (collapsible) */}
                          {message.reasoning && isExpanded && (
                            <div className="mt-4 bg-amber-50 p-4 rounded-md border border-amber-200">
                              <div className="font-medium text-amber-800 mb-2 text-sm">Reasoning Process:</div>
                              <div className="prose prose-sm text-amber-900 max-w-none">
                                <ReactMarkdown>{message.reasoning}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          {/* Web search results (collapsible) */}
                          {message.webSearch && message.webSearch.results.length > 0 && isExpanded && (
                            <div className="mt-4 bg-blue-50 p-4 rounded-md border border-blue-200">
                              <div className="font-medium text-blue-800 mb-2 text-sm">Web Search Results for: "{message.webSearch.query}"</div>
                              <div className="space-y-3">
                                {message.webSearch.results.map((result, index) => (
                                  <div key={index} className="border-b border-blue-100 pb-2 last:border-0">
                                    <a href={result.link} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                                      {result.title}
                                    </a>
                                    <p className="text-sm text-gray-600">{result.description}</p>
                                    <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:underline">
                                      {result.link}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="h-32" />
      </ScrollArea>
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          className="absolute bottom-32 right-4 rounded-full h-10 w-10 shadow-lg flex items-center justify-center"
          onClick={scrollToBottom}
          variant="secondary"
          size="icon"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="#404040"/>
    <path d="M8 9C5.33 9 0 10.34 0 13V16H16V13C16 10.34 10.67 9 8 9Z" fill="#404040"/>
  </svg>
);

const BotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.5 2.5L11.5 1.5H14.5L15.5 2.5V5.5L14.5 6.5H11.5L10.5 5.5V2.5Z" fill="white"/>
    <path d="M5.5 9.5L6.5 8.5H9.5L10.5 9.5V12.5L9.5 13.5H6.5L5.5 12.5V9.5Z" fill="white"/>
    <path d="M0.5 2.5L1.5 1.5H4.5L5.5 2.5V5.5L4.5 6.5H1.5L0.5 5.5V2.5Z" fill="white"/>
    <path d="M5.5 5L8 7.5L10.5 5" stroke="white" strokeWidth="1.5"/>
  </svg>
);

export default MessageList;
