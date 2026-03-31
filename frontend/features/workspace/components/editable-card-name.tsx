"use client";

import { useCallback } from "react";

export type EditableCardType =
  | "image"
  | "text"
  | "video"
  | "video-frame"
  | "video-generation"
  | "image-generation"
  | "image-result"
  | "video-result"
  | "preview"
  | "storyboard-form";

export const NODE_NAME_DATA_KEY = "nodeName";

const DEFAULT_CARD_NAMES: Record<EditableCardType, string> = {
  image: "上传文件",
  "image-generation": "生成图片",
  "image-result": "图片结果",
  preview: "预览节点",
  "storyboard-form": "分镜节点",
  text: "文本节点",
  video: "生成视频",
  "video-frame": "视频输入",
  "video-generation": "生成视频",
  "video-result": "视频结果",
};

export function getDefaultCardName(type: EditableCardType): string {
  return DEFAULT_CARD_NAMES[type];
}

export function getCardNameValue(
  data: Record<string, unknown> | undefined,
  defaultValue: string
): string {
  if (
    data &&
    Object.prototype.hasOwnProperty.call(data, NODE_NAME_DATA_KEY) &&
    typeof data[NODE_NAME_DATA_KEY] === "string"
  ) {
    return data[NODE_NAME_DATA_KEY] as string;
  }

  return defaultValue;
}

function estimateInputWidth(text: string, fallbackText: string): string {
  const source = text || fallbackText;
  let units = 0;

  for (const char of source) {
    units += /[^\u0000-\u00ff]/.test(char) ? 2 : 1;
  }

  return `${Math.max(units + 2, 8)}ch`;
}

interface EditableCardNameProps {
  value: string;
  defaultValue: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  className?: string;
}

export function EditableCardName({
  value,
  defaultValue,
  onChange,
  onFocus,
  className,
}: EditableCardNameProps) {
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  }, [onChange]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const normalizedValue = e.target.value.trim() || defaultValue;

    if (normalizedValue !== e.target.value) {
      onChange?.(normalizedValue);
    }
  }, [defaultValue, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }, []);

  return (
    <input
      value={value}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      spellCheck={false}
      className={className}
      style={{ width: estimateInputWidth(value, defaultValue) }}
      aria-label="编辑节点名称"
    />
  );
}
