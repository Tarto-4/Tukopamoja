// ─────────────────────────────────────────────────────────────
// QuizArena — Question Editor Component
// Edits a single question: text, type, options, time, points.
// ─────────────────────────────────────────────────────────────

"use client";

import type { QuestionOption } from "@quizarena/shared";
import { OPTION_COLORS, QUESTION_DEFAULTS } from "@quizarena/shared";
import type { DraftQuestion } from "./QuizBuilder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, Clock, Award, ImagePlus } from "lucide-react";

interface QuestionEditorProps {
  question: DraftQuestion;
  index: number;
  onChange: (updates: Partial<DraftQuestion>) => void;
}

const TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120];

export default function QuestionEditor({
  question,
  index,
  onChange,
}: QuestionEditorProps) {
  function updateOption(optIndex: number, updates: Partial<QuestionOption>) {
    const newOptions = question.options.map((opt, i) =>
      i === optIndex ? { ...opt, ...updates } : opt
    );
    onChange({ options: newOptions });
  }

  function setCorrectAnswer(optIndex: number) {
    const newOptions = question.options.map((opt, i) => ({
      ...opt,
      is_correct: i === optIndex,
    }));
    onChange({ options: newOptions });
  }

  function handleTypeChange(type: "multiple_choice" | "true_false") {
    if (type === "true_false") {
      onChange({
        question_type: type,
        options: [
          { text: "True", is_correct: true },
          { text: "False", is_correct: false },
        ],
      });
    } else {
      onChange({
        question_type: type,
        options: [
          { text: "", is_correct: true },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
          { text: "", is_correct: false },
        ],
      });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Q{index + 1}</span>
          <span className="text-lg">Question Editor</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question text */}
        <div className="space-y-2">
          <Label>Question Text</Label>
          <Input
            value={question.question_text}
            onChange={(e) => onChange({ question_text: e.target.value })}
            placeholder="Type your question here..."
            className="text-lg h-12"
          />
        </div>

        {/* Settings row: Type, Time, Points */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              Type
            </Label>
            <Select
              value={question.question_type}
              onValueChange={(v) =>
                handleTypeChange(v as "multiple_choice" | "true_false")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">
                  Multiple Choice
                </SelectItem>
                <SelectItem value="true_false">True / False</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Time Limit
            </Label>
            <Select
              value={String(question.time_limit_sec)}
              onValueChange={(v) =>
                onChange({ time_limit_sec: parseInt(v) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((t) => (
                  <SelectItem key={t} value={String(t)}>
                    {t} seconds
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Points
            </Label>
            <Select
              value={String(question.points)}
              onValueChange={(v) => onChange({ points: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[500, 1000, 1500, 2000].map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p} pts
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Image URL (optional) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <ImagePlus className="w-3.5 h-3.5" />
            Image URL (optional)
          </Label>
          <Input
            value={question.image_url || ""}
            onChange={(e) =>
              onChange({ image_url: e.target.value || null })
            }
            placeholder="https://example.com/image.png"
          />
        </div>

        {/* Answer options */}
        <div className="space-y-3">
          <Label>Answer Options</Label>
          <p className="text-xs text-muted-foreground">
            Click the checkmark to mark the correct answer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((opt, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border p-1 transition-colors"
                style={{
                  borderColor: opt.is_correct
                    ? OPTION_COLORS[i]?.bg || "#26890C"
                    : undefined,
                  backgroundColor: opt.is_correct
                    ? `${OPTION_COLORS[i]?.bg || "#26890C"}15`
                    : undefined,
                }}
              >
                {/* Color indicator */}
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: OPTION_COLORS[i]?.bg || "#666",
                  }}
                >
                  {OPTION_COLORS[i]?.shape || "?"}
                </div>

                {/* Text input */}
                <Input
                  value={opt.text}
                  onChange={(e) =>
                    updateOption(i, { text: e.target.value })
                  }
                  placeholder={`Option ${i + 1}`}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={question.question_type === "true_false"}
                />

                {/* Correct toggle */}
                <button
                  onClick={() => setCorrectAnswer(i)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    opt.is_correct
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                  title={
                    opt.is_correct ? "Correct answer" : "Mark as correct"
                  }
                >
                  {opt.is_correct ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4 opacity-30" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
