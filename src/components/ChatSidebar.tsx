
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
        "fixed inset-y-0 left-0 z-20 w-80 bg-background border-r transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="md:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4">
        <Button 
          onClick={onNewChat} 
          className="w-full justify-start gap-2 bg-primary/90 hover:bg-primary transition-all duration-300"
        >
          <Plus className="h-4 w-4" /> New chat
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-9rem)] p-4">
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <Button
              key={conversation.id}
              variant={activeConversation === conversation.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-left h-auto py-2 px-3",
                activeConversation === conversation.id ? "bg-secondary" : ""
              )}
              onClick={() => setActiveConversation(conversation.id)}
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-medium line-clamp-1">{conversation.title}</span>
                <span className="text-xs text-muted-foreground">
                  {conversation.date.toLocaleDateString()}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
