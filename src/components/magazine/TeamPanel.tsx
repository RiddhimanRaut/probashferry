"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import KanthaDivider from "@/components/ui/KanthaDivider";
import Avatar from "@/components/ui/Avatar";

/* ------------------------------------------------------------------ */
/*  Team data                                                          */
/* ------------------------------------------------------------------ */

interface Member {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string | null;
}

const TEAM: Member[] = [
  {
    id: "ananya",
    name: "Ananya Roy",
    role: "Editor-in-Chief",
    bio: "Ananya brings stories of the Bengali diaspora to life with her sharp editorial eye. A journalist by training and storyteller by instinct, she founded Probashferry to bridge the distance between home and abroad.",
    image: null,
  },
  {
    id: "rahim",
    name: "Rahim Chowdhury",
    role: "Creative Director",
    bio: "Rahim shapes the visual language of every issue. With a background in graphic design and a love for Bengali folk art, he creates layouts that feel both modern and deeply rooted in tradition.",
    image: null,
  },
  {
    id: "priya",
    name: "Priya Sen",
    role: "Managing Editor",
    bio: "Priya keeps the wheels turning behind every publication. From coordinating contributors to fact-checking stories, her meticulous attention to detail ensures every issue meets the highest standards.",
    image: null,
  },
  {
    id: "kamal",
    name: "Kamal Hasan",
    role: "Tech Lead",
    bio: "Kamal builds the digital experience that brings Probashferry to readers worldwide. A full-stack engineer with a passion for accessible design, he believes technology should feel invisible.",
    image: null,
  },
  {
    id: "diya",
    name: "Diya Banerjee",
    role: "Community Manager",
    bio: "Diya nurtures the growing Probashferry community across continents. Through events, social media, and reader outreach, she ensures every voice in the diaspora feels heard and valued.",
    image: null,
  },
];

/* ------------------------------------------------------------------ */
/*  Mosaic layouts per team size                                       */
/* ------------------------------------------------------------------ */

type Span = { colStart: number; colEnd: number; rowStart: number; rowEnd: number };

const LAYOUTS: Record<number, Span[]> = {
  5: [
    { colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 3 },   // A — 2×2
    { colStart: 3, colEnd: 5, rowStart: 1, rowEnd: 2 },   // B — 2×1
    { colStart: 1, colEnd: 2, rowStart: 3, rowEnd: 5 },   // C — 1×2
    { colStart: 2, colEnd: 4, rowStart: 3, rowEnd: 5 },   // D — 2×2
    { colStart: 4, colEnd: 5, rowStart: 2, rowEnd: 4 },   // E — 1×2
  ],
  6: [
    { colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 3 },   // A — 2×2
    { colStart: 3, colEnd: 5, rowStart: 1, rowEnd: 2 },   // B — 2×1
    { colStart: 3, colEnd: 4, rowStart: 2, rowEnd: 3 },   // C — 1×1
    { colStart: 4, colEnd: 5, rowStart: 2, rowEnd: 4 },   // D — 1×2
    { colStart: 1, colEnd: 3, rowStart: 3, rowEnd: 4 },   // E — 2×1
    { colStart: 3, colEnd: 4, rowStart: 3, rowEnd: 4 },   // F — 1×1
  ],
  7: [
    { colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 3 },   // A — 2×2
    { colStart: 3, colEnd: 4, rowStart: 1, rowEnd: 2 },   // B — 1×1
    { colStart: 4, colEnd: 5, rowStart: 1, rowEnd: 3 },   // C — 1×2
    { colStart: 3, colEnd: 4, rowStart: 2, rowEnd: 3 },   // D — 1×1
    { colStart: 1, colEnd: 2, rowStart: 3, rowEnd: 4 },   // E — 1×1
    { colStart: 2, colEnd: 4, rowStart: 3, rowEnd: 4 },   // F — 2×1
    { colStart: 4, colEnd: 5, rowStart: 3, rowEnd: 4 },   // G — 1×1
  ],
  8: [
    { colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 3 },   // A — 2×2
    { colStart: 3, colEnd: 4, rowStart: 1, rowEnd: 2 },   // B — 1×1
    { colStart: 4, colEnd: 5, rowStart: 1, rowEnd: 3 },   // C — 1×2
    { colStart: 3, colEnd: 4, rowStart: 2, rowEnd: 3 },   // D — 1×1
    { colStart: 1, colEnd: 2, rowStart: 3, rowEnd: 4 },   // E — 1×1
    { colStart: 2, colEnd: 3, rowStart: 3, rowEnd: 4 },   // F — 1×1
    { colStart: 3, colEnd: 5, rowStart: 3, rowEnd: 4 },   // G — 2×1
    { colStart: 1, colEnd: 3, rowStart: 4, rowEnd: 5 },   // H — 2×1
  ],
};

