import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { sendMessage, regenerateReply } from "@/lib/chat.functions";
import { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Trash2, ThumbsUp, ThumbsDown, Paperclip, ArrowUp, AlertCircle, Lightbulb, Mail, Bug, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Msg = { id: string; sender: string; content: string; created_at: string; feedback?: string | null };

const suggestions = [
  { icon: Lightbulb, text: "Explain something to me" },
  { icon: Mail, text: "Help me write an email" },
  { icon: Bug, text: "Help me debug code" },
  { icon: FileText, text: "Summarize a document" },
];

export function ChatThread({ conversationId }: { conversationId: string | null }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const send = useServerFn(sendMessage);
  const regen = useServerFn(regenerateReply);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Msg | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const key = ["messages", conversationId];

  const { data: conv } = useQuery({
    queryKey: ["conversation", conversationId],
    enabled: !!conversationId,
    queryFn: async () => (await supabase.from("conversations").select("id, title").eq("id", conversationId!).maybeSingle()).data,
  });
  const { data: messages = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("id, sender, content, created_at, feedback").eq("conversation_id", conversationId!).order("created_at");
      if (error) throw error;
      return data as Msg[];
    },
  });

  // Carry over the optimistic message after navigating from the empty state
  useEffect(() => {
    const carry = sessionStorage.getItem("nova-pending");
    if (carry && conversationId) {
      const p = JSON.parse(carry) as { id: string; content: string; error?: string };
      if (p.id === conversationId && p.error) setFailed(p.error);
      sessionStorage.removeItem("nova-pending");
    }
    textRef.current?.focus();
  }, [conversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pending, busy]);

  const refresh = (id: string) => {
    qc.invalidateQueries({ queryKey: ["messages", id] });
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const submit = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    setFailed(null);
    setBusy(true);
    setPending({ id: "pending", sender: "user", content, created_at: new Date().toISOString() });
    try {
      const res = await send({ data: { conversationId, content } });
      if (!conversationId) {
        if (res.error) sessionStorage.setItem("nova-pending", JSON.stringify({ id: res.conversationId, error: res.error }));
        await qc.invalidateQueries({ queryKey: ["conversations"] });
        navigate({ to: "/chat/$id", params: { id: res.conversationId } });
        return;
      }
      await qc.refetchQueries({ queryKey: key });
      refresh(res.conversationId);
      if (res.error) setFailed(res.error);
    } catch (e) {
      setInput(content);
      toast.error((e as Error).message || "Message failed to send. Check your connection.");
    } finally {
      setPending(null);
      setBusy(false);
      textRef.current?.focus();
    }
  };

  const regenerate = async () => {
    if (!conversationId || busy) return;
    setFailed(null);
    setBusy(true);
    qc.setQueryData<Msg[]>(key, (m) => (m && m[m.length - 1]?.sender === "assistant" ? m.slice(0, -1) : m));
    try {
      const res = await regen({ data: { conversationId } });
      if (res.error) setFailed(res.error);
    } catch (e) {
      setFailed((e as Error).message);
    } finally {
      await qc.refetchQueries({ queryKey: key });
      setBusy(false);
    }
  };

  const setFeedback = async (m: Msg, fb: "like" | "dislike") => {
    const next = m.feedback === fb ? null : fb;
    qc.setQueryData<Msg[]>(key, (all) => all?.map((x) => (x.id === m.id ? { ...x, feedback: next } : x)));
    await supabase.from("messages").update({ feedback: next }).eq("id", m.id);
  };

  const del = async (m: Msg) => {
    qc.setQueryData<Msg[]>(key, (all) => all?.filter((x) => x.id !== m.id));
    const { error } = await supabase.from("messages").delete().eq("id", m.id);
    if (error) { toast.error("Couldn't delete message"); qc.invalidateQueries({ queryKey: key }); }
  };

  const all = pending ? [...messages, pending] : messages;
  const empty = !conversationId && !pending;
  const lastAssistant = [...messages].reverse().find((m) => m.sender === "assistant");

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-5">
        <LogoMark className="h-7 w-7" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{conv?.title ?? "New conversation"}</p>
          <p className="text-xs text-muted-foreground">NovaAI Assistant</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-6 text-center">
            <LogoMark className="h-12 w-12 rounded-xl" />
            <h2 className="mt-5 text-2xl font-semibold">How can I help you today?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Ask a question or start with one of these.</p>
            <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
              {suggestions.map((s) => (
                <button key={s.text} onClick={() => submit(s.text)} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left text-sm shadow-card transition-colors hover:border-primary/40 hover:bg-primary-soft">
                  <s.icon className="h-4 w-4 text-primary" />{s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-5 py-8">
            {isLoading && <p className="text-center text-sm text-muted-foreground">Loading conversation…</p>}
            {all.map((m) => (
              <MessageRow key={m.id} m={m} canRegen={m.id === lastAssistant?.id && !busy} onCopy={() => { navigator.clipboard.writeText(m.content); toast.success("Copied"); }} onRegen={regenerate} onFeedback={(f) => setFeedback(m, f)} onDelete={() => del(m)} />
            ))}
            {busy && (
              <div className="flex items-center gap-3">
                <LogoMark className="h-7 w-7" />
                <div className="flex gap-1 rounded-2xl bg-muted px-4 py-3">
                  {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: `${i * 120}ms` }} />)}
                </div>
              </div>
            )}
            {failed && !busy && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-destructive"><AlertCircle className="h-4 w-4" />{failed}</span>
                <Button size="sm" variant="outline" onClick={regenerate}><RefreshCw />Retry</Button>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 px-5 pb-5">
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-card p-2 shadow-card focus-within:border-primary/50">
          <Button type="button" variant="ghost" size="icon" aria-label="Attach file" onClick={() => toast.info("Attachments are coming soon.")}><Paperclip /></Button>
          <textarea
            ref={textRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Message NovaAI…"
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" aria-label="Send" disabled={!input.trim() || busy}><ArrowUp /></Button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">Enter to send · Shift + Enter for a new line</p>
      </div>
    </div>
  );
}

function MessageRow({ m, canRegen, onCopy, onRegen, onFeedback, onDelete }: { m: Msg; canRegen: boolean; onCopy: () => void; onRegen: () => void; onFeedback: (f: "like" | "dislike") => void; onDelete: () => void }) {
  const time = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isUser = m.sender === "user";
  const act = "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
  if (isUser)
    return (
      <div className="group flex flex-col items-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm text-ink-foreground">{m.content}</div>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {m.id !== "pending" && <button className={cn(act, "opacity-0 group-hover:opacity-100")} onClick={onDelete} aria-label="Delete message"><Trash2 className="h-3.5 w-3.5" /></button>}
          {time}
        </div>
      </div>
    );
  return (
    <div className="group flex gap-3">
      <LogoMark className="h-7 w-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-ink [&_pre]:p-3 [&_pre]:text-ink-foreground [&_pre_code]:bg-transparent [&_ul]:list-disc [&_ul]:pl-5 [&_h1]:text-lg [&_h2]:text-base [&_h3]:font-semibold [&_a]:text-primary">
          <ReactMarkdown>{m.content}</ReactMarkdown>
        </div>
        <div className="mt-1 flex items-center gap-0.5 text-xs text-muted-foreground">
          <span className="mr-2">{time}</span>
          <button className={act} onClick={onCopy} aria-label="Copy"><Copy className="h-3.5 w-3.5" /></button>
          {canRegen && <button className={act} onClick={onRegen} aria-label="Regenerate"><RefreshCw className="h-3.5 w-3.5" /></button>}
          <button className={cn(act, m.feedback === "like" && "text-primary")} onClick={() => onFeedback("like")} aria-label="Helpful"><ThumbsUp className="h-3.5 w-3.5" /></button>
          <button className={cn(act, m.feedback === "dislike" && "text-destructive")} onClick={() => onFeedback("dislike")} aria-label="Not helpful"><ThumbsDown className="h-3.5 w-3.5" /></button>
          <button className={act} onClick={onDelete} aria-label="Delete message"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
