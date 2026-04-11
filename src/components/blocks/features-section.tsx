"use client";

import React from "react";
import { motion } from "motion/react";
import { 
  MdOutlineVerified as MdOutlineVerifiedRaw 
} from "react-icons/md";
import { 
  AiOutlineLink as AiOutlineLinkRaw 
} from "react-icons/ai";
import { 
  RiTeamLine as RiTeamLineRaw 
} from "react-icons/ri";
import { 
  BsBell as BsBellRaw 
} from "react-icons/bs";
import { 
  FiFileText as FiFileTextRaw, 
  FiTrendingUp as FiTrendingUpRaw 
} from "react-icons/fi";

const MdOutlineVerified = MdOutlineVerifiedRaw as any;
const AiOutlineLink = AiOutlineLinkRaw as any;
const RiTeamLine = RiTeamLineRaw as any;
const BsBell = BsBellRaw as any;
const FiFileText = FiFileTextRaw as any;
const FiTrendingUp = FiTrendingUpRaw as any;

const features = [
  {
    title: "AI Scam Detection",
    description: "Advanced NLP models analyze messages, links, and files to detect scams in real time.",
    icon: MdOutlineVerified,
  },
  {
    title: "Link Intelligence",
    description: "Instantly verify suspicious URLs with risk scoring and threat indicators.",
    icon: AiOutlineLink,
  },
  {
    title: "Crowd Verification",
    description: "Community-driven validation ensures faster detection of new scam patterns.",
    icon: RiTeamLine,
  },
  {
    title: "Smart Alerts",
    description: "Get notified when a suspicious message or link is detected.",
    icon: BsBell,
  },
  {
    title: "File Scanner",
    description: "Upload PDFs, images, or docs to detect hidden malicious intent.",
    icon: FiFileText,
  },
  {
    title: "Risk Score Engine",
    description: "Every input gets a trust score based on AI + behavioral analysis.",
    icon: FiTrendingUp,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-black py-24 px-6 border-t border-zinc-900 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
              Built for Real-World Trust
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              TrustLink combines state-of-the-art AI with the power of the crowd to 
              create a safe digital environment for everyone.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="group p-8 bg-black border border-zinc-800 rounded-2xl hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-default"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-zinc-500 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
