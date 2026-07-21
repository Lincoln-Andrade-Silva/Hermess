import { Card } from "@/components/ui";

/** Placeholder: a vitrine pública toma este lugar na Fase 3. */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center justify-center p-6">
      <Card className="w-full text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Hermess</h1>
        <p className="mt-2 text-sm text-muted">
          Setup concluído. A vitrine entra na Fase 3.
        </p>
      </Card>
    </main>
  );
}
