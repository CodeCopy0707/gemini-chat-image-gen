
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Image as ImageIcon, Mic, X } from "lucide-react";
import { useRef, useState, KeyboardEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (message: string, images?: string[]) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    if (message.trim() || images.length > 0) {
      onSendMessage(message, images.length > 0 ? images : undefined);
      setMessage("");
      setImages([]);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = "56px";
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
    
    // Clear input value so the same file can be selected again
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "56px";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  return (
    <div className="p-4 border-t glassmorphism sticky bottom-0 z-10">
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
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Gemini..."
            className="pr-24 min-h-[56px] max-h-[200px] resize-none py-4"
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
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled || isUploading || images.length >= 5}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              disabled={true} // Disabled for now
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <Button
          className={cn(
            "h-[56px] w-[56px] rounded-full flex-shrink-0",
            "bg-primary/90 hover:bg-primary transition-all duration-300",
            (!message.trim() && images.length === 0) && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleSendMessage}
          disabled={disabled || (!message.trim() && images.length === 0)}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInput;
