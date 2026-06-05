"use client";

import { useParams } from "next/navigation";
import { EditorView } from "../../../../src/features/editor/EditorView";

export default function EditorPage() {
  const params = useParams<{ projectId: string }>();
  return <EditorView projectId={params.projectId ?? "demo"} />;
}
