import { createFileRoute } from "@tanstack/react-router";
import { ChatThread } from "@/components/ChatThread";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: () => <ChatThread key="new" conversationId={null} />,
});
