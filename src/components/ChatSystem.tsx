import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, User, Shield, MessageSquare, Bot } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, Timestamp 
} from "firebase/firestore";
import { GlassCard } from "./ui/GlassCard";
import { cn } from "../lib/utils";

interface Message {
  id: string;
  text: string;
  userId: string;
  senderEmail: string;
  senderRole: "user" | "admin" | "ai";
  timestamp: Timestamp;
}

interface ChatSystemProps {
  reportId: string;
  currentRole: "user" | "admin";
  contentContext?: string;
}

export function ChatSystem({ reportId, currentRole, contentContext }: ChatSystemProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reportId) return;

    const q = query(
      collection(db, "reports", reportId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as Message)));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsub();
  }, [reportId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, "reports", reportId, "messages"), {
        text: newMessage,
        userId: auth.currentUser.uid,
        senderEmail: auth.currentUser.email,
        senderRole: currentRole,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white/60">Verification Discussion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-white/30 font-bold uppercase">Secured Room</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20">
            <MessageSquare className="w-12 h-12 mb-3" />
            <p className="text-sm">Start a conversation regarding this report.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.userId === auth.currentUser?.uid ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                {msg.senderRole === "admin" ? (
                  <Shield className="w-3 h-3 text-red-400" />
                ) : msg.senderRole === "ai" ? (
                  <Bot className="w-3 h-3 text-blue-400" />
                ) : (
                  <User className="w-3 h-3 text-white/30" />
                )}
                <span className="text-[9px] font-black uppercase tracking-tighter text-white/40">
                  {msg.senderRole === "admin" ? "Official Moderator" : msg.senderEmail.split("@")[0]}
                </span>
              </div>
              <div
                className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.userId === auth.currentUser?.uid
                    ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20"
                    : msg.senderRole === "admin"
                    ? "bg-red-500/10 border border-red-500/20 text-red-50 rounded-tl-none"
                    : "bg-white/5 border border-white/5 text-white/80 rounded-tl-none"
                )}
              >
                {msg.text}
              </div>
              <div className="text-[8px] text-white/10 mt-1 uppercase font-bold px-1">
                {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
