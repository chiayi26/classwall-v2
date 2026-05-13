"use client";

import { motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";

import { addLiked, hasLiked } from "@/lib/liked-store";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/database";

type Props = {
  question: Question;
};

// 隨機粒子噴發角度（按讚瞬間）
const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
  const distance = 28 + Math.random() * 18;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    delay: Math.random() * 0.05,
  };
});

export function QuestionCard({ question }: Props) {
  const [pending, setPending] = useState(false);
  const [alreadyLiked, setAlreadyLiked] = useState(false);
  const [burstKey, setBurstKey] = useState(0); // 每次按讚換新 key，重啟粒子動畫
  const isHot = question.likes >= 5;

  // 3D tilt：依滑鼠相對位置算 rotateX/Y
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-4, 4]);

  // hydration 後才讀 sessionStorage，避免 SSR mismatch
  // （effect 內 setState 是 client-only state 同步的標準作法）
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlreadyLiked(hasLiked(question.id));
  }, [question.id]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  async function handleLike() {
    if (pending || alreadyLiked) return;
    setPending(true);
    const { error } = await supabase
      .from("questions")
      .update({ likes: question.likes + 1 })
      .eq("id", question.id);
    setPending(false);
    if (error) {
      console.error("按讚失敗", error);
      return;
    }
    // 樂觀鎖：成功後本地立即標記，視覺即時反饋
    addLiked(question.id);
    setAlreadyLiked(true);
    setBurstKey((k) => k + 1);
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -3 }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card text-card-foreground",
        "border border-border/70 p-5 sm:p-6",
        "shadow-[0_1px_0_oklch(0.92_0.02_70_/_0.4),0_8px_24px_-12px_oklch(0.5_0.05_45_/_0.18)]",
        "transition-[border-color,box-shadow] duration-300",
        "hover:border-primary/40 hover:shadow-[0_4px_0_oklch(0.92_0.02_70_/_0.3),0_18px_40px_-16px_oklch(0.62_0.18_38_/_0.35)]",
        isHot && "border-primary/30"
      )}
    >
      {/* 熱門卡片：左側暖橘漸層 accent bar */}
      {isHot ? (
        <span
          aria-hidden
          className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full bg-linear-to-b from-orange-400 via-rose-400 to-amber-300"
        />
      ) : null}

      <p
        className={cn(
          "whitespace-pre-wrap text-[15px] leading-[1.75] sm:text-base",
          isHot && "hot-shimmer font-medium"
        )}
      >
        {isHot ? (
          <motion.span
            aria-hidden
            className="mr-1.5 inline-block origin-center"
            animate={{ rotate: [-6, 8, -6] }}
            transition={{
              duration: 3.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            🔥
          </motion.span>
        ) : null}
        {question.content}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground/80">
          {new Date(question.created_at).toLocaleString("zh-TW", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>

        <div className="relative">
          {/* 粒子噴發層（按讚瞬間） */}
          {burstKey > 0 ? (
            <span
              key={burstKey}
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              {PARTICLES.map((p, i) => (
                <motion.span
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: p.x,
                    y: p.y,
                    opacity: 0,
                    scale: 0.4,
                  }}
                  transition={{
                    duration: 0.7,
                    delay: p.delay,
                    ease: [0.25, 0.6, 0.3, 1],
                  }}
                  className="absolute h-1.5 w-1.5 rounded-full bg-linear-to-br from-orange-400 to-rose-400"
                />
              ))}
              <motion.span
                initial={{ y: 0, opacity: 0, scale: 0.8 }}
                animate={{ y: -28, opacity: [0, 1, 0], scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute text-sm font-semibold text-primary"
              >
                +1
              </motion.span>
            </span>
          ) : null}

          <motion.button
            type="button"
            onClick={handleLike}
            disabled={pending || alreadyLiked}
            whileTap={alreadyLiked ? undefined : { scale: 0.92 }}
            className={cn(
              "relative inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2",
              "text-sm font-medium transition-colors duration-200",
              "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              alreadyLiked
                ? "border-border/60 bg-muted/60 text-muted-foreground cursor-not-allowed"
                : "border-border bg-card hover:border-primary/60 hover:bg-primary/10 hover:text-primary",
              pending && "opacity-60"
            )}
          >
            <span aria-hidden>{alreadyLiked ? "✓" : "👍"}</span>
            <span>
              {alreadyLiked ? "已 +1" : "我也想問"} ·{" "}
              <motion.span
                key={question.likes}
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="inline-block tabular-nums"
              >
                {question.likes}
              </motion.span>
            </span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
