"use client";

import QuizBuilder from "@/components/quiz-builder/QuizBuilder";
import type { Template, Question } from "@quizarena/shared";

interface Props {
  template: Template;
  questions: Question[];
}

export default function EditTemplateClient({ template, questions }: Props) {
  return <QuizBuilder existingTemplate={template} existingQuestions={questions} />;
}
