"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export default function TagInput({ tags, onChange, placeholder = "Add tags...", maxTags = 5 }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag]);
    }
    setInputValue("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputValue && addTag(inputValue)}
        placeholder={tags.length >= maxTags ? `Maximum ${maxTags} tags` : placeholder}
        disabled={tags.length >= maxTags}
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div
              key={index} 
              className="bg-brand/20 text-brand flex items-center gap-1 cursor-pointer hover:bg-brand/30 px-2 py-1 rounded text-sm"
              onClick={() => removeTag(index)}
            >
              {tag}
              <X className="h-3 w-3" />
            </div>
          ))}
        </div>
      )}
      <div className="text-xs text-muted">
        {tags.length}/{maxTags} tags • Press Enter or comma to add
      </div>
    </div>
  );
}