/* ------------------------------------------------------------------ */
/*  Color cycle                                                        */
/* ------------------------------------------------------------------ */

const ACCENT_COLORS = [
  { bg: "bg-charcoal", text: "text-white" },
  { bg: "bg-terracotta", text: "text-white" },
  { bg: "bg-mustard", text: "text-charcoal" },
  { bg: "bg-sage", text: "text-white" },
  { bg: "bg-sindoor", text: "text-white" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TeamPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const layout = LAYOUTS[TEAM.length] ?? LAYOUTS[5];
  const selectedMember = TEAM.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="min-h-screen flex flex-col px-4 py-8" data-testid="team-panel">
      {/* Heading */}
      <div className="text-center mb-6">
        <h2 className="heading-display text-3xl text-charcoal">Meet The Team</h2>
        <p className="font-bengali text-charcoal/30 text-sm mt-1">আমাদের দল</p>
        <KanthaDivider className="max-w-[200px] mx-auto" />
      </div>

      {/* Mosaic grid */}
      <div
        className="grid grid-cols-4 gap-1.5 flex-1"
        style={{ gridAutoRows: "minmax(0, 1fr)" }}
        data-testid="team-mosaic"
      >
        {TEAM.map((member, i) => {
          const span = layout[i];
          const color = ACCENT_COLORS[i % ACCENT_COLORS.length];
          const isSelected = member.id === selectedId;
          return (
            <button
              key={member.id}
              onClick={() => setSelectedId(member.id)}
              className={`${color.bg} ${color.text} rounded-xl relative overflow-hidden cursor-pointer transition-opacity ${isSelected ? "opacity-0" : "opacity-100"}`}
              style={{
                gridColumn: `${span.colStart} / ${span.colEnd}`,
                gridRow: `${span.rowStart} / ${span.rowEnd}`,
              }}
              data-testid={`team-tile-${member.id}`}
            >
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 pointer-events-none" />
              <div className="relative z-10 flex flex-col items-start justify-end h-full p-3">
                <span className="font-heading text-lg leading-tight">{member.name}</span>
                <span className="text-[10px] uppercase tracking-widest opacity-70 mt-0.5">
                  {member.role}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded card overlay */}
      <AnimatePresence>
        {selectedMember && (
          <>
            {/* Backdrop */}
            <motion.div
              key="team-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-charcoal/60 backdrop-blur-sm"
              onClick={() => setSelectedId(null)}
              data-testid="team-backdrop"
            />

            {/* Card */}
            <motion.div
              key="team-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
            >
              <div
                className="bg-paper rounded-2xl w-[85vw] max-w-sm p-6 pointer-events-auto shadow-xl"
                data-testid="team-card"
              >
                <div className="flex flex-col items-center text-center">
                  <Avatar name={selectedMember.name} src={selectedMember.image} size={80} />
                  <h3 className="heading-display text-xl text-charcoal mt-4">
                    {selectedMember.name}
                  </h3>
                  <p className="text-xs uppercase tracking-widest text-charcoal/50 mt-1">
                    {selectedMember.role}
                  </p>
                  <KanthaDivider className="max-w-[120px]" />
                  <p className="text-sm text-charcoal/70 leading-relaxed">
                    {selectedMember.bio}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
