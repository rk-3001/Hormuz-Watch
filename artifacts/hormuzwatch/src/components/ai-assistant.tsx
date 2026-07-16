import { useState, useRef, useEffect } from "react";
import { useAssistantChat } from "@workspace/api-client-react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

type Message = { role: "user" | "assistant"; content: string };

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "HormuzWatch AI ready. How can I assist with your supply chain risk analysis today?" }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = useAssistantChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");

    chatMutation.mutate({ data: { message: userMessage } }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      },
      onError: () => {
        setMessages(prev => [...prev, { role: "assistant", content: "Error: Unable to connect to intelligence server." }]);
      }
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[400px] h-[550px] bg-card border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden z-50"
          >
            <div className="h-14 bg-background/50 border-b border-white/10 flex items-center justify-between px-4">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">Strategic Analyst AI</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-lg px-4 py-2.5 text-sm",
                    msg.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-background border border-white/10 text-foreground rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-background border border-white/10 rounded-lg rounded-tl-none px-4 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/10 bg-background/50">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                />
                <button
                  type="submit"
                  disabled={chatMutation.isPending || !input.trim()}
                  className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50 border border-primary-foreground/20"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </>
  );
}
