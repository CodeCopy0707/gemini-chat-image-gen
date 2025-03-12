
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface InitialWelcomeProps {
  onDismiss: () => void;
  onExampleClick: (text: string) => void;
}

const examples = [
  "Create an image of a futuristic city with flying cars",
  "Explain quantum computing in simple terms",
  "Write a short poem about technology and nature",
  "Help me plan a week-long trip to Japan",
  "What are the best practices for sustainable living?",
  "Compare and contrast machine learning and deep learning",
];

const InitialWelcome = ({ onDismiss, onExampleClick }: InitialWelcomeProps) => {
  const [visible, setVisible] = useState(true);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    // Check if the welcome screen has been shown before
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (hasSeenWelcome) {
      setVisible(false);
      onDismiss();
    }
  }, [onDismiss]);

  const handleDismiss = () => {
    setAnimatingOut(true);
    // Store in localStorage so it doesn't show again
    localStorage.setItem("hasSeenWelcome", "true");
    
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 500); // Match this with the animation duration
  };

  const handleExampleClick = (example: string) => {
    onExampleClick(example);
    handleDismiss();
  };

  if (!visible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4",
        animatingOut ? "animate-fade-out" : "animate-fade-in"
      )}
    >
      <div className="bg-card border rounded-xl shadow-lg max-w-lg w-full overflow-hidden">
        <div className="relative overflow-hidden h-32">
          <div className="absolute inset-0 bg-gradient-to-r from-gemini-blue via-gemini-purple to-gemini-green opacity-90"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <h2 className="text-2xl font-bold">Welcome to Gemini</h2>
              <p className="text-white/80 mt-1">Your AI assistant powered by Google</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-muted-foreground mb-4">
            I can help with creative tasks, answer questions, assist with learning, generate images, and much more. Try these examples or ask me anything!
          </p>
          
          <div className="grid gap-2 mb-6">
            {examples.map((example, index) => (
              <Button 
                key={index}
                variant="outline"
                className="justify-start h-auto py-3 text-left hover:bg-muted"
                onClick={() => handleExampleClick(example)}
              >
                {example}
              </Button>
            ))}
          </div>
          
          <Button 
            className="w-full"
            onClick={handleDismiss}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InitialWelcome;
