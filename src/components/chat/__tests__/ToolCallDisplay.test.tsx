import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallDisplay, getLabel } from "../ToolCallDisplay";

afterEach(() => {
  cleanup();
});

// --- getLabel unit tests ---

test("str_replace_editor create returns Creating <filename>", () => {
  expect(getLabel("str_replace_editor", { command: "create", path: "src/App.jsx" })).toBe("Creating App.jsx");
});

test("str_replace_editor str_replace returns Editing <filename>", () => {
  expect(getLabel("str_replace_editor", { command: "str_replace", path: "src/utils.ts" })).toBe("Editing utils.ts");
});

test("str_replace_editor insert returns Inserting into <filename>", () => {
  expect(getLabel("str_replace_editor", { command: "insert", path: "src/index.tsx" })).toBe("Inserting into index.tsx");
});

test("str_replace_editor view returns Reading <filename>", () => {
  expect(getLabel("str_replace_editor", { command: "view", path: "src/styles.css" })).toBe("Reading styles.css");
});

test("str_replace_editor undo_edit returns Undoing edit on <filename>", () => {
  expect(getLabel("str_replace_editor", { command: "undo_edit", path: "src/main.ts" })).toBe("Undoing edit on main.ts");
});

test("str_replace_editor unknown command falls back to Editing <filename>", () => {
  expect(getLabel("str_replace_editor", { command: "unknown", path: "src/foo.ts" })).toBe("Editing foo.ts");
});

test("file_manager rename returns Renaming <filename>", () => {
  expect(getLabel("file_manager", { command: "rename", path: "src/old.ts" })).toBe("Renaming old.ts");
});

test("file_manager delete returns Deleting <filename>", () => {
  expect(getLabel("file_manager", { command: "delete", path: "src/temp.js" })).toBe("Deleting temp.js");
});

test("unknown tool name returns tool name as-is", () => {
  expect(getLabel("some_other_tool", { command: "run", path: "file.ts" })).toBe("some_other_tool");
});

test("missing path falls back to 'file'", () => {
  expect(getLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

// --- ToolCallDisplay render tests ---

function makeInvocation(overrides = {}) {
  return {
    toolCallId: "test-id",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/App.jsx" },
    state: "call",
    result: undefined,
    ...overrides,
  };
}

test("shows spinner when state is not result", () => {
  render(<ToolCallDisplay toolInvocation={makeInvocation({ state: "call" })} />);
  expect(screen.getByText("Creating App.jsx")).toBeTruthy();
  // Spinner has animate-spin class
  const svg = document.querySelector("svg");
  expect(svg?.getAttribute("class")).toContain("animate-spin");
});

test("shows green dot when state is result with a result value", () => {
  render(
    <ToolCallDisplay
      toolInvocation={makeInvocation({ state: "result", result: "ok" })}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeTruthy();
  // No spinner
  expect(document.querySelector("svg")).toBeNull();
  // Green dot div present
  const dot = document.querySelector(".bg-emerald-500");
  expect(dot).toBeTruthy();
});

test("shows spinner when state is result but result is null", () => {
  render(
    <ToolCallDisplay
      toolInvocation={makeInvocation({ state: "result", result: null })}
    />
  );
  const svg = document.querySelector("svg");
  expect(svg?.getAttribute("class")).toContain("animate-spin");
});

test("renders label from file_manager delete", () => {
  render(
    <ToolCallDisplay
      toolInvocation={makeInvocation({
        toolName: "file_manager",
        args: { command: "delete", path: "src/temp.js" },
        state: "result",
        result: { success: true },
      })}
    />
  );
  expect(screen.getByText("Deleting temp.js")).toBeTruthy();
});
