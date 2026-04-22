import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import EditTemplateClient from "./EditTemplateClient";

interface Props {
  params: { id: string };
}

export default async function EditTemplatePage({ params }: Props) {
  const supabase = await createServerSupabase();

  const { data: template } = await supabase
    .from("templates")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!template) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("template_id", params.id)
    .order("sort_order");

  return (
    <div className="page-container">
      <EditTemplateClient template={template} questions={questions || []} />
    </div>
  );
}
