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
    <div className="max-w-4xl mx-auto space-y-12 pb-20 px-6">
      <div className="flex items-end justify-between pt-12">
        <div>
          <h2 className="text-5xl font-bold tracking-tighter text-white mb-4">Community</h2>
          <p className="text-zinc-500 text-lg font-medium max-w-md leading-relaxed">Discuss scams, share experiences, and stay protected together.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-8 py-3.5 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Post
        </button>
      </div>

      {isCreating && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-[32px] p-8">
          <form onSubmit={handleCreatePost} className="space-y-6">
            <div className="flex bg-black border border-zinc-900 rounded-full p-1 w-fit mb-4">
              <button
                type="button"
                onClick={() => setPostType("post")}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                  postType === "post" ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                )}
              >
                <MessageCircle className="w-3.5 h-3.5 inline mr-2" />
                Discussion
              </button>
              <button
                type="button"
                onClick={() => setPostType("poll")}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                  postType === "poll" ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                )}
              >
                <BarChart2 className="w-3.5 h-3.5 inline mr-2" />
                Poll
              </button>
            </div>

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={postType === "post" ? "Share your security insights..." : "Ask the community..."}
              className="w-full h-40 bg-black border border-zinc-900 rounded-2xl p-6 text-white placeholder-zinc-800 focus:border-zinc-700 outline-none transition-all resize-none font-medium"
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
                    className="w-full bg-black border border-zinc-900 rounded-xl p-3.5 text-sm text-white focus:border-zinc-700 outline-none transition-all"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-xs text-cyan-500 hover:text-cyan-400 font-bold px-2 py-1"
                >
                  + Add Option
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-8 py-2 text-zinc-500 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-10 py-3 bg-white text-black rounded-full font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all"
              >
                Post Now
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-8">
        {posts.map((post) => (
          <div key={post.id} className="bg-zinc-950 border border-zinc-900 rounded-[32px] p-8 hover:border-zinc-800 transition-all">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center font-bold text-lg">
                  {post.username[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg tracking-tight">{post.username}</h4>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    <Clock className="w-3.5 h-3.5" />
                    {post.timestamp?.toDate().toLocaleString()}
                  </div>
                </div>
              </div>
              {post.type === "poll" && (
                <div className="px-4 py-1.5 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Poll
                </div>
              )}
            </div>

            <p className="text-zinc-400 text-lg mb-8 leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>

            {post.type === "poll" && (
              <div className="space-y-3 mb-8">
                {post.pollOptions.map((opt: any, i: number) => {
                  const totalVotes = post.pollOptions.reduce((acc: number, curr: any) => acc + curr.votes, 0);
                  const percentage = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                  const hasVoted = post.votes?.[auth.currentUser?.uid || ""] !== undefined;

                  return (
                    <button
                      key={i}
                      disabled={hasVoted}
                      onClick={() => handleVote(post.id, i)}
                      className="w-full relative h-14 bg-black border border-zinc-900 rounded-2xl overflow-hidden group transition-all hover:border-zinc-700"
                    >
                      <div 
                        className="absolute inset-y-0 left-0 bg-cyan-500/10 transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-6">
                        <span className="text-sm font-bold text-zinc-300">{opt.text}</span>
                        <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">{Math.round(percentage)}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-6 pt-8 border-t border-zinc-900 text-left">
              <button 
                onClick={() => handleVote(post.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-full transition-all border",
                  post.votes?.[auth.currentUser?.uid || ""] === true 
                    ? "bg-cyan-500 border-cyan-500 text-black shadow-lg shadow-cyan-500/20" 
                    : "text-zinc-600 border-zinc-900 hover:text-white bg-black"
                )}
              >
                <ThumbsUp className="w-4.5 h-4.5" />
                <span className="text-xs font-bold leading-none">{Object.values(post.votes || {}).filter(v => v === true).length}</span>
              </button>

              <button 
                onClick={() => setSelectedChatPost(post)}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-zinc-600 hover:text-white bg-black border border-zinc-900 transition-all text-xs font-bold uppercase tracking-widest"
              >
                <MessageCircle className="w-4.5 h-4.5" />
                <span>Discuss</span>
              </button>
              
              <button 
                onClick={() => fetchComments(post.id)}
                className="flex items-center gap-2 text-[10px] font-bold text-zinc-700 hover:text-white uppercase tracking-widest transition-colors ml-auto"
              >
                <BarChart2 className="w-4 h-4" />
                {post.commentsCount || 0} Comments
              </button>
            </div>

            {activeComments === post.id && (
              <div className="mt-8 pt-8 border-t border-zinc-900 space-y-6">
                <div className="space-y-4">
                  {comments[post.id]?.map((comment) => (
                    <div key={comment.id} className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shrink-0 font-bold text-zinc-600">
                        {comment.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1 bg-black border border-zinc-900 rounded-[20px] p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-white">{comment.username}</span>
                          <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">{comment.timestamp?.toDate().toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-zinc-500 font-medium leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-black border border-zinc-900 rounded-full px-6 py-3 text-sm text-white focus:border-cyan-500 outline-none transition-all placeholder-zinc-800"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    className="p-3 bg-white text-black rounded-full hover:bg-zinc-200 transition-all shadow-lg active:scale-90"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedChatPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg relative"
            >
              <button 
                onClick={() => setSelectedChatPost(null)}
                className="absolute -top-14 right-0 p-3 text-zinc-500 hover:text-white transition-all bg-zinc-900 rounded-full"
              >
                <MdClose className="w-5 h-5" />
              </button>
              <div className="bg-zinc-950 border border-zinc-900 rounded-[32px] overflow-hidden shadow-2xl">
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
  );
}

