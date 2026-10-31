"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Heart, ShieldCheck, Sparkles, ArrowRight, X, MessageCircle, MapPin } from "lucide-react";

interface SplashScreenProps {
  isVisible: boolean;
  onFinish?: () => void;
  autoDismissMs?: number;
}

export function SplashScreen({
  isVisible,
  onFinish,
  autoDismissMs = 3200,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [statusText, setStatusText] = useState("চা আড্ডা প্ল্যাটফর্ম লোড হচ্ছে...");

  const features = [
    {
      icon: <Coffee className="h-5 w-5 text-amber-400" />,
      title: "চা আড্ডা স্পট",
      titleEn: "Tea & Coffee Dates",
      desc: "ভার্চুয়াল চ্যাট নয়, প্রিয় চা-কফি স্পটে সরাসরি বাস্তব দেখা করার সুযোগ।",
    },
    {
      icon: <Heart className="h-5 w-5 text-rose-400 fill-rose-400/20" />,
      title: "স্মার্ট সোয়াইপ ও ম্যাচ",
      titleEn: "Swipe & Connect",
      desc: "পছন্দের মানুষের প্রোফাইল সোয়াইপ করুন, ভাইব মিললেই সাথে সাথে কানেক্ট।",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
      title: "১৮+ ব্লু-টিক ভেরিফাইড",
      titleEn: "100% Safe & Verified",
      desc: "রিয়েল-টাইম লাইভ সেলফি ভেরিফিকেশনে ১০০% ফেক-মুক্ত ও নিরাপদ প্ল্যাটফর্ম।",
    },
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setActiveStep(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 12) + 8;
        if (next > 35 && prev <= 35) {
          setActiveStep(1);
          setStatusText("কাছের মানুষদের ম্যাচমেকিং ফিল্টার প্রস্তুত...");
        } else if (next > 70 && prev <= 70) {
          setActiveStep(2);
          setStatusText("নিরাপদ ১৮+ ভেরিফাইড এনভায়রনমেন্ট সক্রিয়...");
        } else if (next >= 92) {
          setStatusText("রেডি টু কানেক্ট! স্বাগতম চা আড্ডায়...");
        }
        return next > 100 ? 100 : next;
      });
    }, 170);

    const timeout = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, autoDismissMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isVisible, autoDismissMs, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#0B0816] text-white overflow-hidden select-none p-5 sm:p-8"
        >
          {/* Ambient Glowing Orbs Background */}
          <div className="absolute top-1/4 -left-32 h-80 w-80 rounded-full bg-rose-600/25 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 -right-32 h-80 w-80 rounded-full bg-amber-500/20 blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-purple-900/15 blur-[140px] pointer-events-none" />

          {/* Top Bar with Badge & Skip Action */}
          <div className="w-full max-w-md flex items-center justify-between relative z-10 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-rose-400 animate-spin" style={{ animationDuration: "4s" }} />
              <span>চা আড্ডা • Modern 18+ Dating</span>
            </div>

            <button
              onClick={onFinish}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-all group cursor-pointer"
            >
              <span>Skip (স্কিপ)</span>
              <X className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform" />
            </button>
          </div>

          {/* Central Branding Section */}
          <div className="flex flex-col items-center justify-center text-center relative z-10 my-auto max-w-md w-full space-y-6">
            {/* Logo Container with Pulsing Ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 220 }}
              className="relative flex items-center justify-center"
            >
              <div className="absolute h-28 w-28 rounded-3xl bg-rose-500/20 animate-ping opacity-30 pointer-events-none" />
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 opacity-40 blur-xl animate-pulse" />

              <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-b from-[#1E1735] to-[#120D24] border border-white/15 p-4 shadow-2xl flex items-center justify-center group">
                <Image
                  src="/logo-icon.png"
                  alt="CHA ADDA Logo"
                  width={72}
                  height={72}
                  className="object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  priority
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="hidden group-has-[[style*='display: none']]:flex flex-col items-center justify-center text-rose-400">
                  <Coffee className="h-10 w-10 text-rose-400" />
                </div>
              </div>
            </motion.div>

            {/* Title & Tagline */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-1.5"
            >
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                চা <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">আড্ডা</span> (CHA ADDA)
              </h1>
              <p className="text-xs sm:text-sm text-rose-200/90 font-semibold tracking-wide">
                চা আর আড্ডায় তৈরি হোক সম্পর্কের গল্প
              </p>
              <p className="text-[11px] text-white/50">
                Meet. Swap. Connect. Where conversations brew real relationships.
              </p>
            </motion.div>

            {/* Explanatory Feature Cards (So user easily understands) */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full pt-1 text-left"
            >
              {features.map((feat, idx) => (
                <div
                  key={feat.title}
                  className={`p-3 rounded-2xl border transition-all duration-300 ${
                    activeStep === idx
                      ? "bg-rose-500/15 border-rose-500/40 shadow-lg shadow-rose-950/40 scale-[1.02]"
                      : "bg-white/[0.04] border-white/10 opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                      {feat.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{feat.title}</h4>
                      <p className="text-[9px] text-rose-300/80">{feat.titleEn}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/70 leading-relaxed mt-1">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom Progress & Action Footer */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full max-w-md relative z-10 space-y-3.5 pb-2"
          >
            {/* Status indicator */}
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="font-sans text-[11px] text-rose-300 animate-pulse font-medium">
                {statusText}
              </span>
              <span className="font-bold text-white font-mono">{progress}%</span>
            </div>

            {/* Glowing Progress Bar */}
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden relative p-0.5 border border-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 shadow-[0_0_14px_rgba(244,63,94,0.7)]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.2 }}
              />
            </div>

            {/* Quick Action Button */}
            <button
              onClick={onFinish}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-rose-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer group active:scale-[0.98]"
            >
              <span>বুঝেছি, শুরু করুন (Get Started)</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
