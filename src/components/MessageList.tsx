
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
          <h3 className="text-3xl font-semibold">What can I help with?</h3>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea
      ref={scrollRef}
      className="flex-1 overflow-y-auto thin-scrollbar"
    >
      <div className="w-full max-w-4xl mx-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "py-6 px-4 md:px-8",
              message.role === "assistant" ? "bg-gray-50" : "bg-white"
            )}
          >
            <div className="max-w-3xl mx-auto flex items-start gap-4">
              <div className={cn(
                "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1",
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
                  <div className="mb-3 space-y-2">
                    {message.images.map((img, index) => (
                      <div key={index} className="relative">
                        {!imagesLoaded[img] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
                            <ImageIcon className="h-8 w-8 text-gray-400 animate-pulse" />
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
                    "prose prose-sm max-w-none",
                    message.role === "assistant" ? "prose-neutral" : ""
                  )}>
                    {message.role === "assistant" ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-32" /> {/* Extra space at the bottom for better UX */}
    </ScrollArea>
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
