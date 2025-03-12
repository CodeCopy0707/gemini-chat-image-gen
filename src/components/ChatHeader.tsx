
import { Button } from "@/components/ui/button";
import { Menu, Settings, UserCircle } from "lucide-react";
import { useState } from "react";

interface ChatHeaderProps {
  toggleSidebar: () => void;
}

const ChatHeader = ({ toggleSidebar }: ChatHeaderProps) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="w-full h-14 flex items-center justify-between px-4 sticky top-0 z-10 bg-white border-b">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1.5">
          <h1 className="text-lg font-semibold">ChatGPT</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-xs text-gray-500">
          Memory Full
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-gray-100 rounded-full"
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-gray-100 rounded-full"
        >
          <UserCircle className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;
