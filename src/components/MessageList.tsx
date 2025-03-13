
import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BrainCircuit, Lightbulb, Search } from "lucide-react";
import CodePreview from "./CodePreview";
import { cn } from "@/lib/utils";

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
    results: Array<{
      title: string;
      link: string;
      snippet: string;
    }>;
  };
}

interface MessageListProps {
  messages: Message[];
}

// Function to extract code blocks from markdown
const extractCodeBlocks = (markdown: string) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeBlocks: { language: string; code: string }[] = [];
  
  let match;
  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    codeBlocks.push({
      language: match[1] || "text",
      code: match[2].trim(),
    });
  }
  
  return codeBlocks;
};

// Function to replace code blocks with placeholders
const replaceCodeBlocks = (markdown: string) => {
  return markdown.replace(/```(\w+)?\n([\s\S]*?)```/g, "{{CODE_BLOCK}}");
};

const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  const { role, content, images, isLoading, reasoning, thinking, webSearch } = message;
  
  // Extract code blocks
  const codeBlocks = extractCodeBlocks(content);
  const contentWithoutCodeBlocks = replaceCodeBlocks(content);
  const contentParts = contentWithoutCodeBlocks.split("{{CODE_BLOCK}}");
  
  return (
    <div className={cn(
      "message-bubble",
      role === "user" ? "user" : "assistant"
    )}>
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 relative">
            <div className="absolute animate-ping h-4 w-4 rounded-full bg-blue-400 opacity-75"></div>
            <div className="absolute h-4 w-4 rounded-full bg-blue-500"></div>
          </div>
          <span className="text-gray-600">Thinking...</span>
        </div>
      ) : (
        <div className="message-content">
          {/* Render images if present */}
          {images && images.length > 0 && (
            <div className="image-grid mb-4">
              {images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Image ${index + 1}`}
                  className="rounded-lg max-h-80 max-w-full object-contain"
                />
              ))}
            </div>
          )}
          
          {/* Render thinking process if present */}
          {thinking && (
            <Accordion type="single" collapsible className="mb-4">
              <AccordionItem value="thinking" className="border rounded-md">
                <AccordionTrigger className="py-3 px-4 bg-purple-50 hover:bg-purple-100 rounded-t-md">
                  <div className="flex items-center text-sm font-medium text-purple-700">
                    <BrainCircuit className="h-4 w-4 mr-2" />
                    Thinking Process
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3 bg-white border-t">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{thinking}</ReactMarkdown>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {/* Render reasoning if present */}
          {reasoning && (
            <Accordion type="single" collapsible className="mb-4">
              <AccordionItem value="reasoning" className="border rounded-md">
                <AccordionTrigger className="py-3 px-4 bg-amber-50 hover:bg-amber-100 rounded-t-md">
                  <div className="flex items-center text-sm font-medium text-amber-700">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Reasoning Steps
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3 bg-white border-t">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{reasoning}</ReactMarkdown>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {/* Render web search results if present */}
          {webSearch && (
            <Accordion type="single" collapsible className="mb-4">
              <AccordionItem value="web-search" className="border rounded-md">
                <AccordionTrigger className="py-3 px-4 bg-blue-50 hover:bg-blue-100 rounded-t-md">
                  <div className="flex items-center text-sm font-medium text-blue-700">
                    <Search className="h-4 w-4 mr-2" />
                    Web Search Results for "{webSearch.query}"
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-3 bg-white border-t">
                  <div className="space-y-3">
                    {webSearch.results.map((result, index) => (
                      <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                        <a 
                          href={result.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {result.title}
                        </a>
                        <p className="text-sm text-gray-600 mt-1">{result.snippet}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {/* Render message content with code blocks */}
          <div className="markdown-content">
            {contentParts.map((part, index) => (
              <React.Fragment key={index}>
                <ReactMarkdown>{part}</ReactMarkdown>
                {index < codeBlocks.length && (
                  <CodePreview
                    code={codeBlocks[index].code}
                    language={codeBlocks[index].language}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  return (
    <div className="message-list p-4 md:p-6 max-w-3xl mx-auto">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>Start a conversation by typing a message below.</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
