"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

interface ToolCallDisplayProps {
  toolInvocation: ToolInvocation;
}

export function getLabel(toolName: string, args: Record<string, unknown>): string {
  const filename =
    typeof args.path === "string"
      ? (args.path.split("/").pop() ?? args.path)
      : "file";

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":      return `Creating ${filename}`;
      case "str_replace": return `Editing ${filename}`;
      case "insert":      return `Inserting into ${filename}`;
      case "view":        return `Reading ${filename}`;
      case "undo_edit":   return `Undoing edit on ${filename}`;
      default:            return `Editing ${filename}`;
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": return `Renaming ${filename}`;
      case "delete": return `Deleting ${filename}`;
      default:       return `File operation on ${filename}`;
    }
  }

  return toolName;
}

export function ToolCallDisplay({ toolInvocation }: ToolCallDisplayProps) {
  const { toolName, args, state, result } = toolInvocation;
  const done = state === "result" && result != null;
  const label = getLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
