import React from "react";
import { motion } from "framer-motion";
import {
  FaInfoCircle as FaInfoCircleRaw,
  FaCheckCircle as FaCheckCircleRaw,
  FaGraduationCap as FaGraduationCapRaw,
  FaExclamationTriangle as FaExclamationTriangleRaw,
  FaCheck as FaCheckRaw
} from "react-icons/fa";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { auth } from "../../lib/firebase";
import internshipIllustration from "../../assets/internship-illustration.jpg";

const FaInfoCircle = FaInfoCircleRaw as any;
const FaCheckCircle = FaCheckCircleRaw as any;
const FaGraduationCap = FaGraduationCapRaw as any;
const FaExclamationTriangle = FaExclamationTriangleRaw as any;
const FaCheck = FaCheckRaw as any;

export function InternshipTypesSection() {
  const navigate = useNavigate();

  const handleReportClick = () => {
    // Check if user is authenticated via Firebase
    const isAuthenticated = !!auth.currentUser;

    if (isAuthenticated) {
      // Redirect to the main dashboard where they can submit a report
      navigate("/app/home");
    } else {
      // Redirect to authentication page
      navigate("/auth");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="py-32 bg-black text-white px-6 w-full max-w-7xl mx-auto"
      id="internship-types"
    >
      <div className="flex flex-col items-center text-center mb-20">
        <div className="flex items-center gap-4 mb-6">
          <FaInfoCircle className="text-white w-6 h-6" />
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">
            Understand Internship Types
          </h2>
        </div>
        <p className="text-zinc-500 text-xl font-medium max-w-2xl tracking-tight">
          Not all internships are equal — learn before you apply.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
        {/* Card 1: Genuine */}
        <div className="bg-[#050505] border-l-[6px] border-green-500 p-10 hover:scale-[1.02] transition-transform duration-300 group shadow-2xl shadow-black">
          <FaCheckCircle className="text-green-500 w-10 h-10 mb-8" />
          <h3 className="text-2xl font-black mb-4 tracking-tighter">Genuine Internship</h3>
          <p className="text-zinc-400 leading-relaxed font-medium text-sm">
            Offered by real companies. Requires resume, test, or interview. No upfront payment.
          </p>
        </div>

        {/* Card 2: Training + Internship */}
        <div className="bg-[#050505] border-l-[6px] border-yellow-500 p-10 hover:scale-[1.02] transition-transform duration-300 group shadow-2xl shadow-black">
          <FaGraduationCap className="text-yellow-500 w-10 h-10 mb-8" />
          <h3 className="text-2xl font-black mb-4 tracking-tighter">Training + Internship (Paid Programs)</h3>
          <p className="text-zinc-400 leading-relaxed font-medium text-sm">
            Companies charge for training. Internship may not be guaranteed. Focus is on paid courses.
          </p>
        </div>

        {/* Card 3: Scam */}
        <div className="bg-[#050505] border-l-[6px] border-red-500 p-10 hover:scale-[1.02] transition-transform duration-300 group shadow-2xl shadow-black">
          <FaExclamationTriangle className="text-red-500 w-10 h-10 mb-8" />
          <h3 className="text-2xl font-black mb-4 tracking-tighter">Scam Internship</h3>
          <p className="text-zinc-400 leading-relaxed font-medium text-sm">
            Direct selection without resume. Requires payment. No real work or training provided.
          </p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-900 p-10 md:p-14 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        
        <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <h3 className="text-3xl md:text-4xl font-black mb-10 tracking-tighter leading-none">
              How to Identify a Genuine Internship
            </h3>
            
            <ul className="space-y-8">
              <li className="flex items-start gap-6 group/item">
                <div className="bg-white p-2 rounded-full text-black flex items-center justify-center shrink-0 mt-1 transition-transform group-hover/item:scale-110">
                  <FaCheck className="w-3 h-3" />
                </div>
                <div>
                  <span className="text-zinc-200 font-bold text-lg tracking-tight italic block">Rigorous Selection Process</span>
                  <p className="text-zinc-500 text-sm mt-1">Must include at least one selection step such as a technical test or video interview.</p>
                </div>
              </li>
              <li className="flex items-start gap-6 group/item">
                <div className="bg-white p-2 rounded-full text-black flex items-center justify-center shrink-0 mt-1 transition-transform group-hover/item:scale-110">
                  <FaCheck className="w-3 h-3" />
                </div>
                <div>
                  <span className="text-zinc-200 font-bold text-lg tracking-tight italic block">Official Digital Presence</span>
                  <p className="text-zinc-500 text-sm mt-1">Has a verified company website and official domain-based email addresses.</p>
                </div>
              </li>
              <li className="flex items-start gap-6 group/item">
                <div className="bg-white p-2 rounded-full text-black flex items-center justify-center shrink-0 mt-1 transition-transform group-hover/item:scale-110">
                  <FaCheck className="w-3 h-3" />
                </div>
                <div>
                  <span className="text-zinc-200 font-bold text-lg tracking-tight italic block">Zero Financial Commitment</span>
                  <p className="text-zinc-500 text-sm mt-1">No payment, security deposit, or training fee required from students at any stage.</p>
                </div>
              </li>
            </ul>

            <div className="mt-16 pt-10 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="text-zinc-500 text-xs font-bold tracking-widest uppercase italic opacity-70">
                Found something suspicious? Let us know.
              </div>
              <Button
                variant="outline"
                className="rounded-none border-zinc-800 text-zinc-400 hover:text-white hover:border-white transition-all text-xs font-black uppercase tracking-[0.3em] h-14 px-10 bg-transparent hover:bg-zinc-900 w-full sm:w-auto"
                onClick={handleReportClick}
              >
                Report Suspicious Internship
              </Button>
            </div>
          </div>

          <div className="hidden lg:block relative group">
            <div className="absolute inset-0 bg-white/5 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative border border-zinc-900 rounded-2xl overflow-hidden bg-black/40">
              <img 
                src={internshipIllustration} 
                alt="Internship Analysis Illustration" 
                className="w-full h-auto opacity-90 group-hover:opacity-100 transition-all duration-1000 ease-in-out scale-105 group-hover:scale-100"
              />
            </div>
            {/* Minimal Label */}
            <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Verified Learning Path</span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
