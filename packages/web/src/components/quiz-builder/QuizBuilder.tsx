// ─────────────────────────────────────────────────────────────
// TUKOPAMOJA — Quiz Builder (Web Host Dashboard)
// Full CRUD for template + questions, drag-reorder, save.
// ─────────────────────────────────────────────────────────────

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Template, Question, QuestionOption } from "@tukopamoja/shared";
import { QUESTION_DEFAULTS } from "@tukopamoja/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuestionEditor from "./QuestionEditor";
import {
  Plus,
  Save,
  ArrowLeft,
  Trash2,
  Copy,
  GripVertical,
  Play,
} from "lucide-react";

// ─── Draft question type (no id yet for new questions) ──────
export interface DraftQuestion {
  id?: string;
  question_text: string;
  question_type: "multiple_choice" | "true_false";
  image_url: string | null;
  time_limit_sec: number;
  points: number;
  sort_order: number;
  options: QuestionOption[];
}

function createBlankQuestion(order: number): DraftQuestion {
  return {
    question_text: "",
    question_type: "multiple_choice",
    image_url: null,
    time_limit_sec: QUESTION_DEFAULTS.TIME_LIMIT_SEC,
    points: QUESTION_DEFAULTS.POINTS,
    sort_order: order,
    options: [
      { text: "", is_correct: true },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  };
}

interface QuizBuilderProps {
  existingTemplate?: Template;
  existingQuestions?: Question[];
}

export default function QuizBuilder({
  existingTemplate,
  existingQuestions,
}: QuizBuilderProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(existingTemplate?.title || "");
  const [description, setDescription] = useState(
    existingTemplate?.description || ""
  );
  const [questions, setQuestions] = useState<DraftQuestion[]>(
    existingQuestions?.length
      ? existingQuestions.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          question_type: q.question_type,
          image_url: q.image_url,
          time_limit_sec: q.time_limit_sec,
          points: q.points,
          sort_order: q.sort_order,
          options: q.options,
        }))
      : [createBlankQuestion(0)]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingTemplate;

  // ─── Question CRUD ──────────────────────────────────────────

  const addQuestion = useCallback(() => {
    setQuestions((prev) => {
      const next = [...prev, createBlankQuestion(prev.length)];
      setActiveIndex(next.length - 1);
      return next;
    });
  }, []);

  const duplicateQuestion = useCallback(
    (index: number) => {
      setQuestions((prev) => {
        const source = prev[index];
        const copy: DraftQuestion = {
          ...source,
          id: undefined,
          question_text: `${source.question_text} (copy)`,
          sort_order: prev.length,
        };
        const next = [...prev, copy];
        setActiveIndex(next.length - 1);
        return next;
      });
    },
    []
  );

  const deleteQuestion = useCallback(
    (index: number) => {
      setQuestions((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev
          .filter((_, i) => i !== index)
          .map((q, i) => ({ ...q, sort_order: i }));
        setActiveIndex(Math.min(activeIndex, next.length - 1));
        return next;
      });
    },
    [activeIndex]
  );

  const updateQuestion = useCallback(
    (index: number, updated: Partial<DraftQuestion>) => {
      setQuestions((prev) =>
        prev.map((q, i) => (i === index ? { ...q, ...updated } : q))
      );
    },
    []
  );

  // ─── Validation ─────────────────────────────────────────────

  function validate(): string | null {
    if (!title.trim()) return "Template title is required.";
    if (questions.length === 0) return "Add at least one question.";

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) return `Question ${i + 1}: text is empty.`;

      const filledOptions = q.options.filter((o) => o.text.trim());
      if (filledOptions.length < 2)
        return `Question ${i + 1}: needs at least 2 options.`;

      const hasCorrect = q.options.some((o) => o.is_correct && o.text.trim());
      if (!hasCorrect)
        return `Question ${i + 1}: no correct answer selected.`;
    }
    return null;
  }

  // ─── Save / Update ─────────────────────────────────────────

  async function handleSave() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let templateId = existingTemplate?.id;

      if (isEditing && templateId) {
        // Update template
        const { error: tErr } = await supabase
          .from("templates")
          .update({ title, description })
          .eq("id", templateId);
        if (tErr) throw tErr;

        // Delete old questions, insert new
        await supabase
          .from("questions")
          .delete()
          .eq("template_id", templateId);
      } else {
        // Create new template
        const { data: newTemplate, error: tErr } = await supabase
          .from("templates")
          .insert({ title, description, created_by: user.id })
          .select()
          .single();
        if (tErr || !newTemplate) throw tErr || new Error("Failed to create");
        templateId = newTemplate.id;
      }

      // Insert questions
      const questionRows = questions.map((q, i) => ({
        template_id: templateId!,
        question_text: q.question_text,
        question_type: q.question_type,
        image_url: q.image_url,
        time_limit_sec: q.time_limit_sec,
        points: q.points,
        sort_order: i,
        options: q.options.filter((o) => o.text.trim()),
      }));

      const { error: qErr } = await supabase
        .from("questions")
        .insert(questionRows);
      if (qErr) throw qErr;

      router.push("/dashboard/templates");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // ─── Start Game from Template ───────────────────────────────

  async function handleStartGame() {
    if (!existingTemplate?.id) return;

    const validationError = validate();
    if (validationError) {
      setError("Save the template first before starting a game.");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please sign in again to start a game session.");
      }

      const { data, error: fnErr } = await supabase.rpc("create_session", {
        p_template_id: existingTemplate.id,
        p_host_id: user.id,
      });

      if (fnErr) throw fnErr;
      const sessionId = typeof data === "object" && data !== null && "id" in data
        ? (data as { id: string }).id
        : data;
      if (!sessionId) throw new Error("Session creation returned no id");
      router.push(`/host/?sessionId=${sessionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setSaving(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/templates")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Templates
        </button>

        <div className="flex items-center gap-2">
          {isEditing && (
            <Button
              variant="outline"
              onClick={handleStartGame}
              disabled={saving}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gradient-primary border-0 btn-3d text-black font-semibold"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : isEditing ? "Update Template" : "Save Template"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Template metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Company Onboarding Quiz"
              className="text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description (optional)</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this quiz about?"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Question sidebar + editor */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Question list sidebar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Questions ({questions.length})
            </h3>
            <Button variant="ghost" size="sm" onClick={addQuestion}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {questions.map((q, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-full text-left p-3 rounded-lg border transition-colors group ${
                  i === activeIndex
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30 bg-card"
                }`}
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">
                      Q{i + 1}
                    </p>
                    <p className="text-sm font-medium truncate">
                      {q.question_text || "Untitled question"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {q.time_limit_sec}s • {q.points} pts
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateQuestion(i);
                      }}
                      className="p-1 hover:bg-accent rounded"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {questions.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuestion(i);
                        }}
                        className="p-1 hover:bg-destructive/20 text-destructive rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={addQuestion}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>

        {/* Active question editor */}
        <div>
          {questions[activeIndex] && (
            <QuestionEditor
              question={questions[activeIndex]}
              index={activeIndex}
              onChange={(updated) => updateQuestion(activeIndex, updated)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
