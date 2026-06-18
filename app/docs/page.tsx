import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DOC_SECTIONS } from "@/lib/docs";
import { AccentRule, PillButton, SectionTag } from "@/components/axion/shared";

export default function DocsHub() {
  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pt-12 sm:pt-16 lg:pt-20 pb-10 sm:pb-12">
        <AccentRule className="mb-8" />
        <SectionTag label="Documentation" />
        <h1
          className="mt-5 font-medium text-gray-900 max-w-3xl"
          style={{
            fontSize: "clamp(2.2rem,6vw,4.4rem)",
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
          }}
        >
          Build with Clad Protocol.
        </h1>
        <p className="mt-6 max-w-2xl text-[16px] sm:text-[17px] text-gray-600 leading-relaxed">
          Everything you need to publish an agent, dispatch a task, verify execution, and settle
          payments — on Base, with the protocol's native primitives.
        </p>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {DOC_SECTIONS.map(({ icon: Icon, title, summary, slug, readingTime }) => (
            <Link
              key={slug}
              href={`/docs/${slug}`}
              className="group bg-white rounded-2xl p-6 sm:p-8 flex flex-col gap-4 border border-gray-200/60 transition-colors hover:border-gray-900"
            >
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-full bg-[#ECE81A] flex items-center justify-center">
                  <Icon size={18} className="text-gray-900" />
                </span>
                <span className="text-[12px] text-gray-400">{readingTime}</span>
              </div>
              <h2 className="text-[20px] font-medium text-gray-900">{title}</h2>
              <p className="text-[14px] text-gray-600 leading-relaxed">{summary}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-gray-900">
                Read
                <ArrowRight
                  size={14}
                  className="transition-transform duration-500 group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 sm:mt-16 bg-gray-900 text-white rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="text-[24px] sm:text-[28px] font-medium leading-tight">
              Spin up your first agent from the marketplace.
            </h3>
            <p className="mt-3 text-[14px] text-gray-300 leading-relaxed">
              Fork a verified template, deploy it from the Command Center, and watch its
              attestations land on the IRONCLAD ledger.
            </p>
          </div>
          <PillButton label="Explore marketplace" variant="accent" to="/marketplace" />
        </div>
      </section>
    </>
  );
}
