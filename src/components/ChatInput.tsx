
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Image as ImageIcon, Mic, Globe, Lightbulb, Search, BrainCircuit } from "lucide-react";
import { useRef, useState, KeyboardEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
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
        200
      )}px`;
    }
  };

  return (
    <div className="input-box">
      <Collapsible 
        open={showOptionsPanel} 
        onOpenChange={setShowOptionsPanel}
        className="w-full"
      >
        <CollapsibleContent className="p-3 bg-gray-50 rounded-t-lg border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="options-switch">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="options-label">Deep Reasoning</span>
              </div>
              <Switch 
                checked={useReasoning} 
                onCheckedChange={setUseReasoning}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
            
            <div className="options-switch">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="h-4 w-4 text-purple-500" />
                <span className="options-label">Thinking Mode</span>
              </div>
              <Switch 
                checked={useThinking} 
                onCheckedChange={setUseThinking}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
            
            <div className="options-switch">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-blue-500" />
                <span className="options-label">Web Search</span>
              </div>
              <Switch 
                checked={useWebSearch} 
                onCheckedChange={setUseWebSearch}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
          </div>
        </CollapsibleContent>
      
        {images.length > 0 && (
          <div className="image-preview p-2 bg-white border-b">
            <div className="flex flex-wrap gap-2">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt={`Upload ${index + 1}`}
                    className="h-16 w-16 object-cover rounded-md border"
                  />
                  <button
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                    onClick={() => removeImage(index)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      
        <div className="flex items-end p-2 bg-white rounded-b-lg">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Message Gemini..."
              className="min-h-[44px] resize-none border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>
          
          <div className="flex items-center ml-2">
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={disabled || isUploading}
            />
            
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                  useWebSearch && "text-blue-500 bg-blue-50"
                )}
                onClick={() => setUseWebSearch(!useWebSearch)}
                disabled={disabled}
                title="Web Search"
              >
                <Search className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                  useReasoning && "text-amber-500 bg-amber-50"
                )}
                onClick={() => setUseReasoning(!useReasoning)}
                disabled={disabled}
                title="Reasoning Mode"
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                  useThinking && "text-purple-500 bg-purple-50"
                )}
                onClick={() => setUseThinking(!useThinking)}
                disabled={disabled}
                title="Thinking Mode"
              >
                <BrainCircuit className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => imageInputRef.current?.click()}
                disabled={disabled || isUploading || images.length >= 5}
                title="Upload Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                disabled={true}
                title="Voice Input (Coming Soon)"
              >
                <Mic className="h-4 w-4" />
              </Button>

              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                    showOptionsPanel && "bg-gray-100"
                  )}
                  title="More Options"
                >
                  <Globe className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <Button
              className={cn(
                "h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 ml-2",
                (!message.trim() && images.length === 0) && "opacity-50 cursor-not-allowed"
              )}
              onClick={handleSendMessage}
              disabled={disabled || (!message.trim() && images.length === 0)}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Collapsible>
      
      <div className="mt-2 text-center text-xs text-gray-500 px-4 pb-2">
        <p>Gemini may display inaccurate info, including about people, so double-check its responses.</p>
      </div>
    </div>
  );
};

export default ChatInput;
