"use client";
import { useSyncExternalStore } from "react";

const KEY = "umbral-guardados";
let cache: string[] | null = null;
const subs = new Set<() => void>();

function read(): string[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    cache = [];
  }
  return cache!;
}
const EMPTY: string[] = [];

export function useFavs() {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    read,
    () => EMPTY,
  );
}

export function toggleFav(id: string) {
  const cur = read();
  cache = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  subs.forEach((s) => s());
  return cache.includes(id);
}
