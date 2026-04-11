import React, { useState, useEffect } from "react";
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
    if (!userId) return;

    try {
      if (optionIndex !== undefined) {
        // Poll vote
        const post = posts.find(p => p.id === postId);
        const newOptions = [...post.pollOptions];
        newOptions[optionIndex].votes += 1;
        await updateDoc(postRef, { 
          pollOptions: newOptions,
          [`votes.${userId}`]: optionIndex
        });
      } else {
        // Post upvote
        await updateDoc(postRef, {
          [`votes.${userId}`]: true
        });
      }
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Community Hub</h2>
          <p className="text-white/40">Discuss scams, share experiences, and stay protected together.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-5 h-5" />
          Create Post
        </button>
      </div>

      {isCreating && (
        <GlassCard gradient className="p-6">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setPostType("post")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  postType === "post" ? "bg-white text-black" : "bg-white/5 text-white/40"
                )}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Discussion
              </button>
              <button
                type="button"
                onClick={() => setPostType("poll")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  postType === "poll" ? "bg-white text-black" : "bg-white/5 text-white/40"
                )}
              >
                <BarChart2 className="w-4 h-4 inline mr-2" />
                Poll
              </button>
            </div>

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder={postType === "post" ? "What's on your mind?" : "Ask a question..."}
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
            />

            {postType === "poll" && (
              <div className="space-y-2">
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                >
                  + Add Option
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-6 py-2 text-white/40 hover:text-white font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all"
              >
                Post
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="space-y-6">
        {posts.map((post) => (
          <GlassCard key={post.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{post.username}</h4>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Clock className="w-3 h-3" />
                    {post.timestamp?.toDate().toLocaleString()}
                  </div>
                </div>
              </div>
              {post.type === "poll" && (
                <div className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold uppercase tracking-wider">
                  Poll
                </div>
              )}
            </div>

            <p className="text-white/80 mb-6 leading-relaxed">{post.content}</p>

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
                      className="w-full relative h-12 bg-white/5 border border-white/10 rounded-xl overflow-hidden group transition-all"
                    >
                      <div 
                        className="absolute inset-y-0 left-0 bg-blue-600/20 transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <span className="text-sm font-medium">{opt.text}</span>
                        <span className="text-xs font-bold text-white/40">{Math.round(percentage)}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
              <button 
                onClick={() => handleVote(post.id)}
                className={cn(
                  "flex items-center gap-2 text-sm font-bold transition-colors",
                  post.votes?.[auth.currentUser?.uid || ""] ? "text-blue-400" : "text-white/40 hover:text-white"
                )}
              >
                <ThumbsUp className="w-4 h-4" />
                {Object.keys(post.votes || {}).length}
              </button>
              <button 
                onClick={() => fetchComments(post.id)}
                className="flex items-center gap-2 text-sm text-white/40 hover:text-white font-bold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {post.commentsCount}
              </button>
              <button className="flex items-center gap-2 text-sm text-white/40 hover:text-white font-bold transition-colors ml-auto">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {activeComments === post.id && (
              <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                <div className="space-y-4">
                  {comments[post.id]?.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4 text-white/20" />
                      </div>
                      <div className="flex-1 bg-white/5 rounded-2xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{comment.username}</span>
                          <span className="text-[10px] text-white/20">{comment.timestamp?.toDate().toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm text-white/70">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
