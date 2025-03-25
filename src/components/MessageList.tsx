
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Copy, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import CodePreview from "@/components/CodePreview";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[];
  isLoading?: boolean;
  reasoning?: string;
  thinking?: string;
  webSearch?: {
    query: string;
    results: {
      link: string;
      title: string;
      description: string;
    }[];
  };
  toolsUsed?: {
    toolType: string;
    toolCreated: boolean;
    toolResults: {
      result: string;
      explanation?: string;
    };
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

  // Enhanced auto-scroll with smooth behavior
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
          }, 100);
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

  const renderMarkdown = (content: string) => {
    // Check if content contains code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;
    const elements = [];

    // Process code blocks
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        const textBeforeCodeBlock = content.substring(lastIndex, match.index);
        elements.push(
          <ReactMarkdown key={`text-${lastIndex}`}>
            {textBeforeCodeBlock}
          </ReactMarkdown>
        );
      }

      // Add the code block with CodePreview component
      const language = match[1] || 'text';
      const codeContent = match[2].trim();
      elements.push(
        <CodePreview key={`code-${match.index}`} code={codeContent} language={language} />
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last code block
    if (lastIndex < content.length) {
      const textAfterCodeBlocks = content.substring(lastIndex);
      elements.push(
        <ReactMarkdown key={`text-${lastIndex}`}>
          {textAfterCodeBlocks}
        </ReactMarkdown>
      );
    }

    // If no code blocks were found, render the content as regular markdown
    if (elements.length === 0) {
      return <ReactMarkdown>{content}</ReactMarkdown>;
    }

    return elements;
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
    <div className="relative h-full overflow-hidden" ref={scrollAreaRef}>
      <ScrollArea className="h-full">
        {messages.map((message) => {
          const isExpanded = expandedMessages[message.id] !== false; // Default to expanded
          const hasExpandableContent = message.reasoning || message.thinking || 
                                      (message.webSearch && message.webSearch.results.length > 0) ||
                                      message.toolsUsed;
          
          return (
            <div
              key={message.id}
              className={cn(
                "py-5 px-4 md:px-6",
                message.role === "assistant" ? "bg-gray-50" : "bg-white"
              )}
            >
              <div className="max-w-3xl mx-auto flex items-start gap-4">
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  message.role === "user" ? "bg-gray-300" : "bg-emerald-500"
                )}>
                  {message.role === "user" ? (
                    <UserIcon />
                  ) : (
                    <BotIcon />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium">
                      {message.role === "user" ? "You" : "Gemini"}
                    </div>
                    
                    {hasExpandableContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMessageExpansion(message.id)}
                        className="text-gray-500"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {message.images && message.images.length > 0 && (
                    <div className="mb-2 space-y-2">
                      {message.images.map((img, index) => (
                        <div key={index} className="relative">
                          {!imagesLoaded[img] && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
                              <ImageIcon className="h-6 w-6 text-gray-400 animate-pulse" />
                            </div>
                          )}
                          <img
                            src={img}
                            alt={`Uploaded image ${index + 1}`}
                            className="rounded-md max-h-64 w-auto object-contain"
                            onLoad={() => handleImageLoad(img)}
                            style={{ display: imagesLoaded[img] ? "block" : "none" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {message.isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[220px]" />
                    </div>
                  ) : (
                    <>
                      <div className={cn(
                        "prose prose-sm max-w-none",
                        message.role === "assistant" ? "prose-neutral" : ""
                      )}>
                        {message.role === "assistant" ? (
                          renderMarkdown(message.content)
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                      
                      {/* Tools Used section */}
                      {message.toolsUsed && isExpanded && (
                        <div className="mt-2">
                          <AccordionItem value="tools" className="border rounded-md overflow-hidden bg-indigo-50 border-indigo-200">
                            <AccordionTrigger className="px-3 py-1 text-xs text-indigo-800 hover:no-underline">
                              <div className="flex items-center">
                                <Wand2 className="h-3 w-3 mr-1" />
                                <span>Tool: {message.toolsUsed.toolType}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="bg-indigo-50 px-3 pb-3">
                              <div className="prose prose-xs text-indigo-900 max-w-none">
                                {message.toolsUsed.explanation && (
                                  <div className="mb-2 text-indigo-700 italic text-xs">
                                    {message.toolsUsed.explanation}
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </div>
                      )}
                      
                      {/* Thinking and Reasoning section */}
                      {(message.thinking || message.reasoning) && isExpanded && (
                        <div className="mt-2">
                          <Accordion type="single" collapsible className="w-full">
                            {message.thinking && (
                              <AccordionItem value="thinking" className="border rounded-md overflow-hidden bg-blue-50 border-blue-200">
                                <AccordionTrigger className="px-3 py-1 text-xs text-blue-800 hover:no-underline">
                                  Thinking Process
                                </AccordionTrigger>
                                <AccordionContent className="bg-blue-50 px-3 pb-3">
                                  <div className="prose prose-xs text-blue-900 max-w-none">
                                    <ReactMarkdown>{message.thinking}</ReactMarkdown>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                            
                            {message.reasoning && (
                              <AccordionItem value="reasoning" className="border rounded-md overflow-hidden bg-amber-50 border-amber-200 mt-1">
                                <AccordionTrigger className="px-3 py-1 text-xs text-amber-800 hover:no-underline">
                                  Reasoning Process
                                </AccordionTrigger>
                                <AccordionContent className="bg-amber-50 px-3 pb-3">
                                  <div className="prose prose-xs text-amber-900 max-w-none">
                                    <ReactMarkdown>{message.reasoning}</ReactMarkdown>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                          </Accordion>
                        </div>
                      )}
                      
                      {/* Web search results (simplified) */}
                      {message.webSearch && message.webSearch.results.length > 0 && isExpanded && (
                        <div className="mt-2 bg-blue-50 p-2 rounded-md border border-blue-200 text-xs">
                          <div className="font-medium text-blue-800 mb-1">Search Results</div>
                          <div className="space-y-1">
                            {message.webSearch.results.slice(0, 3).map((result, index) => (
                              <div key={index} className="border-b border-blue-100 pb-1 last:border-0">
                                <a href={result.link} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                                  {result.title}
                                </a>
                                <p className="text-xs text-gray-600 truncate">{result.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Message feedback buttons (simplified) */}
                      {message.role === "assistant" && (
                        <div className="mt-2 flex items-center space-x-1 text-gray-500">
                          <Button variant="ghost" size="sm" className="h-6 px-1">
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-1">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-1">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </ScrollArea>
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Button
          className="absolute bottom-4 right-4 rounded-full h-8 w-8 shadow-md flex items-center justify-center"
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
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="#404040"/>
    <path d="M8 9C5.33 9 0 10.34 0 13V16H16V13C16 10.34 10.67 9 8 9Z" fill="#404040"/>
  </svg>
);

const BotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.5 2.5L11.5 1.5H14.5L15.5 2.5V5.5L14.5 6.5H11.5L10.5 5.5V2.5Z" fill="white"/>
    <path d="M5.5 9.5L6.5 8.5H9.5L10.5 9.5V12.5L9.5 13.5H6.5L5.5 12.5V9.5Z" fill="white"/>
    <path d="M0.5 2.5L1.5 1.5H4.5L5.5 2.5V5.5L4.5 6.5H1.5L0.5 5.5V2.5Z" fill="white"/>
    <path d="M5.5 5L8 7.5L10.5 5" stroke="white" strokeWidth="1.5"/>
  </svg>
);

export default MessageList;
