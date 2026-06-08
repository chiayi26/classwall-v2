"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useReviews } from "@/lib/use-reviews";
import { useReviewStats } from "@/lib/use-review-stats";
import { cn } from "@/lib/utils";
import type { Restaurant } from "@/types/database";

const RESTAURANTS: Restaurant[] = [
  {
    id: "f3e45c2e-44e8-4a2f-8637-57b7a6724d01",
    name: "異國快餐",
    building: "敬業樓",
    description: "敬業樓 地標餐廳",
  },
  {
    id: "a5d9b8d3-3f81-4fd6-8d0d-3f1d24b7d56e",
    name: "玖點茶飲",
    building: "敬業樓",
    description: "敬業樓 地標餐廳",
  },
  {
    id: "0c8f4d9f-9b55-4b4d-b4d0-8d4e4eb7f2f5",
    name: "嚐見麵",
    building: "敬業樓",
    description: "敬業樓 地標餐廳",
  },
  {
    id: "2a0017fc-8c3b-4bc6-a8f6-6ff50e902439",
    name: "早拾光",
    building: "樂群樓",
    description: "樂群樓 地標餐廳",
  },
  {
    id: "d0b85e75-8f32-4af7-b958-3f3dc57783e8",
    name: "麵之屋",
    building: "樂群樓",
    description: "樂群樓 地標餐廳",
  },
  {
    id: "5c28a0bf-70e8-4920-99a5-28c95598089b",
    name: "菇蒂早安吧",
    building: "學生活動中心",
    description: "學生活動中心 地標餐廳",
  },
  {
    id: "c6e8b7f2-12a5-4c1b-8c6a-2f8a9b3c7d42",
    name: "自助餐",
    building: "學生活動中心",
    description: "學生活動中心 地標餐廳",
  },
  {
    id: "f7a8d6e9-74c2-4c1d-a5e8-93fcb7bd8a1f",
    name: "賀琳坊",
    building: "學生活動中心",
    description: "學生活動中心 地標餐廳",
  },
  {
    id: "b4d6f29c-3e87-4c1e-9b5d-abc123ef4567",
    name: "海苔飯捲",
    building: "學生活動中心",
    description: "學生活動中心 地標餐廳",
  },
];

