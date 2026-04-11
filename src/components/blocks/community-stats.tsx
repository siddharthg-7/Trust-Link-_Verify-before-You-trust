"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  
  const spring = useSpring(0, {
    mass: 1,
    stiffness: 40,
    damping: 15,
  });

  const display = useTransform(spring, (current) => {
    const isDecimal = value % 1 !== 0;
    return (isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString()) + suffix;
  });

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, spring, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

const stats = [
  {
    value: 1200000,
    suffix: "+",
    label: "Messages Analyzed",
  },
  {
    value: 85000,
    suffix: "+",
    label: "Scams Detected",
  },
  {
    value: 50000,
    suffix: "+",
    label: "Community Reports",
  },
  {
    value: 99.2,
    suffix: "%",
    label: "Detection Accuracy",
  },
];

export function CommunityStats() {
  return (
    <section id="community" className="bg-black py-32 px-6 border-t border-zinc-900 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 uppercase italic">
              Powered by People
              <br />
              <span className="not-italic text-zinc-600">Strengthened by Data</span>
            </h2>
            <div className="h-[1px] w-48 bg-zinc-800 mx-auto" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-3 tabular-nums group-hover:scale-110 transition-transform duration-500">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
