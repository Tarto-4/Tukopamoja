"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { clearCacheKey, getOrLoadCached } from "@/lib/query-cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, ChevronDown, ChevronUp, Download, Trophy, Users, Mail, Trash2, Archive } from "lucide-react";
import { MEDALS } from "@tukopamoja/shared";

const SESSIONS_CACHE_KEY = "dashboard:sessions:list";

interface SessionDetail {
  players: any[];
  answers: any[];
}

interface ArchivedSession {
  id: string;
  archived_at: string;
  template_title: string | null;
  pin: string | null;
  player_count: number;
  created_at: string | null;
  ended_at: string | null;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, SessionDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Archived sessions state
  const [showArchived, setShowArchived] = useState(false);
  const [archivedSessions, setArchivedSessions] = useState<ArchivedSession[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [archivedError, setArchivedError] = useState<string | null>(null);
  const [archivedExpandedId, setArchivedExpandedId] = useState<string | null>(null);
  const [archivedPayload, setArchivedPayload] = useState<Record<string, any>>({});
  const [deletingArchivedId, setDeletingArchivedId] = useState<string | null>(null);

  async function loadSessions(forceRefresh = false) {
    if (forceRefresh) {
      clearCacheKey(SESSIONS_CACHE_KEY);
    }

    const data = await getOrLoadCached(
      SESSIONS_CACHE_KEY,
      async () => {
        const supabase = createClient();
        const { data: latest, error: queryError } = await supabase
          .from("sessions")
          .select("*, templates(title)")
          .order("created_at", { ascending: false })
          .limit(50);

        if (queryError) {
          console.error("[Sessions] fetch error:", queryError);
          throw new Error(queryError.message);
        }

        return latest || [];
      },
      {
        ttlMs: 8_000,
        earlyRefreshRatio: 0.65,
        maxInflightLoads: 6,
      }
    );

    setSessions(data);
  }

  useEffect(() => {
    loadSessions()
      .catch((err) => {
        console.error("[Sessions] initial load failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load sessions");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleRefreshSessions() {
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      await loadSessions(true);
    } catch (err) {
      console.error("[Sessions] refresh failed:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh sessions");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDeleteSession(sessionId: string, title: string) {
    const confirmed = window.confirm(
      `Permanently delete session "${title}"?\n\nThis removes all player data and answers. This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(sessionId);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("delete_single_session", {
        p_session_id: sessionId,
      });
      if (rpcError) throw new Error(rpcError.message);

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setDetails((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
      if (expandedId === sessionId) setExpandedId(null);
      clearCacheKey(SESSIONS_CACHE_KEY);
    } catch (err) {
      console.error("[Sessions] delete failed:", err);
      window.alert(err instanceof Error ? err.message : "Failed to delete session");
    } finally {
      setDeletingId(null);
    }
  }

  async function loadArchivedSessions() {
    setLoadingArchived(true);
    setArchivedError(null);
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("list_my_archived_sessions", {
        p_limit: 50,
        p_offset: 0,
      });
      if (rpcError) throw new Error(rpcError.message);
      setArchivedSessions((data as ArchivedSession[]) || []);
    } catch (err) {
      console.error("[Sessions] archived load failed:", err);
      setArchivedError(err instanceof Error ? err.message : "Failed to load archived sessions");
    } finally {
      setLoadingArchived(false);
    }
  }

  async function toggleArchivedExpand(archiveId: string) {
    if (archivedExpandedId === archiveId) {
      setArchivedExpandedId(null);
      return;
    }
    setArchivedExpandedId(archiveId);
    if (archivedPayload[archiveId]) return;

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("get_archived_session", {
        p_archive_id: archiveId,
      });
      if (rpcError) throw new Error(rpcError.message);
      setArchivedPayload((prev) => ({ ...prev, [archiveId]: data }));
    } catch (err) {
      console.error("[Sessions] archived detail failed:", err);
    }
  }

  async function handleDeleteArchived(archiveId: string) {
    const confirmed = window.confirm(
      "Permanently delete this archived session?\n\nThis cannot be undone."
    );
    if (!confirmed) return;

    setDeletingArchivedId(archiveId);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("delete_archived_session", {
        p_archive_id: archiveId,
      });
      if (rpcError) throw new Error(rpcError.message);
      setArchivedSessions((prev) => prev.filter((a) => a.id !== archiveId));
      if (archivedExpandedId === archiveId) setArchivedExpandedId(null);
    } catch (err) {
      console.error("[Sessions] archived delete failed:", err);
      window.alert(err instanceof Error ? err.message : "Failed to delete archived session");
    } finally {
      setDeletingArchivedId(null);
    }
  }

  async function toggleExpand(sessionId: string) {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);

    if (details[sessionId]) return;

    setLoadingDetail(sessionId);
    const supabase = createClient();

    const [{ data: players }, { data: answers }] = await Promise.all([
      supabase
        .from("session_players")
        .select("*")
        .eq("session_id", sessionId)
        .order("score", { ascending: false }),
      supabase
        .from("player_answers")
        .select("*")
        .eq("session_id", sessionId)
        .order("question_index", { ascending: true }),
    ]);

    setDetails((prev) => ({
      ...prev,
      [sessionId]: { players: players || [], answers: answers || [] },
    }));
    setLoadingDetail(null);
  }

  function exportSessionCSV(session: any) {
    const detail = details[session.id];
    if (!detail) return;

    const { players, answers } = detail;
    const questionsSnapshot = session.questions_snapshot || [];

    // Build player lookup
    const playerMap = new Map(players.map((p: any) => [p.id, p]));

    // CSV header
    const rows: string[][] = [
      [
        "Player Name",
        "Email",
        "Final Score",
        "Rank",
        "Question #",
        "Question Text",
        "Selected Option",
        "Correct?",
        "Points Awarded",
        "Time (ms)",
        "Answered At",
      ],
    ];

    // One row per answer
    for (const ans of answers) {
      const player = playerMap.get(ans.player_id) as any;
      const q = questionsSnapshot[ans.question_index];
      const playerName = player
        ? `${player.first_name || ""} ${player.last_name || ""}`.trim() || player.nickname
        : "Unknown";
      rows.push([
        playerName,
        player?.email || "",
        String(player?.score ?? 0),
        String(player?.rank ?? ""),
        String(ans.question_index + 1),
        q?.question_text || "",
        q?.options?.[ans.selected_option]?.text || String(ans.selected_option),
        ans.is_correct ? "Yes" : "No",
        String(ans.points_awarded),
        String(ans.time_taken_ms),
        ans.answered_at || "",
      ]);
    }

    // Players with no answers (joined but didn't play)
    for (const p of players) {
      const hasAnswer = answers.some((a: any) => a.player_id === p.id);
      if (!hasAnswer) {
        const playerName = `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.nickname;
        rows.push([
          playerName,
          p.email || "",
          String(p.score ?? 0),
          String(p.rank ?? ""),
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
      }
    }

    const csvContent = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const title = session.templates?.title || "session";
    const date = new Date(session.created_at).toISOString().slice(0, 10);
    a.download = `${title.replace(/\s+/g, "_")}_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="page-container relative z-10">
        <p className="text-muted-foreground animate-pulse">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="page-container relative z-10">
      <div className="mb-8 rounded-2xl glass p-6 border border-border/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 accent-bar" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-serif font-black">Game Sessions</h1>
            <p className="text-muted-foreground mt-1">
              History of all hosted game sessions with player data and results
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefreshSessions}
            disabled={refreshing}
            className="border-[#eecd00]/30 text-foreground dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Sessions"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-4 border-rose-500/30 bg-rose-500/10">
          <CardContent className="py-4">
            <p className="text-rose-400 text-sm">Error: {error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSessions}
              className="mt-2 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!sessions.length && !error ? (
        <Card className="text-center py-12 glass border-border/60 bg-transparent">
          <CardContent>
            <p className="text-muted-foreground">
              No sessions yet. Start a game from a template!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isExpanded = expandedId === session.id;
            const detail = details[session.id];
            const isDetailLoading = loadingDetail === session.id;
            const winner = detail?.players?.[0];
            const totalQuestions = session.questions_snapshot?.length || 0;

            return (
              <Card key={session.id} className="glass border-border/60 bg-transparent overflow-hidden">
                {/* Summary row — clickable to expand */}
                <button
                  onClick={() => toggleExpand(session.id)}
                  className="w-full text-left"
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {session.templates?.title || "Untitled"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        PIN: {session.pin} &bull; {session.player_count} player{session.player_count !== 1 ? "s" : ""} &bull;{" "}
                        {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
                      </p>
                      {/* Show winner inline for finished sessions */}
                      {session.status === "finished" && detail && winner && (
                        <p className="text-xs text-[#eecd00] mt-1 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          Winner: {winner.first_name || ""} {winner.last_name || winner.nickname} — {winner.score?.toLocaleString()} pts
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{new Date(session.created_at).toLocaleDateString()}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            session.status === "finished"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : session.status === "lobby"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-white/10 px-6 pb-6 pt-4 space-y-5">
                    {isDetailLoading ? (
                      <p className="text-muted-foreground animate-pulse text-sm">Loading session data...</p>
                    ) : detail ? (
                      <>
                        {/* Action buttons */}
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportSessionCSV(session);
                            }}
                            className="border-[#eecd00]/30 text-[#eecd00] hover:bg-[#eecd00]/10"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </Button>
                          {(session.status === "finished" || session.status === "lobby") && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deletingId === session.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSession(session.id, session.templates?.title || "Untitled");
                              }}
                              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {deletingId === session.id ? "Deleting..." : "Delete"}
                            </Button>
                          )}
                        </div>

                        {/* Attendees / Leaderboard */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-4 h-4 text-[#eecd00]" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                              Attendees &amp; Standings ({detail.players.length})
                            </h3>
                          </div>
                          <div className="space-y-1.5 max-h-64 overflow-y-auto">
                            {detail.players.map((p: any, idx: number) => {
                              const displayName = `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.nickname;
                              const answersCount = detail.answers.filter((a: any) => a.player_id === p.id).length;
                              const correctCount = detail.answers.filter((a: any) => a.player_id === p.id && a.is_correct).length;
                              return (
                                <div
                                  key={p.id}
                                  className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white/5 border border-white/10"
                                >
                                  <span className="w-7 text-center text-sm shrink-0">
                                    {idx < 3 ? MEDALS[idx] : `#${idx + 1}`}
                                  </span>
                                  <span className="text-lg shrink-0">{p.avatar}</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{displayName}</p>
                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {p.email || "—"}
                                    </p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-sm font-serif font-bold tabular-nums">{(p.score ?? 0).toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {correctCount}/{answersCount} correct
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Per-question answer breakdown */}
                        {totalQuestions > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70 mb-3">
                              Question-by-Question Breakdown
                            </h3>
                            <div className="space-y-3">
                              {(session.questions_snapshot || []).map((q: any, qi: number) => {
                                const qAnswers = detail.answers.filter((a: any) => a.question_index === qi);
                                const correctCount = qAnswers.filter((a: any) => a.is_correct).length;
                                return (
                                  <div key={qi} className="rounded-xl bg-white/5 border border-white/10 p-3">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <p className="text-sm font-medium">
                                        <span className="text-white/50 mr-2">Q{qi + 1}.</span>
                                        {q.question_text}
                                      </p>
                                      <span className="text-xs text-muted-foreground shrink-0">
                                        {correctCount}/{qAnswers.length} correct
                                      </span>
                                    </div>
                                    {qAnswers.length > 0 && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                        {qAnswers.map((a: any) => {
                                          const player = detail.players.find((p: any) => p.id === a.player_id);
                                          const pName = player
                                            ? `${player.first_name || ""} ${player.last_name || ""}`.trim() || player.nickname
                                            : "Unknown";
                                          return (
                                            <div
                                              key={a.id}
                                              className={`text-xs px-2 py-1.5 rounded-lg flex items-center justify-between gap-2 ${
                                                a.is_correct
                                                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                                  : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                                              }`}
                                            >
                                              <span className="truncate">{pName}</span>
                                              <span className="shrink-0 tabular-nums font-medium">
                                                +{a.points_awarded} · {(a.time_taken_ms / 1000).toFixed(1)}s
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      {/* ─── Archived Sessions Section ─── */}
      <div className="mt-10">
        <button
          onClick={() => {
            setShowArchived((prev) => !prev);
            if (!showArchived && archivedSessions.length === 0) {
              loadArchivedSessions();
            }
          }}
          className="flex items-center gap-2 mb-4 group"
        >
          <Archive className="w-5 h-5 text-[#eecd00]" />
          <h2 className="text-xl font-serif font-bold text-white/80 group-hover:text-white transition-colors">
            Archived Sessions
          </h2>
          {showArchived ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showArchived && (
          <div className="space-y-3">
            {loadingArchived && (
              <p className="text-muted-foreground animate-pulse text-sm">Loading archived sessions...</p>
            )}

            {archivedError && (
              <Card className="border-rose-500/30 bg-rose-500/10">
                <CardContent className="py-4">
                  <p className="text-rose-400 text-sm">Error: {archivedError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadArchivedSessions}
                    className="mt-2 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            )}

            {!loadingArchived && !archivedError && archivedSessions.length === 0 && (
              <Card className="glass border-border/60 bg-transparent">
                <CardContent className="py-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    No archived sessions. Finished sessions older than 14 days are automatically archived.
                  </p>
                </CardContent>
              </Card>
            )}

            {archivedSessions.map((arc) => {
              const isArcExpanded = archivedExpandedId === arc.id;
              const payload = archivedPayload[arc.id];
              const players = payload?.players || [];
              const answers = payload?.answers || [];

              return (
                <Card key={arc.id} className="glass border-border/60 bg-transparent overflow-hidden opacity-80">
                  <button
                    onClick={() => toggleArchivedExpand(arc.id)}
                    className="w-full text-left"
                  >
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {arc.template_title || "Untitled"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {arc.pin ? `PIN: ${arc.pin} \u2022 ` : ""}
                          {arc.player_count} player{arc.player_count !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm text-muted-foreground">
                          {arc.created_at && (
                            <p>{new Date(arc.created_at).toLocaleDateString()}</p>
                          )}
                          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/50">
                            archived
                          </span>
                        </div>
                        {isArcExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </button>

                  {isArcExpanded && (
                    <div className="border-t border-white/10 px-6 pb-6 pt-4 space-y-4">
                      {!payload ? (
                        <p className="text-muted-foreground animate-pulse text-sm">Loading archive data...</p>
                      ) : (
                        <>
                          {/* Archived players */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="w-4 h-4 text-[#eecd00]" />
                              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                                Players ({players.length})
                              </h3>
                            </div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {players.map((p: any, idx: number) => {
                                const displayName = `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.nickname || "Player";
                                return (
                                  <div
                                    key={p.id || idx}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2 bg-white/5 border border-white/10"
                                  >
                                    <span className="w-7 text-center text-sm shrink-0">
                                      {idx < 3 ? MEDALS[idx] : `#${idx + 1}`}
                                    </span>
                                    <span className="text-lg shrink-0">{p.avatar || "🎮"}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{displayName}</p>
                                      <p className="text-xs text-muted-foreground truncate">{p.email || "—"}</p>
                                    </div>
                                    <p className="text-sm font-serif font-bold tabular-nums shrink-0">
                                      {(p.score ?? 0).toLocaleString()}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Delete archived */}
                          <div className="flex justify-end pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={deletingArchivedId === arc.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteArchived(arc.id);
                              }}
                              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {deletingArchivedId === arc.id ? "Deleting..." : "Delete Permanently"}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
