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
  fullName: string;
  role: string;
  bio: string;
  image: string | null;
}

const TEAM: Member[] = [
  {
    id: "riddhiman",
    name: "Riddhiman",
    fullName: "Riddhiman Raut",
    role: "Editor-in-Chief",
    bio: "Riddhiman brings stories of the Bengali diaspora to life with his sharp editorial eye. A journalist by training and storyteller by instinct, he founded Probashferry to bridge the distance between home and abroad.",
    image: null,
  },
  {
    id: "abhipsha",
    name: "Abhipsha",
    fullName: "Abhipsha Pandit",
    role: "Creative Director",
    bio: "Abhipsha shapes the visual language of every issue. With a background in graphic design and a love for Bengali folk art, she creates layouts that feel both modern and deeply rooted in tradition.",
    image: null,
  },
  {
    id: "ritoja",
    name: "Ritoja",
    fullName: "Ritoja Ray",
    role: "Managing Editor",
    bio: "Ritoja keeps the wheels turning behind every publication. From coordinating contributors to fact-checking stories, her meticulous attention to detail ensures every issue meets the highest standards.",
    image: null,
  },
  {
    id: "srijan",
    name: "Srijan",
    fullName: "Srijan Bhattacharya",
    role: "Tech Lead",
    bio: "Srijan builds the digital experience that brings Probashferry to readers worldwide. A full-stack engineer with a passion for accessible design, he believes technology should feel invisible.",
    image: null,
  },
  {
    id: "pratyusha",
    name: "Pratyusha",
    fullName: "Pratyusha Chakraborty",
    role: "Community Manager",
    bio: "Pratyusha nurtures the growing Probashferry community across continents. Through events, social media, and reader outreach, she ensures every voice in the diaspora feels heard and valued.",
    image: null,
  },
];

/* ------------------------------------------------------------------ */
/*  Color cycle (accent for polaroid photo areas)                      */
/* ------------------------------------------------------------------ */

const ACCENT_COLORS = [
  { bg: "bg-charcoal", text: "text-white" },
  { bg: "bg-terracotta", text: "text-white" },
  { bg: "bg-mustard", text: "text-charcoal" },
  { bg: "bg-sage", text: "text-white" },
  { bg: "bg-sindoor", text: "text-white" },
];

/* ------------------------------------------------------------------ */
/*  Layout: positions along the catenary string                        */
/* ------------------------------------------------------------------ */

const POSITIONS = [12, 32, 52, 72, 92];

/**
 * SVG Bézier curve: M 0,30 Q 50,80 100,30
 * viewBox 0 0 100 90 at h-[90px] → y maps 1:1 to px.
 */
function stringY(pct: number): number {
  const t = Math.max(0, Math.min(1, pct / 100));
  return 30 * (1 - t) * (1 - t) + 80 * 2 * t * (1 - t) + 30 * t * t;
}

const ROTATIONS = [-6, 4, -3, 7, -5];
const SWAY_DURATIONS = [3.2, 3.8, 4.4, 3.6, 4.0];

/* ------------------------------------------------------------------ */
/*  String lights SVG                                                  */
/* ------------------------------------------------------------------ */

