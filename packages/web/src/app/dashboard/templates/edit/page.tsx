"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import QuizBuilder from "@/components/quiz-builder/QuizBuilder";
import type { Template, Question } from "@quizarena/shared";

export default function EditTemplatePage() {
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

      const { data: qs } = await supabase
        .from("questions")
        .select("*")
        .eq("template_id", id!)
        .order("sort_order");

      setTemplate(t as Template);
      setQuestions((qs as Question[]) || []);
      setLoading(false);
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
