"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Review } from "@/types/database";

export function useReviews(restaurantId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error: fetchError } = await supabase
        .from("reviews")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setReviews(data ?? []);
      }
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel(`reviews-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reviews",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const next = payload.new as Review;
          setReviews((prev) =>
            prev.some((review) => review.id === next.id) ? prev : [next, ...prev]
          );
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return { reviews, loading, error };
}
