"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QuizBuilder from "@/components/quiz-builder/QuizBuilder";
import type { Template, Question } from "@tukopamoja/shared";

function EditTemplateContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [template, setTemplate] = useState<Template | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No template ID provided");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function load() {
      try {
        const { data: t, error: tErr } = await supabase
          .from("templates")
          .select("*")
          .eq("id", id!)
          .single();

        if (tErr || !t) {
          setError("Template not found");
          setLoading(false);
          return;
        }

        const { data: qs, error: qErr } = await supabase
          .from("questions")
          .select("*")
          .eq("template_id", id!)
          .order("sort_order");

        if (qErr) {
          console.warn("[TUKOPAMOJA] Failed to load questions:", qErr);
        }

        setTemplate(t as Template);
        setQuestions((qs as Question[]) || []);
      } catch (err) {
        setError("Failed to load template");
        console.error("[TUKOPAMOJA] Edit page load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <p className="text-muted-foreground animate-pulse">Loading template...</p>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="page-container">
        <p className="text-destructive">{error || "Template not found"}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <QuizBuilder existingTemplate={template} existingQuestions={questions} />
    </div>
  );
}

export default function EditTemplatePage() {
  return (
    <Suspense
      fallback={
        <div className="page-container">
          <p className="text-muted-foreground animate-pulse">Loading template...</p>
        </div>
      }
    >
      <EditTemplateContent />
    </Suspense>
  );
}
