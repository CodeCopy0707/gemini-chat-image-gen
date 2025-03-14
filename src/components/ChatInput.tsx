
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Send, Image as ImageIcon, Mic, Globe, Lightbulb, Search, BrainCircuit } from "lucide-react";
import { useRef, useState, KeyboardEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface ChatInputProps {
  onSendMessage: (message: string, options: {
    images?: string[];
    useReasoning?: boolean;
    useWebSearch?: boolean;
    useThinking?: boolean;
  }) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [useReasoning, setUseReasoning] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    if (message.trim() || images.length > 0) {
      onSendMessage(message, {
        images: images.length > 0 ? images : undefined,
        useReasoning,
        useWebSearch,
        useThinking
      });
      setMessage("");
      setImages([]);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = "24px";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      
      const newImages: string[] = [];
      const files = Array.from(e.target.files);
      
      if (files.length + images.length > 5) {
        toast.error("You can only upload up to 5 images");
        setIsUploading(false);
        return;
      }
      
      let processed = 0;
      
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result as string);
          }
          
          processed += 1;
          if (processed === files.length) {
            setImages((prev) => [...prev, ...newImages]);
            setIsUploading(false);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  return (
    <div className="relative">
      {images.length > 0 && (
        <div className="mb-2 flex items-center gap-2 overflow-x-auto thin-scrollbar py-2">
          {images.map((img, index) => (
            <div key={index} className="relative flex-shrink-0">
              <img
                src={img}
                alt={`Upload ${index + 1}`}
                className="h-16 w-16 object-cover rounded-md border"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                onClick={() => removeImage(index)}
              >
                <PlusCircle className="h-3 w-3 rotate-45" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div className="chat-input relative border border-gray-300 rounded-xl shadow-sm">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          className="min-h-[24px] max-h-[120px] resize-none py-3 pl-4 pr-24 border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl shadow-none"
          disabled={disabled}
        />
        
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
            disabled={disabled || isUploading}
          />
          
          <div className="flex items-center gap-1.5 mr-1.5">
            <button
              className={cn(
                "p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
                useWebSearch && "text-blue-500 bg-blue-50"
              )}
              onClick={() => setUseWebSearch(!useWebSearch)}
              disabled={disabled}
              title="Web Search"
            >
              <Search className="h-4 w-4" />
            </button>
            
            <button
              className={cn(
                "p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors",
                useReasoning && "text-amber-500 bg-amber-50"
              )}
              onClick={() => setUseReasoning(!useReasoning)}
              disabled={disabled}
              title="Reasoning Mode"
            >
              <Lightbulb className="h-4 w-4" />
            </button>
            
            <button
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || isUploading || images.length >= 5}
              title="Upload Image"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            
            <button
              className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={true}
              title="Voice Input (Coming Soon)"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
          
          <Button
            className={cn(
              "h-8 w-8 rounded-lg bg-black text-white hover:bg-gray-800",
              (!message.trim() && images.length === 0) && "opacity-50 cursor-not-allowed"
            )}
            onClick={handleSendMessage}
            disabled={disabled || (!message.trim() && images.length === 0)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
