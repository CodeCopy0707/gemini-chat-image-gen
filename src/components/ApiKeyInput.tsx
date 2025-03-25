
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { KeyRound } from "lucide-react";

interface ApiKeyInputProps {
  onSubmit: (apiKey: string) => void;
}

const ApiKeyInput = ({ onSubmit }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [showForm, setShowForm] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      // Store API key in localStorage for persistence
      localStorage.setItem("geminiApiKey", apiKey.trim());
      onSubmit(apiKey.trim());
      setShowForm(false);
    }
  };

  const handleResetApiKey = () => {
    localStorage.removeItem("geminiApiKey");
    setApiKey("");
    setShowForm(true);
  };

  // If API key is already stored, retrieve it
  useEffect(() => {
    const storedApiKey = localStorage.getItem("geminiApiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
      onSubmit(storedApiKey);
      setShowForm(false);
    }
  }, [onSubmit]);

  if (!showForm) {
    return (
      <div className="fixed bottom-4 right-4 z-20">
        <Button
          size="sm"
          variant="outline"
          className="flex items-center gap-2 text-xs"
          onClick={handleResetApiKey}
        >
          <KeyRound className="h-3 w-3" /> Change API Key
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-card border rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Enter Gemini API Key</h2>
          <p className="text-muted-foreground text-sm">
            To use this application, you need to provide your Google Gemini API key.
            Your key will be stored locally in your browser.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="AIzaSyBXzTBmok03zex9Xu6BzNEQpiUhP0NFh58..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored only in your browser and never sent to our servers.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={!apiKey.trim()}>
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyInput;
