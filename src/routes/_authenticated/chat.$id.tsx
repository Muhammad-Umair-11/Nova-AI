import { createFileRoute } from "@tanstack/react-router";
import { ChatThread } from "@/components/ChatThread";

export const Route = createFileRoute("/_authenticated/chat/$id")({
  component: Thread,
});

function Thread() {
  const { id } = Route.useParams();
  return <ChatThread key={id} conversationId={id} />;
}
