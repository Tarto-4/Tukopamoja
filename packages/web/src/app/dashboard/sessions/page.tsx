import { createServerSupabase } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Session } from "@quizarena/shared";

export default async function SessionsPage() {
  const supabase = await createServerSupabase();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, templates(title)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-black">Game Sessions</h1>
        <p className="text-muted-foreground mt-1">
          History of all hosted game sessions
        </p>
      </div>

      {!sessions?.length ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">
              No sessions yet. Start a game from a template!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session: any) => (
            <Card key={session.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-semibold">
                    {session.templates?.title || "Untitled"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PIN: {session.pin} • {session.player_count} players •{" "}
                    {session.status}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
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
