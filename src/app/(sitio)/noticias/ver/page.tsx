"use client";
import { useEffect, useState } from "react";
import { ArticleView } from "@/components/site/News";

export default function Page() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => setId(new URLSearchParams(window.location.search).get("id")), []);
  if (!id) return <div className="mx-auto h-[60dvh] max-w-3xl animate-pulse px-4 py-8"><div className="h-full rounded-[18px] bg-sunk" /></div>;
  return <ArticleView id={id} />;
}