export default function Home() {
  const [selectedId, setSelectedId] = useState(RESTAURANTS[0].id);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedRestaurant =
    RESTAURANTS.find((restaurant) => restaurant.id === selectedId) ??
    RESTAURANTS[0];

  const { reviews, loading: reviewsLoading, error: reviewsError } =
    useReviews(selectedRestaurant.id);
  const { stats, loading: statsLoading, error: statsError } = useReviewStats();

  const topRestaurants = stats
    .map((stat) => ({
      ...stat,
      restaurant: RESTAURANTS.find(
        (restaurant) => restaurant.id === stat.restaurant_id
      ),
    }))
    .filter((item) => item.restaurant)
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.reviewCount - a.reviewCount;
    })
    .slice(0, 3);

  const stars = [1, 2, 3, 4, 5];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const trimmed = comment.trim();
    if (!trimmed) {
      setError("請輸入你的評論，讓大家更好判斷這間餐廳。");
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from("reviews").insert({
      restaurant_id: selectedRestaurant.id,
      rating,
      content: trimmed,
    });
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message ?? "送出失敗，請稍後再試。");
      return;
    }

    setMessage("已送出你的評分，謝謝分享！");
    setComment("");
    setRating(5);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-col gap-6 rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-[0_24px_80px_-40px_oklch(0.18_0.1_48_/_0.4)] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/80">
              校園美食評分系統
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              高第一學餐評分地圖
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              選擇一間餐廳，按一下名稱即可查看評分表單。
            </p>
          </div>
          <div className="hidden rounded-[1.75rem] border border-border/70 bg-muted/60 px-5 py-3 text-sm text-muted-foreground sm:block">
            簡單、乾淨、可點餐廳評分。
          </div>
        </div>

        <div className="grid gap-6">
          <section aria-label="校園美食地圖" className="space-y-4">
            <div className="rounded-[2rem] border border-border/70 bg-linear-to-br from-amber-50 via-background to-background/90 p-6 shadow-[0_18px_48px_-28px_oklch(0.33_0.06_48_/_0.34)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-border/70 bg-background p-4">
                <div className="relative h-full w-full overflow-hidden rounded-[1.5rem]">
                  <Image
                    src="/campus-food-map.png"
                    alt="高第一學餐評分地圖"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="pointer-events-none absolute left-6 top-6 inline-flex rounded-full bg-linear-to-r from-primary/20 via-primary/10 to-transparent px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary/90">
                  校園美食
                </span>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <section aria-label="評分與評論表單" className="space-y-4">
              <div className="rounded-[2rem] border border-border/70 bg-card/85 p-5 shadow-[0_10px_28px_-18px_oklch(0.24_0.05_38_/_0.38)]">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/80">
                    已選餐廳
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {selectedRestaurant.name}
                  </h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {selectedRestaurant.description}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-2 rounded-3xl border border-border/60 bg-background/90 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      敬業樓
                    </p>
                    <div className="grid gap-2">
                      {RESTAURANTS.filter((r) => r.building === "敬業樓").map(
                        (restaurant) => (
                          <Button
                            key={restaurant.id}
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={() => setSelectedId(restaurant.id)}
                            className={cn(
                              "w-full justify-start text-left text-sm",
                              selectedId === restaurant.id &&
                                "border-primary/60 bg-primary/10 text-primary"
                            )}
                          >
                            {restaurant.name}
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 rounded-3xl border border-border/60 bg-background/90 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      樂群樓
                    </p>
                    <div className="grid gap-2">
                      {RESTAURANTS.filter((r) => r.building === "樂群樓").map(
                        (restaurant) => (
                          <Button
                            key={restaurant.id}
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={() => setSelectedId(restaurant.id)}
                            className={cn(
                              "w-full justify-start text-left text-sm",
                              selectedId === restaurant.id &&
                                "border-primary/60 bg-primary/10 text-primary"
                            )}
                          >
                            {restaurant.name}
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 rounded-3xl border border-border/60 bg-background/90 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      學生活動中心
                    </p>
                    <div className="grid gap-2">
                      {RESTAURANTS.filter((r) => r.building === "學生活動中心").map(
                        (restaurant) => (
                          <Button
                            key={restaurant.id}
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={() => setSelectedId(restaurant.id)}
                            className={cn(
                              "w-full justify-start text-left text-sm",
                              selectedId === restaurant.id &&
                                "border-primary/60 bg-primary/10 text-primary"
                            )}
                          >
                            {restaurant.name}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-[repeat(5,minmax(0,1fr))]">
                  {stars.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-label={`選擇 ${value} 顆星`}
                      className={cn(
                        "rounded-3xl border px-3 py-3 text-lg transition-colors duration-200",
                        value <= rating
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border/60 bg-background text-muted-foreground hover:border-primary/60 hover:text-primary"
                      )}
                    >
                      {value <= rating ? "★" : "☆"}
                    </button>
                  ))}
                </div>
              </div>

              <Card className="rounded-[2rem] border-border/70 bg-card/80 p-0 shadow-[0_20px_60px_-38px_oklch(0.21_0.07_40_/_0.4)]">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="text-2xl">寫下你的美食評論</CardTitle>
                  <CardDescription>
                    選擇星等後，告訴大家這間餐廳最值得推薦的特色。
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-0">
                  <form
                    id="review-form"
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label
                        htmlFor="review-content"
                        className="text-sm font-medium text-foreground"
                      >
                        評論內容
                      </label>
                      <Textarea
                        id="review-content"
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="分享餐點、服務、用餐氛圍，讓同學快速選擇..."
                        rows={6}
                        maxLength={500}
                        disabled={submitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        最多 500 字，評分：{rating} 顆星。
                      </p>
                    </div>
                  </form>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 px-6 pb-6 pt-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      目前餐廳：
                      <span className="font-medium text-foreground">
                        {selectedRestaurant.name}
                      </span>
                    </p>
                    {message ? (
                      <p className="text-emerald-600">{message}</p>
                    ) : error ? (
                      <p className="text-destructive">{error}</p>
                    ) : (
                      <p>按一下「送出評分」即可記錄你的評論。</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    form="review-form"
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    {submitting ? "送出中..." : "送出評分"}
                  </Button>
                </CardFooter>
              </Card>
            </section>

            <section aria-label="全部評論" className="space-y-4">
              <div className="grid gap-3 rounded-[2rem] border border-border/70 bg-card/85 p-5 shadow-[0_10px_28px_-18px_oklch(0.24_0.05_38_/_0.38)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/80">
                      熱門餐廳排行榜
                    </p>
                    <h3 className="text-xl font-semibold text-foreground">
                      依平均評分排序的前三名
                    </h3>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {topRestaurants.length} 名
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {statsLoading ? (
                    <p className="text-sm text-muted-foreground">載入排行榜中...</p>
                  ) : statsError ? (
                    <p className="text-sm text-destructive">{statsError}</p>
                  ) : topRestaurants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      目前尚無評論，排行榜將於第一筆評論後顯示。
                    </p>
                  ) : (
                    topRestaurants.map((item, index) => (
                      <div
                        key={item.restaurant_id}
                        className="rounded-3xl border border-border/70 bg-background/90 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                              No. {index + 1}
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                              {item.restaurant?.name}
                            </p>
                          </div>
                          <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                            {item.averageRating.toFixed(1)} ★
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                          {item.reviewCount} 則評論
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border/70 bg-card/85 p-5 shadow-[0_10px_28px_-18px_oklch(0.24_0.05_38_/_0.38)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground/80">
                      餐廳評論
                    </p>
                    <h3 className="text-xl font-semibold text-foreground">
                      {selectedRestaurant.name} 的評論
                    </h3>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    共 {reviews.length} 則
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {reviewsLoading ? (
                    <p className="text-sm text-muted-foreground">評論載入中...</p>
                  ) : reviewsError ? (
                    <p className="text-sm text-destructive">{reviewsError}</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      尚無評論，快來當第一個分享的同學！
                    </p>
                  ) : (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-3xl border border-border/70 bg-background/90 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">
                              {review.rating} ★
                            </span>
                            <span>
                              {new Date(review.created_at).toLocaleDateString("zh-TW")}
                            </span>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-foreground">
                          {review.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
