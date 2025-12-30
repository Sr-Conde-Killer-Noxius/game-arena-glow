import { useState, useRef } from "react";
import { Upload, X, Check, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  description: string;
  required?: boolean;
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
}

export function FileUpload({
  label,
  description,
  required = false,
  value,
  onChange,
  accept = "image/*",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleFileChange = (file: File) => {
    onChange(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange(null);
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-destructive hover:underline flex items-center gap-1"
          >
            <X size={12} />
            Remover
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>

      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-primary/50 bg-primary/5">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover"
          />
          <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
            <Check size={14} className="text-primary-foreground" />
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer",
            "hover:border-primary/50 hover:bg-primary/5",
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border bg-muted/30"
          )}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {isDragging ? (
                <Image size={20} className="text-primary" />
              ) : (
                <Upload size={20} className="text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-medium">
                  Clique para enviar
                </span>{" "}
                ou arraste
              </p>
              <p className="text-xs text-muted-foreground/70">
                PNG, JPG até 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileChange(file);
        }}
        className="hidden"
      />
    </div>
  );
}
