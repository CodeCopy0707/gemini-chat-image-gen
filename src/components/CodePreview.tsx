
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, PlayCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CodePreviewProps {
  code: string;
  language: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ code, language }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  
  useEffect(() => {
    if (language === "html" && showPreview) {
      setPreviewContent(code);
    }
  }, [code, language, showPreview]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };
  
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };
  
  // Only show run button for HTML
  const canPreview = language === "html";
  
  return (
    <div className="code-window mt-4 mb-6">
      <div className="code-header">
        <div className="code-language">{language}</div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 text-xs bg-white"
            onClick={copyToClipboard}
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
          
          {canPreview && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2 text-xs bg-white"
              onClick={togglePreview}
            >
              <PlayCircle className="h-3.5 w-3.5 mr-1" />
              {showPreview ? "Hide Preview" : "Run Preview"}
            </Button>
          )}
        </div>
      </div>
      
      <pre className="code-content">
        <code>{code}</code>
      </pre>
      
      {canPreview && (
        <Collapsible open={showPreview} className="border-t border-gray-200">
          <CollapsibleContent className="bg-white p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Preview:</div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={togglePreview}
                className="h-7 w-7 p-0"
              >
                {showPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            <div className="border rounded-md bg-white">
              <iframe 
                srcDoc={previewContent}
                title="HTML Preview"
                className="preview-iframe"
                sandbox="allow-scripts"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default CodePreview;
