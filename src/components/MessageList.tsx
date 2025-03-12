
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  images?: string[];
  isLoading?: boolean;
}

interface MessageListProps {
  messages: Message[];
}

const MessageList = ({ messages }: MessageListProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

  // Enhanced auto-scroll with smooth behavior
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollableDiv = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollableDiv) {
        scrollableDiv.scrollTo({
          top: scrollableDiv.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages, imagesLoaded]);

  const handleImageLoad = (imageUrl: string) => {
    setImagesLoaded((prev) => ({ ...prev, [imageUrl]: true }));
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
    <div className="flex-1 relative overflow-hidden" ref={scrollAreaRef}>
      <ScrollArea className="h-full pb-32">
        <div className="w-full mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "py-8 px-4 md:px-8",
                message.role === "assistant" ? "bg-gray-50" : "bg-white"
              )}
            >
              <div className="max-w-3xl mx-auto flex items-start gap-4">
                <div className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1",
                  message.role === "user" ? "bg-gray-300" : "bg-emerald-500"
                )}>
                  {message.role === "user" ? (
                    <UserIcon />
                  ) : (
                    <BotIcon />
                  )}
                </div>
                
                <div className="flex-1 overflow-hidden">
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
                      <Skeleton className="h-5 w-[300px]" />
                      <Skeleton className="h-5 w-[250px]" />
                      <Skeleton className="h-5 w-[200px]" />
                    </div>
                  ) : (
                    <div className={cn(
                      "prose prose-lg max-w-none leading-relaxed",
                      message.role === "assistant" ? "prose-neutral" : ""
                    )}>
                      {message.role === "assistant" ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      ) : (
                        <p className="text-lg">{message.content}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="h-32" />
      </ScrollArea>
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
