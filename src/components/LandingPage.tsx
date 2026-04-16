import React, { useState } from "react";
import { HeroSection } from "./blocks/hero-section-4";
import { FeaturesSection } from "./blocks/features-section";
import { SecuritySection } from "./blocks/security-section";
import { CommunityStats } from "./blocks/community-stats";
import { InternshipTypesSection } from "./blocks/InternshipTypesSection";
import { AnimatePresence } from "framer-motion";

export function LandingPage() {
  const [showInternshipTypes, setShowInternshipTypes] = useState(false);

  const handleLearnMore = () => {
    setShowInternshipTypes(true);
    // Smooth scroll to the section after it appears
    setTimeout(() => {
      document.getElementById('internship-types')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="w-full bg-black min-h-screen">
      <HeroSection onLearnMore={handleLearnMore} />
      
      <FeaturesSection />
      <SecuritySection />

      <AnimatePresence>
        {showInternshipTypes && (
          <InternshipTypesSection key="internship-types" />
        )}
      </AnimatePresence>

      <CommunityStats />
      
      {/* Global Footer */}
      <footer className="py-12 border-t border-zinc-900 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-700">
          © 2026 TrustLink Intelligence • Verified Security
        </p>
      </footer>
    </div>
  );
}
