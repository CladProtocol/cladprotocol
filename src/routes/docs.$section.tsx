import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DOC_SECTIONS, getDocSection, type DocBlock } from "@/lib/docs";
import { PillButton } from "@/components/axion/shared";

export const Route = createFileRoute("/docs/$section")({
  component: DocArticle,
  head: ({ params }) => {
    const section = getDocSection(params.section);
    return {
      meta: [
        { title: section ? `${section.title} — Clad Docs` : "Docs — Clad Protocol" },
        { name: "description", content: section?.summary ?? "Clad Protocol documentation." },
      ],
    };
  },
});

function Block({ block }: { block: DocBlock }) {
  switch (block.kind) {
    case "h":
      return <h2 className="text-[22px] font-medium text-gray-900 mt-10 mb-4" style={{ letterSpacing: "-0.01em" }}>{block.text}</h2>;
    case "p":
      return <p className="text-[15px] sm:text-[16px] text-gray-600 leading-[1.7] mb-5">{block.text}</p>;
    case "list":
      return (
        <ul className="flex flex-col gap-3 mb-6">
          {block.items.map((it) => (
            <li key={it} className="flex items-start gap-3">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#ECE81A] shrink-0" />
              <span className="text-[15px] text-gray-700 leading-[1.6]">{it}</span>
            </li>
          ))}
        </ul>
      );
    case "code":
      return (
        <div className="rounded-2xl bg-gray-900 overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/10">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 font-mono">{block.lang}</span>
            <span className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ECE81A]/60" />
            </span>
          </div>
          <pre className="px-5 py-4 overflow-x-auto text-[13px] leading-[1.6] text-gray-200 font-mono">
            <code>{block.code}</code>
          </pre>
        </div>
      );
  }
}

function DocArticle() {
  const { section: slug } = Route.useParams();
  const section = getDocSection(slug);

  if (!section) {
    return (
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 py-24 text-center">
        <h1 className="text-[28px] font-medium text-gray-900">Section not found</h1>
        <p className="mt-3 text-gray-600">No documentation page at /docs/{slug}.</p>
        <div className="mt-6 flex justify-center">
          <PillButton label="Back to docs" variant="dark" to="/docs" />
        </div>
      </section>
    );
  }

  const idx = DOC_SECTIONS.findIndex((s) => s.slug === slug);
  const prev = idx > 0 ? DOC_SECTIONS[idx - 1] : null;
  const next = idx < DOC_SECTIONS.length - 1 ? DOC_SECTIONS[idx + 1] : null;
  const Icon = section.icon;

  return (
    <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-10 sm:pt-12 pb-16 sm:pb-20">
      <Link to="/docs" className="inline-flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 transition-colors mb-8">
        <ArrowLeft size={14} /> Documentation
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
        {/* Side nav */}
        <aside className="lg:sticky lg:top-3 self-start">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-3 px-3">On this protocol</div>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {DOC_SECTIONS.map((s) => (
              <Link
                key={s.slug}
                to="/docs/$section"
                params={{ section: s.slug }}
                className={`rounded-xl px-3 py-2 text-[13.5px] whitespace-nowrap transition-colors ${
                  s.slug === slug
                    ? "bg-gray-900 text-white font-medium"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                {s.title}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Article */}
        <article className="min-w-0">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-10 h-10 rounded-full bg-[#ECE81A] flex items-center justify-center">
              <Icon size={18} className="text-gray-900" />
            </span>
            <span className="text-[12px] text-gray-500">{section.readingTime} read</span>
          </div>
          <h1 className="text-[32px] sm:text-[44px] font-medium text-gray-900 leading-[1.05] tracking-tight mb-6">
            {section.title}
          </h1>

          <div className="bg-white rounded-2xl p-6 sm:p-10">
            {section.body.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </div>

          {/* Prev / next */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prev ? (
              <Link
                to="/docs/$section"
                params={{ section: prev.slug }}
                className="group bg-white rounded-2xl p-5 flex items-center gap-3 hover:border-gray-900 border border-transparent transition-colors"
              >
                <ArrowLeft size={16} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-gray-400">Previous</div>
                  <div className="text-[14px] font-medium text-gray-900">{prev.title}</div>
                </div>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                to="/docs/$section"
                params={{ section: next.slug }}
                className="group bg-white rounded-2xl p-5 flex items-center justify-end gap-3 text-right hover:border-gray-900 border border-transparent transition-colors sm:col-start-2"
              >
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-gray-400">Next</div>
                  <div className="text-[14px] font-medium text-gray-900">{next.title}</div>
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-900 transition-colors" />
              </Link>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
