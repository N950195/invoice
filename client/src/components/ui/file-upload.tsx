import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, Trash2 } from "lucide-react";
import { Button } from "./button";

interface FileUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
}

export function FileUpload({ onUpload, currentUrl }: FileUploadProps) {
  const [preview, setPreview] = useState<string>(currentUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      
      const response = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setPreview(data.logoUrl);
      onUpload(data.logoUrl);
      toast({
        title: "Success",
        description: "Logo uploaded successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Only image files are allowed",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleRemove = () => {
    setPreview("");
    onUpload("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        ref={fileInputRef}
        className="hidden"
      />

      {preview ? (
        // Logo Preview
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <img 
            src={preview} 
            alt="Company Logo" 
            className="w-20 h-20 object-contain mx-auto mb-2 rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            className="text-sm"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remove Logo
          </Button>
        </div>
      ) : (
        // Upload Area
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary cursor-pointer group transition-colors"
          onClick={handleClick}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
            <CloudUpload className="text-gray-400 h-6 w-6 group-hover:text-primary" />
          </div>
          <p className="text-sm text-gray-600 mb-1">
            {uploadMutation.isPending ? "Uploading..." : "Click to upload logo or drag and drop"}
          </p>
          <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
        </div>
      )}
    </div>
  );
}
