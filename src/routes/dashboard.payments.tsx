import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import {
  PAYMENT_KIND_LABEL,
  formatTime,
  formatDate,
  usdExact,
  type PaymentKind,
} from "@/lib/demo-data";
import { paymentsQueryOptions } from "@/lib/queries";
import { withdraw } from "@/api/payments";
import { SectionTag, StatusBadge } from "@/components/axion/shared";

export const Route = createFileRoute("/dashboard/payments")({
  component: PaymentsPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(paymentsQueryOptions()),
  head: () => ({ meta: [{ title: "Payments — Clad Command Center" }] }),
});

const KIND_FILTERS: ("all" | PaymentKind)[] = ["all", "settlement", "royalty", "fork_fee", "withdrawal"];

function PaymentsPage() {
  const { data: payments } = useSuspenseQuery(paymentsQueryOptions());
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<"all" | PaymentKind>("all");

  const rows = useMemo(
    () => payments.filter((p) => kind === "all" || p.kind === kind),
    [payments, kind],
  );

  const inflow = payments.filter((p) => p.kind !== "withdrawal" && p.status === "settled").reduce((s, p) => s + p.amount, 0);
  const withdrawn = payments.filter((p) => p.kind === "withdrawal").reduce((s, p) => s + p.amount, 0);
  const pending = payments.filter((p) => p.status === "pending").length;
  const available = Math.round((inflow - withdrawn) * 100) / 100;

  const withdrawMutation = useMutation({
    mutationFn: (amount: number) => withdraw({ data: { amount } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <SectionTag label="x402 payments" />
            <h1 className="mt-4 font-medium text-gray-900" style={{ fontSize: "clamp(1.5rem,4vw,2.4rem)", letterSpacing: "-0.02em" }}>
              Settlement ledger
            </h1>
          </div>
          <button
            onClick={() => withdrawMutation.mutate(available)}
            disabled={available <= 0 || withdrawMutation.isPending}
            className="inline-flex items-center gap-2 text-[13px] font-medium rounded-full bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 transition-colors self-center"
          >
            <ArrowUpRight size={14} />
            {withdrawMutation.isPending ? "Withdrawing…" : `Withdraw ${usdExact(available)}`}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 max-w-2xl">
          <div>
            <div className="text-[22px] font-medium text-gray-900">{usdExact(inflow)}</div>
            <div className="text-[12px] text-gray-500">Settled in</div>
          </div>
          <div>
            <div className="text-[22px] font-medium text-gray-900">{usdExact(withdrawn)}</div>
            <div className="text-[12px] text-gray-500">Withdrawn</div>
          </div>
          <div>
            <div className="text-[22px] font-medium text-gray-900">{payments.length}</div>
            <div className="text-[12px] text-gray-500">Receipts</div>
          </div>
          <div>
            <div className="text-[22px] font-medium text-gray-900">{pending}</div>
            <div className="text-[12px] text-gray-500">Pending</div>
          </div>
        </div>
      </div>

      {/* Filter + table */}
      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h2 className="text-[16px] font-medium text-gray-900">Receipts</h2>
          <div className="flex items-center gap-1 bg-[#F5F5F5] rounded-full p-1 overflow-x-auto">
            {KIND_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setKind(f)}
                className={`text-[13px] font-medium rounded-full px-3.5 py-1.5 whitespace-nowrap transition-colors ${
                  kind === f ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {f === "all" ? "All" : PAYMENT_KIND_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] sm:text-[14px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <th className="py-3 font-medium">Transaction</th>
                <th className="py-3 px-2 font-medium hidden md:table-cell">Unit</th>
                <th className="py-3 px-2 font-medium">Type</th>
                <th className="py-3 px-2 font-medium hidden sm:table-cell">Status</th>
                <th className="py-3 px-2 font-medium hidden lg:table-cell">Counterparty</th>
                <th className="py-3 px-2 font-medium hidden sm:table-cell">When</th>
                <th className="py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const outbound = p.kind === "withdrawal";
                return (
                  <tr key={p.id} className="border-b border-gray-100 last:border-0 hover:bg-[#F5F5F5] transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            outbound ? "bg-gray-900 text-white" : "bg-[#ECE81A] text-gray-900"
                          }`}
                        >
                          {outbound ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                        </span>
                        <span className="font-mono text-[12px] text-gray-700">{p.txHash.slice(0, 10)}…{p.txHash.slice(-4)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 hidden md:table-cell">
                      {p.instanceId ? (
                        <Link to="/dashboard/fleet/$instanceId" params={{ instanceId: p.instanceId }} className="text-gray-700 hover:text-gray-900 hover:underline underline-offset-2">
                          {p.instanceName}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-2 text-gray-700">{PAYMENT_KIND_LABEL[p.kind]}</td>
                    <td className="py-3.5 px-2 hidden sm:table-cell">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-3.5 px-2 text-gray-500 font-mono text-[12px] hidden lg:table-cell">{p.counterparty}</td>
                    <td className="py-3.5 px-2 text-gray-500 hidden sm:table-cell">
                      {formatDate(p.at)}, {formatTime(p.at)}
                    </td>
                    <td className={`py-3.5 text-right font-medium ${outbound ? "text-gray-900" : "text-gray-900"}`}>
                      {outbound ? "−" : "+"}
                      {usdExact(p.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
