"use client";

import React from "react";
import { motion } from "motion/react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { MdCheck as MdCheckRaw } from "react-icons/md";

const MdCheck = MdCheckRaw as any;

export function SecuritySection() {
  return (
    <section id="security" className="bg-black py-24 px-6 border-t border-zinc-900 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">

        {/* Left Content */}
        <div className="lg:w-2/5 order-last lg:order-first">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 font-mono">
              🔒 Security First Architecture
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-6 leading-tight">
              Trust Built on Deep Protection
            </h2>

            <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
              TrustLink combines AI, real-time scanning, and community intelligence
              to protect users from evolving digital threats. Our multi-layered
              approach ensures that no scam goes undetected.
            </p>

            <ul className="space-y-4">
              {[
                "End-to-end scanning pipeline",
                "NLP + pattern recognition engine",
                "Real-time threat detection",
                "Privacy-first architecture"
              ].map((point, i) => (
                <li key={i} className="flex items-center gap-3 text-white/80 font-medium">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <MdCheck className="w-3 h-3 text-white" />
                  </div>
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Right Animation */}
        <div className="lg:w-3/5 flex justify-center order-first lg:order-last relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-[800px]"
          >
            <div className="absolute inset-0 bg-white/5 blur-[100px] rounded-full scale-50" />
            <DotLottieReact
              src="https://lottie.host/7b072413-6007-4663-ba21-8cc459a9ae32/5gvtu93DdW.lottie"
              loop
              autoplay
              className="w-full h-auto relative z-10"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
