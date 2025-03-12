
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, imagesLoaded]);

  const handleImageLoad = (imageUrl: string) => {
    setImagesLoaded((prev) => ({ ...prev, [imageUrl]: true }));
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md mx-auto">
          <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-gemini-blue via-gemini-purple to-gemini-green p-4 flex items-center justify-center">
            <div className="bg-white h-8 w-8 rounded-full flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-gradient-to-br from-gemini-blue via-gemini-purple to-gemini-green animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-xl font-semibold">How can I help you today?</h3>
          <p className="text-muted-foreground">
            Ask me anything, from creative ideas to technical information. I can also generate images based on your descriptions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea
      ref={scrollRef}
      className="flex-1 p-4 md:p-6 overflow-y-auto thin-scrollbar"
    >
      <div className="space-y-6 max-w-3xl mx-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex animate-fade-in",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg p-4",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.images && message.images.length > 0 && (
                <div className="mb-3 space-y-2">
                  {message.images.map((img, index) => (
                    <div key={index} className="relative">
                      {!imagesLoaded[img] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-md">
                          <ImageIcon className="h-8 w-8 text-muted-foreground animate-pulse" />
                        </div>
                      )}
                      <img
                        src={img}
                        alt={`Uploaded image ${index + 1}`}
                        className="rounded-md max-h-72 w-auto object-contain"
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
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              ) : (
                <div className={cn(
                  message.role === "assistant" ? "markdown-content" : ""
                )}>
                  {message.role === "assistant" ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              )}
              
              <div className="mt-2 text-xs opacity-70 text-right">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-4" />
    </ScrollArea>
  );
};

export default MessageList;
