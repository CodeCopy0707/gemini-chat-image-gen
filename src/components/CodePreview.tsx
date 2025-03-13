
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, PlayCircle } from "lucide-react";
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
      // For HTML, create a preview of the code
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
    <div className="relative mt-4 mb-6">
      <div className="bg-gray-100 rounded-t-md p-2 flex justify-between items-center">
        <div className="text-sm font-medium text-gray-600">{language}</div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={copyToClipboard}
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
          
          {canPreview && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={togglePreview}
            >
              <PlayCircle className="h-3.5 w-3.5 mr-1" />
              {showPreview ? "Hide Preview" : "Run Preview"}
            </Button>
          )}
        </div>
      </div>
      
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-md overflow-x-auto">
        <code>{code}</code>
      </pre>
      
      {canPreview && showPreview && (
        <Collapsible open={showPreview} className="mt-4 border rounded-md overflow-hidden">
          <CollapsibleContent className="bg-white p-4">
            <div className="text-sm font-medium mb-2">Preview:</div>
            <div className="border rounded-md p-4 bg-white">
              <iframe 
                srcDoc={previewContent}
                title="HTML Preview"
                className="w-full min-h-[200px] border-0"
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
