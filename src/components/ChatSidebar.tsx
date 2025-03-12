
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  conversations: { id: string; title: string; date: Date }[];
  activeConversation: string | null;
  setActiveConversation: (id: string) => void;
}

const ChatSidebar = ({
  isOpen,
  onClose,
  onNewChat,
  conversations,
  activeConversation,
  setActiveConversation,
}: ChatSidebarProps) => {
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-20 w-[260px] bg-[#202123] transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-14 items-center justify-between p-2">
        <h2 className="text-sm font-normal text-gray-200 ml-2">ChatGPT</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-gray-700"
        >
          <X className="h-4 w-4 text-gray-300" />
        </Button>
      </div>

      <div className="p-2">
        <Button 
          onClick={onNewChat} 
          className="w-full justify-start gap-2 bg-transparent border border-gray-700 hover:bg-gray-800 text-white rounded-md"
        >
          <Plus className="h-4 w-4" /> New chat
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-5rem)] p-2">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <Button
              key={conversation.id}
              variant={activeConversation === conversation.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-left h-auto py-3 px-3 rounded-md",
                activeConversation === conversation.id ? "bg-gray-800" : "hover:bg-gray-800",
                "text-gray-300"
              )}
              onClick={() => setActiveConversation(conversation.id)}
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-medium line-clamp-1 text-sm">{conversation.title}</span>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
