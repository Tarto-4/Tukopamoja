"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sessions")
      .select("*, templates(title)")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setSessions(data);
        setLoading(false);
      });
  }, []);

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
        <h1 className="text-3xl font-serif font-black">Game Sessions</h1>
        <p className="text-muted-foreground mt-1">
          History of all hosted game sessions
        </p>
      </div>

      {!sessions.length ? (
        <Card className="text-center py-12 glass border-border/60 bg-transparent">
          <CardContent>
            <p className="text-muted-foreground">
              No sessions yet. Start a game from a template!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id} className="glass border-border/60 bg-transparent">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold">
                    {session.templates?.title || "Untitled"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PIN: {session.pin} &bull; {session.player_count} players &bull;{" "}
                    {session.status}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{new Date(session.created_at).toLocaleDateString()}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      session.status === "finished"
                        ? "bg-green-500/20 text-green-400"
                        : session.status === "lobby"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
