
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Image as ImageIcon, Mic, Globe, Lightbulb } from "lucide-react";
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
      textareaRef.current.style.height = "24px";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-4 shadow-md z-10">
      <div className="max-w-3xl mx-auto px-4">
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
                  <ArrowUp className="h-3 w-3 rotate-45" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="relative">
          <div className="rounded-xl border border-gray-300 shadow-sm focus-within:ring-1 focus-within:ring-gray-300 bg-white">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Message Gemini..."
              className="min-h-[24px] max-h-[200px] resize-none py-3 px-4 border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl shadow-none"
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
              
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={disabled || isUploading || images.length >= 5}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700"
                  disabled={true}
                >
                  <Mic className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700"
                  disabled={true}
                >
                  <Lightbulb className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                className={cn(
                  "h-8 w-8 rounded-lg bg-black text-white hover:bg-gray-800 ml-1",
                  (!message.trim() && images.length === 0) && "opacity-50 cursor-not-allowed"
                )}
                onClick={handleSendMessage}
                disabled={disabled || (!message.trim() && images.length === 0)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-2 text-center text-xs text-gray-500">
            <p>Gemini may display inaccurate info, including about people, so double-check its responses.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
