import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Template } from "@quizarena/shared";
import { Plus, Play, FileText } from "lucide-react";

export default async function TemplatesPage() {
  const supabase = await createServerSupabase();
  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-black">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your quiz templates
          </p>
        </div>
        <Link href="/dashboard/templates/new">
          <Button className="gradient-primary border-0">
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Template Grid */}
      {!templates?.length ? (
        <Card className="text-center py-16">
          <CardContent>
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first quiz template to get started.
            </p>
            <Link href="/dashboard/templates/new">
              <Button className="gradient-primary border-0">
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(templates as Template[]).map((template) => (
            <Link
              key={template.id}
              href={`/dashboard/templates/${template.id}`}
            >
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
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
                    <span>•</span>
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
