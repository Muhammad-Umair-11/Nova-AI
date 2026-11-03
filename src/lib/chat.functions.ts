import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";

const SYSTEM_PROMPT =
  "You are NovaAI, a friendly, professional customer support assistant. Give clear, accurate, concise answers. Use markdown (lists, short headings, code blocks) when it helps readability. If you don't know something, say so and suggest a next step.";

type Supa = Parameters<Parameters<ReturnType<typeof createServerFn>["handler"]>[0]>[0] extends never ? never : any;

function friendlyError(e: unknown): string {
  if (e instanceof GatewayError) {
    const name = e.constructor.name;
    if (name === "RateLimitError") return "NovaAI is getting a lot of requests right now. Please wait a moment and try again.";
    if (name === "PaymentRequiredError") return "AI usage credits have run out for this workspace. Please top up to continue.";
    if (name === "TimeoutError" || name === "NetworkError") return "The AI service didn't respond in time. Please try again.";
    console.error("Gateway error", e.code, e.ids);
    return "The AI service couldn't answer this time. Please try again.";
  }
  console.error(e);
  return "Something went wrong while generating a reply. Please try again.";
}

async function generateReply(supabase: Supa, conversationId: string): Promise<{ id: string; content: string; created_at: string; sender: string }> {
  const { data: history, error } = await supabase
    .from("messages")
    .select("sender, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(40);
  if (error) throw new Error("Could not load conversation history.");

  let text: string;
  try {
    const res = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions: SYSTEM_PROMPT,
      input: (history ?? []).map((m: { sender: string; content: string }) => ({
        role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      })),
    });
    text = "";
    for (const item of res.output ?? []) {
      if (item.type === "message") {
        for (const c of item.content) if (c.type === "output_text") text += c.text;
      }
    }
    if (!text.trim()) text = "I'm sorry, I couldn't produce a response for that. Could you rephrase?";
  } catch (e) {
    throw new Error(friendlyError(e));
  }

  const { data: claims } = await supabase.auth.getUser();
  const { data: saved, error: insErr } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, user_id: claims.user!.id, sender: "assistant", content: text })
    .select("id, content, created_at, sender")
    .single();
  if (insErr) throw new Error("The reply was generated but couldn't be saved.");
  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  return saved;
}

function makeTitle(text: string) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 48 ? t.slice(0, 48).trimEnd() + "…" : t || "New conversation";
}

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { conversationId?: string | null; content: string }) => {
    const content = String(input?.content ?? "").trim();
    if (!content) throw new Error("Message can't be empty.");
    if (content.length > 8000) throw new Error("Message is too long (max 8000 characters).");
    const id = input.conversationId ?? null;
    if (id && !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid conversation.");
    return { conversationId: id, content };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let conversationId = data.conversationId;

    if (conversationId) {
      const { data: conv } = await supabase.from("conversations").select("id").eq("id", conversationId).maybeSingle();
      if (!conv) throw new Error("Conversation not found.");
    } else {
      const { data: conv, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title: makeTitle(data.content) })
        .select("id")
        .single();
      if (error || !conv) throw new Error("Could not start a new conversation.");
      conversationId = conv.id;
    }

    const { error: uErr } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, user_id: userId, sender: "user", content: data.content });
    if (uErr) throw new Error("Your message couldn't be saved.");

    try {
      const reply = await generateReply(supabase, conversationId!);
      return { conversationId: conversationId!, reply, error: null as string | null };
    } catch (e) {
      return { conversationId: conversationId!, reply: null, error: (e as Error).message };
    }
  });

export const regenerateReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { conversationId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(input?.conversationId ?? "")) throw new Error("Invalid conversation.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: last } = await supabase
      .from("messages")
      .select("id, sender")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!last) throw new Error("Conversation not found.");
    if (last.sender === "assistant") await supabase.from("messages").delete().eq("id", last.id);
    try {
      const reply = await generateReply(supabase, data.conversationId);
      return { reply, error: null as string | null };
    } catch (e) {
      return { reply: null, error: (e as Error).message };
    }
  });
