"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Review } from "@/types/database";

export type ReviewStats = {
  restaurant_id: string;
  averageRating: number;
  reviewCount: number;
};

export function useReviewStats() {
  const [stats, setStats] = useState<ReviewStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: fetchError } = await supabase
        .from<Review>("reviews")
        .select("restaurant_id,rating");

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const map = new Map<string, { sum: number; count: number }>();
      (data ?? []).forEach((review) => {
        const next = map.get(review.restaurant_id) ?? { sum: 0, count: 0 };
        next.sum += review.rating;
        next.count += 1;
        map.set(review.restaurant_id, next);
      });

      const nextStats = Array.from(map.entries()).map(
        ([restaurant_id, { sum, count }]) => ({
          restaurant_id,
          averageRating: Math.round((sum / count) * 10) / 10,
          reviewCount: count,
        })
      );

      setStats(nextStats);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel("reviews-stats")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reviews",
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, loading, error };
}
