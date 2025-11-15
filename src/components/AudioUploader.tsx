import { Upload } from "lucide-react";
import { useCallback } from "react";
import { Card } from "@/components/ui/card";

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
}

export const AudioUploader = ({ onFileSelect }: AudioUploaderProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <Card
      className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <label className="flex flex-col items-center justify-center p-12 cursor-pointer">
        <Upload className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-xl font-semibold mb-2">Upload Audio File</h3>
        <p className="text-muted-foreground text-center mb-4">
          Drag and drop or click to select
        </p>
        <p className="text-sm text-muted-foreground">
          Supports: MP3, WAV, OGG, M4A
        </p>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </label>
    </Card>
  );
};
