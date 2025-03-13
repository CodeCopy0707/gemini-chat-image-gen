import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Image as ImageIcon, Mic, Globe, Lightbulb, Search, BrainCircuit } from "lucide-react";
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

  const toggleOptionsPanel = () => {
    setShowOptionsPanel(!showOptionsPanel);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-white/95 backdrop-blur-sm border-t py-4 shadow-md z-10">
      <div className="max-w-3xl mx-auto px-4">
        {showOptionsPanel && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border shadow-sm transition-all duration-200 ease-in-out">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <div className="text-sm font-medium">Deep Reasoning Mode</div>
                </div>
                <Switch 
                  checked={useReasoning} 
                  onCheckedChange={setUseReasoning}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
              <div className="text-xs text-gray-600 pl-6">
                Gemini will use deeper reasoning to answer your question and show its thought process
              </div>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="h-4 w-4 text-purple-500" />
                  <div className="text-sm font-medium">Thinking Mode</div>
                </div>
                <Switch 
                  checked={useThinking} 
                  onCheckedChange={setUseThinking}
                  className="data-[state=checked]:bg-purple-500"
                />
              </div>
              <div className="text-xs text-gray-600 pl-6">
                See the AI's step-by-step thought process before getting the final answer
              </div>
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-blue-500" />
                  <div className="text-sm font-medium">Web Search</div>
                </div>
                <Switch 
                  checked={useWebSearch} 
                  onCheckedChange={setUseWebSearch}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
              <div className="text-xs text-gray-600 pl-6">
                Use web search to get up-to-date information for your queries
              </div>
            </div>
          </div>
        )}
        
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
          <div className="rounded-xl border border-gray-300 shadow-sm focus-within:ring-1 focus-within:ring-gray-300 bg-white transition-all duration-200">
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
              
              <div className="flex border rounded-lg overflow-hidden bg-gray-50">
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

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                    showOptionsPanel && "bg-gray-100"
                  )}
                  onClick={toggleOptionsPanel}
                  title="More Options"
                >
                  <Globe className="h-4 w-4" />
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
