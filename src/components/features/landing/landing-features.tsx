import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const PLATFORM_FEATURES = [
  {
    name: "Solve!",
    href: "/problems",
    ctaLabel: "Open Solve!",
    description:
      "Post a problem from coursework or a past paper and compare worked solutions ranked by peer votes and continuous resolution confidence.",
  },
  {
    name: "Lessons",
    href: "/lessons",
    ctaLabel: "Open Lessons",
    description:
      "Upload and browse subject-organized lessons with written explanations, PDF or slide attachments, and embedded walkthrough videos.",
  },
  {
    name: "Exams & Resources",
    href: "/resources",
    ctaLabel: "Browse Resources",
    description:
      "Find past papers and textbooks by subject and level, and practice Question Papers beside Mark Schemes in split-screen Train!.",
  },
  {
    name: "Discussions",
    href: "/forum",
    ctaLabel: "Open Forum",
    description:
      "Ask quick study questions, share revision notes, and keep up with community announcements in 30-day Forum threads.",
  },
];

export function LandingFeatures() {
  return (
    <section className="border-b border-border bg-card py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Features
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Four focused tools built around problem solving, lesson sharing, exam practice, and peer discussion.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background overflow-hidden divide-y divide-border">
          {PLATFORM_FEATURES.map((feature) => (
            <div
              key={feature.name}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 p-5 sm:p-6 items-center"
            >
              <div className="md:col-span-3">
                <h3 className="text-base font-semibold text-foreground">{feature.name}</h3>
              </div>

              <p className="md:col-span-7 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              <div className="md:col-span-2 md:text-right">
                <Link
                  href={feature.href}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>{feature.ctaLabel}</span>
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
