import { NextRequest, NextResponse } from "next/server";
import { extractDocumentData } from "@/lib/ai/document-extraction";

export const dynamic = "force-dynamic";

const SUPPORTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 400 });
  }
  if (!SUPPORTED_TYPES.includes(file.type as (typeof SUPPORTED_TYPES)[number])) {
    return NextResponse.json({ error: "Desteklenmeyen dosya türü. PDF, JPEG, PNG veya WEBP yükleyin." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const extracted = await extractDocumentData({
      base64,
      mediaType: file.type as (typeof SUPPORTED_TYPES)[number],
    });
    return NextResponse.json({ extracted });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Belge işlenemedi" },
      { status: 500 }
    );
  }
}
