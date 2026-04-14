import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageCircle, 
  ThumbsUp, 
  Share2, 
  Plus, 
  BarChart2, 
  Send,
  User as UserIcon,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { ChatSystem } from "./ChatSystem";
import { MdClose as MdCloseRaw } from "react-icons/md";
const MdClose = MdCloseRaw as any;
import { db, auth } from "../lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  doc,
  increment
} from "firebase/firestore";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

export function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [postType, setPostType] = useState<"post" | "poll">("post");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const [activeComments, setActiveComments] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});
  const [newComment, setNewComment] = useState("");

  const [selectedChatPost, setSelectedChatPost] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, "community"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const fetchComments = (postId: string) => {
    if (activeComments === postId) {
      setActiveComments(null);
      return;
    }
    setActiveComments(postId);
    const q = query(collection(db, "community", postId, "comments"), orderBy("timestamp", "asc"));
    onSnapshot(q, (snapshot) => {
      setComments(prev => ({
        ...prev,
        [postId]: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }));
    });
  };

  const handleAddComment = async (postId: string) => {
    if (!newComment.trim()) return;
    try {
      await addDoc(collection(db, "community", postId, "comments"), {
        userId: auth.currentUser?.uid,
        username: auth.currentUser?.displayName || "Anonymous",
        content: newComment,
        timestamp: serverTimestamp()
      });
      await updateDoc(doc(db, "community", postId), {
        commentsCount: increment(1)
      });
      setNewComment("");
      toast.success("Comment added");
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      const postData: any = {
        userId: auth.currentUser?.uid,
        username: auth.currentUser?.displayName || "Anonymous",
        content: newPostContent,
        type: postType,
        timestamp: serverTimestamp(),
        votes: {},
        commentsCount: 0
      };

      if (postType === "poll") {
        postData.pollOptions = pollOptions.filter(opt => opt.trim() !== "").map(opt => ({
          text: opt,
          votes: 0
        }));
      }

      await addDoc(collection(db, "community"), postData);
      setNewPostContent("");
      setPollOptions(["", ""]);
      setIsCreating(false);
      toast.success("Post shared with community!");
    } catch (error) {
      toast.error("Failed to share post");
    }
  };

  const handleVote = async (postId: string, optionIndex?: number) => {
    const postRef = doc(db, "community", postId);
    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast.error("Please login to vote");
      return;
    }

    try {
      if (optionIndex !== undefined) {
        // Poll vote
        const post = posts.find(p => p.id === postId);
        const currentVote = post.votes?.[userId];

        if (currentVote !== undefined) {
          toast.error("You have already voted in this poll");
          return;
        }

        const newOptions = [...post.pollOptions];
        newOptions[optionIndex].votes += 1;
        await updateDoc(postRef, { 
          pollOptions: newOptions,
          [`votes.${userId}`]: optionIndex
        });
      } else {
        // Post upvote (Toggle logic)
        const post = posts.find(p => p.id === postId);
        const hasVoted = post.votes?.[userId] === true;
        
        await updateDoc(postRef, {
          [`votes.${userId}`]: hasVoted ? null : true
        });
        toast.success(hasVoted ? "Upvote removed" : "Post upvoted");
      }
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Glow */}
      <div className="absolute inset-0 flex justify-center overflow-hidden pointer-events-none">
        <div className="w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full mt-[-100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-12 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center px-3 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Peer Support
            </div>
            <h1 className="text-5xl font-semibold tracking-tighter text-white leading-[1.05]">Community Intelligence</h1>
            <p className="text-zinc-500 text-lg leading-relaxed max-w-xl">
              Discuss emerging threats, share security insights, and stay protected through collective awareness.
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl font-semibold text-sm hover:bg-zinc-200 transition-all hover:scale-[1.02] shadow-xl shrink-0"
          >
            <Plus className="w-4 h-4" />
            Share Intelligence
          </button>
        </div>

        {/* Create Post Drawer */}
        <AnimatePresence>
          {isCreating && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 mb-8 shadow-2xl">
                <form onSubmit={handleCreatePost} className="space-y-6">
                  <div className="flex bg-black border border-zinc-800 rounded-xl p-1 w-fit">
                    <button
                      type="button"
                      onClick={() => setPostType("post")}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        postType === "post" ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      Discussion
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostType("poll")}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        postType === "poll" ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      Poll
                    </button>
                  </div>

                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder={postType === "post" ? "Share your security insights..." : "Ask the community..."}
                    className="w-full h-32 bg-black border border-zinc-800 rounded-xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/5 transition-all resize-none font-normal"
                  />

                  {postType === "poll" && (
                    <div className="space-y-3">
                      {pollOptions.map((opt, i) => (
                        <input
                          key={i}
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...pollOptions];
                            newOpts[i] = e.target.value;
                            setPollOptions(newOpts);
                          }}
                          placeholder={`Option ${i + 1}`}
                          className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/5 transition-all"
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setPollOptions([...pollOptions, ""])}
                        className="text-[10px] text-zinc-500 hover:text-white font-bold uppercase tracking-widest px-1 py-1 transition-colors"
                      >
                        + Add Voting Option
                      </button>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-5 py-2 text-zinc-500 hover:text-white font-medium text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-white text-black rounded-lg font-semibold text-xs hover:bg-zinc-200 transition-all"
                    >
                      Post Entry
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed Grid */}
        <div className="grid grid-cols-1 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-lg shadow-black/20 hover:border-zinc-700 transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 text-zinc-400 rounded-xl flex items-center justify-center font-bold text-sm border border-zinc-700/50">
                    {post.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white tracking-tight">{post.username}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 uppercase tracking-widest opacity-60">
                      <Clock className="w-3 h-3" />
                      {post.timestamp?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {post.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                {post.type === "poll" && (
                  <div className="px-3 py-1 bg-black/50 text-zinc-400 border border-zinc-800 rounded-md text-[9px] font-bold uppercase tracking-widest">
                    Poll Entry
                  </div>
                )}
              </div>

              <p className="text-zinc-300 text-lg mb-6 leading-relaxed font-normal whitespace-pre-wrap">{post.content}</p>

              {post.type === "poll" && (
                <div className="space-y-3 mb-6">
                  {post.pollOptions.map((opt: any, i: number) => {
                    const totalVotes = post.pollOptions.reduce((acc: number, curr: any) => acc + curr.votes, 0);
                    const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                    const hasVoted = post.votes?.[auth.currentUser?.uid || ""] !== undefined;

                    return (
                      <button
                        key={i}
                        disabled={hasVoted}
                        onClick={() => handleVote(post.id, i)}
                        className="w-full relative h-12 bg-black border border-zinc-800 rounded-xl overflow-hidden group transition-all hover:border-zinc-700"
                      >
                        <div 
                          className="absolute inset-y-0 left-0 bg-white/5 transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-between px-5">
                          <span className="text-xs font-semibold text-zinc-400">{opt.text}</span>
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{Math.round(percentage)}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-4 pt-6 border-t border-zinc-800/50">
                <button 
                  onClick={() => handleVote(post.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all border text-xs font-semibold",
                    post.votes?.[auth.currentUser?.uid || ""] === true 
                      ? "bg-white text-black border-white shadow-lg shadow-white/5" 
                      : "text-zinc-500 border-zinc-800 hover:text-white bg-black/40"
                  )}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{Object.values(post.votes || {}).filter(v => v === true).length}</span>
                </button>

                <button 
                  onClick={() => setSelectedChatPost(post)}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-zinc-500 hover:text-white bg-black/40 border border-zinc-800 transition-all text-xs font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Connect</span>
                </button>
                
                <button 
                  onClick={() => fetchComments(post.id)}
                  className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors ml-auto group"
                >
                  <BarChart2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  {post.commentsCount || 0} Responses
                </button>
              </div>

              <AnimatePresence>
                {activeComments === post.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-6 pt-6 border-t border-zinc-800 space-y-6 overflow-hidden">
                    <div className="space-y-4">
                      {comments[post.id]?.map((comment) => (
                        <div key={comment.id} className="flex gap-3 items-start">
                          <div className="w-8 h-8 bg-zinc-800 border border-zinc-700/50 rounded-lg flex items-center justify-center shrink-0 font-bold text-zinc-500 text-xs shadow-inner">
                            {comment.username[0].toUpperCase()}
                          </div>
                          <div className="flex-1 bg-black/40 border border-zinc-800 rounded-xl p-3.5">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-white tracking-tight">{comment.username}</span>
                              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{comment.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type a response..."
                        className="flex-1 bg-black/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/10 transition-all placeholder:text-zinc-700"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="p-2.5 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all shadow-md active:scale-95"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Chat System Modal */}
        <AnimatePresence>
          {selectedChatPost && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="w-full max-w-xl relative"
              >
                <button 
                  onClick={() => setSelectedChatPost(null)}
                  className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-white transition-all transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
                <div className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl h-[600px]">
                  <ChatSystem 
                    reportId={`comm-${selectedChatPost.id}`} 
                    currentRole="user" 
                    contentContext={selectedChatPost.content} 
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

