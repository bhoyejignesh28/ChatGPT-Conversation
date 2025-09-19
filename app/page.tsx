import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-16 px-6 py-24">
      <section className="text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60">
          FilingsCenter
        </div>
        <h1 className="max-w-3xl text-5xl font-semibold text-white sm:text-6xl">
          Craft high-impact filing flyers with precision templates.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/70">
          FilingsCenter combines template control for administrators with a delightful editor for agents. Create reusable layouts, enforce brand consistency, and export production-ready PNGs in seconds.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/app">
            <Button className="px-8 py-3 text-base">Launch Editor</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" className="px-8 py-3 text-base">
              Manage Templates
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="px-8 py-3 text-base">
              Sign In
            </Button>
          </Link>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Template governance",
            body: "Admins define categories, sizes, and placeholders with pixel-perfect controls."
          },
          {
            title: "Agent-friendly editor",
            body: "Auto-filled profile details, live canvas preview, and export-to-PNG in one step."
          },
          {
            title: "Hosted on Netlify",
            body: "Serverless functions, Blobs storage, and instant deploys. Nothing else required."
          }
        ].map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm text-white/70">{feature.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