function StringLights() {
  const d = "M 0,30 Q 50,80 100,30";
  const bulbs = [6, 16, 26, 36, 46, 56, 66, 76, 86, 96];

  return (
    <svg
      viewBox="0 0 100 90"
      preserveAspectRatio="none"
      className="absolute top-0 left-0 w-full h-[90px] pointer-events-none"
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="0.3"
        strokeLinecap="round"
      />
      {bulbs.map((x) => {
        const t = x / 100;
        const y = 30 * (1 - t) * (1 - t) + 80 * 2 * t * (1 - t) + 30 * t * t;
        return (
          <circle key={x} cx={x} cy={y} r="1" fill="#D4A843" opacity="0.9">
            <animate
              attributeName="opacity"
              values="0.9;0.5;0.9"
              dur={`${2 + (x % 3)}s`}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Polaroid front face (reused in scatter and popup)                  */
/* ------------------------------------------------------------------ */

function PolaroidFront({
  member,
  index,
  className,
  testId,
  showFullName,
}: {
  member: Member;
  index: number;
  className?: string;
  testId?: string;
  showFullName?: boolean;
}) {
  const color = ACCENT_COLORS[index % ACCENT_COLORS.length];
  return (
    <div
      className={`bg-white rounded-sm shadow-lg p-1.5 pb-2 ${className ?? ""}`}
      data-testid={testId}
    >
      <div
        className={`${color.bg} ${color.text} aspect-[4/5] rounded-[2px] flex items-center justify-center`}
      >
        <Avatar name={member.fullName} src={member.image} size={56} />
      </div>
      <div className="text-center mt-1.5">
        <p className="font-handwriting text-lg leading-tight text-charcoal">
          {showFullName ? member.fullName : member.name}
        </p>
        <p className="text-[8px] uppercase tracking-widest text-charcoal/50 font-body">
          {member.role}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scatter polaroid (on the string)                                   */
/* ------------------------------------------------------------------ */

interface ScatterPolaroidProps {
  member: Member;
  index: number;
  selected: boolean;
  onTap: () => void;
}

function ScatterPolaroid({ member, index, selected, onTap }: ScatterPolaroidProps) {
  const left = POSITIONS[index];
  const top = stringY(Math.max(0, left)) - 8;
  const baseRotate = ROTATIONS[index];
  const swayDuration = SWAY_DURATIONS[index];

  return (
    <div
      className="absolute -translate-x-1/2"
      style={{
        left: `${left}%`,
        top: `${top}px`,
        zIndex: 10,
        perspective: "800px",
      }}
    >
      <div
        className="animate-sway"
        style={{
          ["--base-rotate" as string]: `${baseRotate}deg`,
          ["--sway-duration" as string]: `${swayDuration}s`,
          animationDelay: `${index * 0.4}s`,
          transform: `rotate(${baseRotate}deg)`,
          opacity: selected ? 0.3 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {/* Clip */}
        <div className="w-3 h-4 bg-charcoal/80 rounded-[1px] mx-auto -mb-1 relative z-10" />

        <motion.div
          className="w-[min(36vw,144px)] cursor-pointer"
          whileTap={{ scale: 0.95 }}
          onTap={onTap}
        >
          <PolaroidFront
            member={member}
            index={index}
            testId={`team-tile-${member.id}`}
          />
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Popup polaroid (centered, flippable)                               */
/* ------------------------------------------------------------------ */

interface PopupPolaroidProps {
  member: Member;
  index: number;
  flipped: boolean;
  onTap: () => void;
  onClose: () => void;
}

function PopupPolaroid({ member, index, flipped, onTap, onClose }: PopupPolaroidProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="team-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[60] bg-charcoal/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centered polaroid */}
      <motion.div
        key="team-popup"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
        style={{ perspective: "800px" }}
      >
        <motion.div
          className="w-56 cursor-pointer pointer-events-auto"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          onTap={onTap}
        >
          {/* Front face */}
          <div style={{ backfaceVisibility: "hidden" }}>
            <PolaroidFront member={member} index={index} showFullName />
          </div>

          {/* Back face (bio) */}
          <div
            className="bg-paper rounded-sm shadow-lg p-5 absolute inset-0 flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            data-testid="team-card"
          >
            <h3 className="font-handwriting text-xl text-charcoal leading-tight">
              {member.fullName}
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-charcoal/50 font-body mt-1">
              {member.role}
            </p>
            <KanthaDivider className="max-w-[100px]" />
            <p className="text-xs text-charcoal/70 leading-relaxed font-body">
              {member.bio}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function TeamPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flipped, setFlipped] = useState(false);

  const selectedIndex = TEAM.findIndex((m) => m.id === selectedId);
  const selectedMember = selectedIndex >= 0 ? TEAM[selectedIndex] : null;

  function handleSelect(id: string) {
    setSelectedId(id);
    setFlipped(false);
  }

  function handlePopupTap() {
    setFlipped((f) => !f);
  }

  function handleClose() {
    setSelectedId(null);
    setFlipped(false);
  }

  return (
    <div className="py-8" data-testid="team-panel">
      {/* Heading */}
      <div className="text-center mb-6">
        <h2 className="heading-display text-3xl text-charcoal">Meet The Team</h2>
        <p className="font-bengali text-charcoal/30 text-sm mt-1">আমাদের দল</p>
        <KanthaDivider className="max-w-[200px] mx-auto" />
      </div>

      {/* String lights + polaroids scatter area */}
      <div className="relative min-h-[340px] overflow-hidden">
        <StringLights />

        {TEAM.map((member, i) => (
          <ScatterPolaroid
            key={member.id}
            member={member}
            index={i}
            selected={member.id === selectedId}
            onTap={() => handleSelect(member.id)}
          />
        ))}
      </div>

      {/* Get in Touch footer */}
      <footer className="text-center px-6 pt-8 pb-10">
        <KanthaDivider className="max-w-[200px] mx-auto" />
        <h3 className="heading-display text-2xl text-charcoal mt-2">
          Get in Touch
        </h3>
        <p className="font-body text-sm text-charcoal/60 leading-relaxed max-w-xs mx-auto mt-3">
          Want to submit an article, ask a question, or share feedback?
          We&apos;d love to hear from you.
        </p>
        <a
          href="mailto:hello@probashferry.com"
          className="inline-block font-handwriting text-lg text-terracotta hover:text-sindoor transition-colors mt-3"
        >
          hello@probashferry.com
        </a>
        <p className="font-body text-[10px] text-charcoal/30 mt-4">
          &copy; 2026 Probashferry. All rights reserved.
        </p>
      </footer>

      {/* Popup overlay */}
      <AnimatePresence>
        {selectedMember && (
          <PopupPolaroid
            member={selectedMember}
            index={selectedIndex}
            flipped={flipped}
            onTap={handlePopupTap}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
