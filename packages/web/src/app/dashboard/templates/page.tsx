"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { clearCacheByPrefix, clearCacheKey, getOrLoadCached } from "@/lib/query-cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Template } from "@quizarena/shared";
import { Plus, FileText, RefreshCw } from "lucide-react";

const TEMPLATES_CACHE_KEY = "dashboard:templates:list";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchTemplatesWithComputedPlays() {
    const supabase = createClient();

    const [{ data: templateData }, { data: sessionsData }] = await Promise.all([
      supabase
        .from("templates")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("sessions")
        .select("template_id"),
    ]);

    const playCounts = (sessionsData || []).reduce<Record<string, number>>((acc, row) => {
      if (!row.template_id) return acc;
      acc[row.template_id] = (acc[row.template_id] || 0) + 1;
      return acc;
    }, {});

    const normalized = (templateData as Template[] | null)?.map((template) => ({
      ...template,
      play_count: playCounts[template.id] ?? 0,
    })) || [];

    return normalized;
  }

  async function loadTemplates(forceRefresh = false) {
    if (forceRefresh) {
      clearCacheKey(TEMPLATES_CACHE_KEY);
    }

    const normalized = await getOrLoadCached(
      TEMPLATES_CACHE_KEY,
      fetchTemplatesWithComputedPlays,
      {
        ttlMs: 8_000,
        earlyRefreshRatio: 0.65,
        maxInflightLoads: 6,
      }
    );

    setTemplates(normalized);
  }

  useEffect(() => {
    loadTemplates().finally(() => setLoading(false));
  }, []);

  async function handleRefreshStats() {
    if (refreshing) return;

    const confirmed = window.confirm(
      "Refresh Plays will permanently clear your played sessions and host logs. Continue?"
    );
    if (!confirmed) return;

    setRefreshing(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.rpc("reset_host_play_history");
      if (error) throw error;

      clearCacheByPrefix("dashboard:templates");
      clearCacheByPrefix("dashboard:sessions");

      await loadTemplates(true);

      const deletedSessions = Number((data as { deleted_sessions?: number } | null)?.deleted_sessions ?? 0);
      const deletedLogs = Number((data as { deleted_logs?: number } | null)?.deleted_logs ?? 0);
      window.alert(`Refresh complete. Deleted ${deletedSessions} sessions and ${deletedLogs} log entries.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to refresh play history.";
      window.alert(message);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="page-container relative z-10">
        <p className="text-muted-foreground animate-pulse">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="page-container relative z-10">
      <div className="flex items-center justify-between mb-8 rounded-2xl glass p-6 border border-border/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 accent-bar" />
        <div>
          <h1 className="text-3xl font-serif font-black">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your quiz templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefreshStats}
            disabled={refreshing}
            className="border-[#EEDC00]/30 text-foreground dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Plays"}
          </Button>
          <Link href="/dashboard/templates/new">
            <Button className="gradient-primary border-0 btn-3d text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </Link>
        </div>
      </div>

      {!templates.length ? (
        <Card className="text-center py-16 glass border-border/60 bg-transparent">
          <CardContent>
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first quiz template to get started.
            </p>
            <Link href="/dashboard/templates/new">
              <Button className="gradient-primary border-0 btn-3d text-white font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/dashboard/templates/edit?id=${template.id}`}
            >
              <Card className="glass border-border/60 bg-transparent hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {template.description || "No description"}
                      </CardDescription>
                    </div>
                    {template.is_published && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                        Published
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{template.question_count} questions</span>
                    <span>&bull;</span>
                    <span>Played {template.play_count}x</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
