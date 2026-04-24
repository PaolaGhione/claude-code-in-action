import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

vi.mock("react-resizable-panels", () => ({
  PanelGroup: ({ children }: any) => <div>{children}</div>,
  Panel: ({ children }: any) => <div>{children}</div>,
  PanelResizeHandle: () => <div />,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface" />,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree" />,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor" />,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame" />,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions" />,
}));

afterEach(() => {
  cleanup();
});

test("Preview tab is active by default and shows preview frame", () => {
  render(<MainContent />);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("clicking Code tab shows code editor and hides preview", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));

  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("clicking Preview tab switches back from code to preview", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();

  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("toggle buttons can switch views multiple times", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Start: preview
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  // Switch to code
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Switch back to preview
  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  // Switch to code again
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.getByTestId("code-editor")).toBeDefined();
});
