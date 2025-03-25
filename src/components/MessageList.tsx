
import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icons } from "@/components/icons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import CodePreview from "./CodePreview";
import { Lightbulb, Search, BrainCircuit, Wrench, Globe } from "lucide-react";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  images?: string[];
  reasoning?: string;
  thinking?: string;
  webSearch?: { query: string; results: any[] };
  toolsUsed?: {
    toolType: string;
    toolCreated: boolean;
    toolResults: {
      result: string;
      explanation?: string;
      needsAdditionalProcessing?: boolean;
    }
  };
}

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [displayedContents, setDisplayedContents] = useState<{ [id: string]: string }>({});
  const [displayIndex, setDisplayIndex] = useState<{ [id: string]: number }>({});
  const [typingTimers, setTypingTimers] = useState<{ [id: string]: NodeJS.Timeout }>({});

  // Scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedContents]);

  // Initialize letter-by-letter display for new assistant messages
  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === "assistant" && !message.isLoading && !displayedContents[message.id]) {
        // Initialize displayed content for this message
        setDisplayedContents(prev => ({ ...prev, [message.id]: "" }));
        setDisplayIndex(prev => ({ ...prev, [message.id]: 0 }));
        
        // Clear any existing timer for this message
        if (typingTimers[message.id]) {
          clearTimeout(typingTimers[message.id]);
        }
        
        // Start typing animation
        const timer = setInterval(() => {
          setDisplayIndex(prev => {
            const currentIndex = prev[message.id] || 0;
            if (currentIndex >= message.content.length) {
              // Typing complete
              clearInterval(typingTimers[message.id]);
              const newTimers = { ...typingTimers };
              delete newTimers[message.id];
              setTypingTimers(newTimers);
              return prev;
            }
            
            // Update displayed content with next letter
            setDisplayedContents(prevContent => ({
              ...prevContent,
              [message.id]: (prevContent[message.id] || "") + message.content[currentIndex]
            }));
            
            return { ...prev, [message.id]: currentIndex + 1 };
          });
        }, 10); // Speed of typing
        
        // Store the timer
        setTypingTimers(prev => ({ ...prev, [message.id]: timer }));
      }
    });
    
    // Clean up all timers on unmount
    return () => {
      Object.values(typingTimers).forEach(clearTimeout);
    };
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex items-start space-x-4 ${
            message.role === "assistant"
              ? "bg-white"
              : "bg-gray-50"
          } p-4 rounded-lg`}
        >
          {message.role === "assistant" ? (
            <Avatar className="h-8 w-8">
              <AvatarImage src="/chatgpt-logo.png" alt="ChatGPT" />
              <AvatarFallback className="bg-green-500 text-white">AI</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-500 text-white">U</AvatarFallback>
            </Avatar>
          )}

          <div className="flex-1 space-y-2">
            {message.role === "assistant" && message.isLoading ? (
              <div className="flex items-center space-x-2">
                <Icons.spinner className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            ) : (
              <ReactMarkdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !className?.includes("inline") && match ? (
                      <CodePreview
                        code={String(children).replace(/\n$/, "")}
                        language={match[1]}
                      />
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  a({ node, children, ...props }) {
                    return <a {...props} className="text-blue-500 underline">{children}</a>;
                  },
                  p({ node, children, ...props }) {
                    return <p className="mb-4">{children}</p>;
                  },
                  ul({ node, children, ...props }) {
                    return <ul className="list-disc pl-5">{children}</ul>;
                  },
                  ol({ node, children, ...props }) {
                    return <ol className="list-decimal pl-5">{children}</ol>;
                  },
                  li({ node, children, ...props }) {
                    return <li className="mb-2">{children}</li>;
                  },
                  blockquote({ node, children, ...props }) {
                    return <blockquote className="border-l-2 border-gray-300 pl-4 italic">{children}</blockquote>;
                  },
                  h1({ node, children, ...props }) {
                    return <h1 className="text-2xl font-bold mb-4">{children}</h1>;
                  },
                  h2({ node, children, ...props }) {
                    return <h2 className="text-xl font-semibold mb-3">{children}</h2>;
                  },
                  h3({ node, children, ...props }) {
                    return <h3 className="text-lg font-medium mb-2">{children}</h3>;
                  },
                  h4({ node, children, ...props }) {
                    return <h4 className="text-base font-semibold mb-1">{children}</h4>;
                  },
                  table({ node, children, ...props }) {
                    return (
                      <div className="overflow-x-auto">
                        <table className="table-auto">{children}</table>
                      </div>
                    );
                  },
                  thead({ node, children, ...props }) {
                    return <thead className="font-bold">{children}</thead>;
                  },
                  th({ node, children, ...props }) {
                    return <th className="border px-4 py-2">{children}</th>;
                  },
                  tbody({ node, children, ...props }) {
                    return <tbody>{children}</tbody>;
                  },
                  tr({ node, children, ...props }) {
                    return <tr>{children}</tr>;
                  },
                  td({ node, children, ...props }) {
                    return <td className="border px-4 py-2">{children}</td>;
                  },
                }}
              >
                {message.role === "assistant" 
                  ? displayedContents[message.id] || ""
                  : message.content}
              </ReactMarkdown>
            )}

            {message.images && message.images.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Uploaded or generated image ${index + 1}`}
                    className="max-w-full rounded-lg max-h-96 object-contain"
                  />
                ))}
              </div>
            )}

            {/* Additional Content Sections */}
            {message.role === "assistant" && !message.isLoading && (
              <div className="mt-2 space-y-2">
                {message.reasoning && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="reasoning">
                      <AccordionTrigger className="text-xs flex items-center gap-2 text-gray-500 hover:text-gray-700">
                        <Lightbulb className="h-3 w-3" /> View Reasoning
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded overflow-auto max-h-64">
                          <ReactMarkdown>
                            {message.reasoning}
                          </ReactMarkdown>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {message.thinking && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="thinking">
                      <AccordionTrigger className="text-xs flex items-center gap-2 text-gray-500 hover:text-gray-700">
                        <BrainCircuit className="h-3 w-3" /> View Thinking Process
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded overflow-auto max-h-64">
                          <ReactMarkdown>
                            {message.thinking}
                          </ReactMarkdown>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {message.webSearch && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="websearch">
                      <AccordionTrigger className="text-xs flex items-center gap-2 text-gray-500 hover:text-gray-700">
                        <Globe className="h-3 w-3" /> Web Search Results
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded overflow-auto max-h-64">
                          <p className="font-medium">Search query: "{message.webSearch.query}"</p>
                          <ul className="mt-2 space-y-2">
                            {message.webSearch.results.map((result, idx) => (
                              <li key={idx} className="border-b border-gray-200 pb-2">
                                <a
                                  href={result.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {result.title}
                                </a>
                                <p className="text-green-600 text-[10px] truncate">{result.link}</p>
                                <p className="mt-1">{result.snippet}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {message.toolsUsed && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="toolsused">
                      <AccordionTrigger className="text-xs flex items-center gap-2 text-gray-500 hover:text-gray-700">
                        <Wrench className="h-3 w-3" /> Tools Used: {message.toolsUsed.toolType}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded overflow-auto max-h-64">
                          <p className="font-medium mb-2">Tool: {message.toolsUsed.toolType}</p>
                          {message.toolsUsed.toolResults.explanation && (
                            <p className="italic text-gray-600 mb-2">{message.toolsUsed.toolResults.explanation}</p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
