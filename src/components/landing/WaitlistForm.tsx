"use client";

import { useState, FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function WaitlistForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await addDoc(collection(db, COLLECTIONS.waitlist), {
        email,
        createdAt: serverTimestamp(),
      });
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="text-sm text-success font-medium">
        Kaydoldun. SKDM takvimindeki gelişmeleri sana e-posta ile ileteceğiz.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "flex gap-2" : "flex flex-col sm:flex-row gap-2"}>
      <Input
        type="email"
        required
        placeholder="is.epostan@sirket.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="sm:max-w-xs"
      />
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Kaydediliyor..." : "Bekleme Listesine Katıl"}
      </Button>
      {status === "error" && (
        <p className="text-xs text-danger self-center">Bir hata oluştu, tekrar dener misin?</p>
      )}
    </form>
  );
}
