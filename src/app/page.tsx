"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { QuestionCard } from "@/components/question-card";
import { QuestionForm } from "@/components/question-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/lib/supabase";
import type { Question } from "@/types/database";

function sortQuestions(list: Question[]) {
  return [...list].sort((a, b) => {
    if (b.likes !== a.likes) return b.likes - a.likes;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// 數字 count-up（給統計徽章用，0 → target 的平滑動畫）
function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const from = value;
    const delta = target - from;

    function step(now: number) {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + delta * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // 故意只 depend on target；from 是上一次的 value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: fetchError } = await supabase
        .from("questions")
        .select("*")
        .order("likes", { ascending: false })
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setQuestions(data ?? []);
      }
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("questions-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "questions" },
        (payload) => {
          const next = payload.new as Question;
          setQuestions((prev) =>
            prev.some((q) => q.id === next.id)
              ? prev
              : sortQuestions([next, ...prev])
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "questions" },
        (payload) => {
          const next = payload.new as Question;
          setQuestions((prev) =>
            sortQuestions(prev.map((q) => (q.id === next.id ? next : q)))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "questions" },
        (payload) => {
          const old = payload.old as Pick<Question, "id">;
          setQuestions((prev) => prev.filter((q) => q.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // 滑鼠跟隨光暈：寫入 CSS var，由 .mouse-spotlight 讀取
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const el = spotlightRef.current;
      if (!el) return;
      el.style.setProperty("--mouse-x", `${e.clientX}px`);
      el.style.setProperty("--mouse-y", `${e.clientY}px`);
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const totalLikes = useMemo(
    () => questions.reduce((sum, q) => sum + q.likes, 0),
    [questions]
  );

  const animatedCount = useCountUp(questions.length);
  const animatedLikes = useCountUp(totalLikes);

  return (
    <>
      <div ref={spotlightRef} className="mouse-spotlight" aria-hidden />

      <main className="relative mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        {/* ============ Header ============ */}
        <motion.header
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.09, delayChildren: 0.05 },
            },
          }}
          className="flex flex-col gap-4"
        >
          {/* Top bar：左邊小裝飾、右邊主題切換 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: -6 },
              show: { opacity: 1, y: 0 },
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-block h-px w-6 bg-foreground/30" />
              <span>AI × 教學 · 2026</span>
            </div>
            <ThemeToggle />
          </motion.div>

          {/* 大標 */}
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0 },
            }}
            className="font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
          >
            <span className="italic">Class</span>
            <span>Wall</span>
            <span className="text-primary">.</span>
          </motion.h1>

          {/* 副標 */}
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 },
            }}
            className="max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base"
          >
            一道屬於這間教室的匿名問答牆——
            <span className="font-display italic text-foreground">
              想問什麼，就大方問
            </span>
            。 即時同步、按讚衝榜、誰都看得到。
          </motion.p>

          {/* 統計徽章 */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: { opacity: 1, y: 0 },
            }}
            className="flex flex-wrap items-center gap-2 pt-1"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 backdrop-blur-md px-3 py-1.5 text-[12px]">
              <span className="text-muted-foreground">問題</span>
              <span className="font-display text-base tabular-nums">
                {animatedCount}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 backdrop-blur-md px-3 py-1.5 text-[12px]">
              <span className="text-muted-foreground">總 +1</span>
              <span className="font-display text-base text-primary tabular-nums">
                {animatedLikes}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 backdrop-blur-md px-3 py-1.5 text-[12px]">
              <span className="live-dot" aria-hidden />
              <span className="text-muted-foreground">即時連線中</span>
            </span>
          </motion.div>
        </motion.header>

        {/* ============ 發問區 ============ */}
        <section aria-label="發問區">
          <QuestionForm />
        </section>

        {/* ============ 問題列表 ============ */}
        <section aria-label="問題列表" className="flex flex-col gap-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between"
          >
            <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
              牆上的問題
            </h2>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              依按讚數排序
            </span>
          </motion.div>

          {loading ? (
            <SkeletonList />
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
              讀取失敗：{error}
            </div>
          ) : questions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dashed border-border/70 bg-card/40 py-16 text-center"
            >
              <p className="font-display text-2xl italic text-muted-foreground">
                還沒有人發問
              </p>
              <p className="mt-2 text-sm text-muted-foreground/80">
                你來當第一個 ✨
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout" initial={false}>
                {questions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="pt-8 pb-4 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70"
        >
          built with Next.js · Supabase · Motion
        </motion.footer>
      </main>
    </>
  );
}

// 載入骨架（避免空白閃爍）
function SkeletonList() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
          className="h-24 rounded-2xl border border-border/60 bg-card/40"
        />
      ))}
    </div>
  );
}
