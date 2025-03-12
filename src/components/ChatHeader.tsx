
import { Button } from "@/components/ui/button";
import { Menu, Settings, UserCircle } from "lucide-react";
import { useState } from "react";

interface ChatHeaderProps {
  toggleSidebar: () => void;
}

const ChatHeader = ({ toggleSidebar }: ChatHeaderProps) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="w-full h-16 border-b flex items-center justify-between px-4 glassmorphism sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-gemini-blue via-gemini-purple to-gemini-green"></div>
          <h1 className="text-lg font-semibold">Gemini</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setShowSettings(!showSettings)}
          className="transition-all hover:rotate-45"
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <UserCircle className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;
