import React from "react";
import { HeroSection } from "./blocks/hero-section-4";
import { FeaturesSection } from "./blocks/features-section";
import { SecuritySection } from "./blocks/security-section";
import { CommunityStats } from "./blocks/community-stats";

export function LandingPage() {
  return (
    <div className="w-full bg-black min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <SecuritySection />
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
