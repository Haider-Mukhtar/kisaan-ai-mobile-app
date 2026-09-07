import { useCallback, useEffect, useState } from "react";

import {
  getRememberedBlogs,
  readCachedBlogs,
  writeCachedBlogs,
} from "@/services/blogs/device-cache";
import { fetchLatestBlogs } from "@/services/blogs/fetch-blogs";
import type { BlogSnapshot } from "@/services/blogs/types";

type BlogStatus = "loading" | "ready" | "error";

export function useBlogs() {
  const [snapshot, setSnapshot] = useState<BlogSnapshot | null>(getRememberedBlogs);
  const [status, setStatus] = useState<BlogStatus>(snapshot ? "ready" : "loading");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);

    try {
      const live = await fetchLatestBlogs();
      setSnapshot(live);
      setStatus("ready");
      await writeCachedBlogs(live);
    } catch {
      const cached = await readCachedBlogs();

      if (cached) {
        setSnapshot(cached);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    readCachedBlogs().then((cached) => {
      if (!active) return;
      if (cached) {
        setSnapshot(cached);
        setStatus("ready");
      }
      void load();
    });

    return () => {
      active = false;
    };
  }, [load]);

  return {
    articles: snapshot?.articles ?? [],
    fetchedAt: snapshot?.fetchedAt ?? null,
    isRefreshing,
    refresh: () => load(true),
    status,
  };
}
