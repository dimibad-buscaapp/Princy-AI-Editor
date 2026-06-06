"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "princy-recent-projects";

export type RecentProject = {
  id: string;
  name: string;
  href: string;
  openedAt: string;
};

export function useRecentProjects() {
  const [projects, setProjects] = useState<RecentProject[]>([]);

  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setProjects(raw ? (JSON.parse(raw) as RecentProject[]) : []);
    } catch {
      setProjects([]);
    }
  }, []);

  const addProject = useCallback((project: Omit<RecentProject, "openedAt">) => {
    const entry: RecentProject = { ...project, openedAt: new Date().toISOString() };
    setProjects((prev) => {
      const next = [entry, ...prev.filter((p) => p.id !== project.id)].slice(0, 5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { projects: projects.slice(0, 3), addProject, refresh: load };
}
