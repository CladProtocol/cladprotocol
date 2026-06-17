import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Check, Copy, Globe, Wallet } from "lucide-react";
import { formatDate } from "@/lib/demo-data";
import { settingsQueryOptions } from "@/lib/queries";
import { haltFleet } from "@/api/fleet";
import { updateSettings, type NotificationPrefs } from "@/api/settings";
import { SectionTag } from "@/components/axion/shared";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQueryOptions()),
  head: () => ({ meta: [{ title: "Settings — Clad Command Center" }] }),
});

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${on ? "bg-gray-900" : "bg-gray-300"}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`}
        style={{ transitionTimingFunction: "cubic-bezier(0.25,0.1,0.25,1)" }}
      />
    </button>
  );
}

function SettingsPage() {
  const { data: settings } = useSuspenseQuery(settingsQueryOptions());
  const { operator } = settings;
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [displayName, setDisplayName] = useState(operator.displayName);
  const [toggles, setToggles] = useState<NotificationPrefs>(settings.notifications);

  const saveMutation = useMutation({
    mutationFn: (input: { displayName?: string; notifications?: NotificationPrefs }) =>
      updateSettings({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  const haltMutation = useMutation({
    mutationFn: () => haltFleet(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fleet"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["instance"] });
    },
  });

  const copy = () => {
    navigator.clipboard?.writeText(operator.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const flip = (k: keyof NotificationPrefs) => {
    const next = { ...toggles, [k]: !toggles[k] };
    setToggles(next);
    saveMutation.mutate({ notifications: next });
  };

  const nameDirty = displayName.trim() !== operator.displayName;

  const notifications: { key: keyof typeof toggles; label: string; desc: string }[] = [
    { key: "attestations", label: "Attestation anchored", desc: "When an IRONCLAD batch lands on Arweave." },
    { key: "settlements", label: "x402 settlements", desc: "When a payment settles for one of your units." },
    { key: "fleetAlerts", label: "Fleet alerts", desc: "Status changes, faults, and low battery." },
    { key: "weeklyDigest", label: "Weekly digest", desc: "A Sunday summary of fleet performance." },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <SectionTag label="Settings" />
        <h1 className="mt-4 font-medium text-gray-900" style={{ fontSize: "clamp(1.5rem,4vw,2.4rem)", letterSpacing: "-0.02em" }}>
          Operator settings
        </h1>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <h2 className="text-[16px] font-medium text-gray-900 mb-5">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-[#ECE81A] flex items-center justify-center text-[20px] font-semibold text-gray-900">
            {displayName.slice(0, 1)}
          </div>
          <div>
            <div className="text-[15px] font-medium text-gray-900">{operator.ens}</div>
            <div className="text-[12px] text-gray-500">Operator since {formatDate(operator.joinedAt)}</div>
          </div>
        </div>
        <label className="block max-w-md">
          <span className="text-[12px] uppercase tracking-wider text-gray-500">Display name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-2 w-full bg-[#F5F5F5] rounded-xl px-4 py-3 text-[14px] text-gray-900 outline-none focus:ring-2 focus:ring-[#ECE81A]"
          />
        </label>
        <button
          onClick={() => saveMutation.mutate({ displayName: displayName.trim() })}
          disabled={!nameDirty || saveMutation.isPending}
          className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium rounded-full bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 transition-colors"
        >
          {saveMutation.isPending ? "Saving…" : "Save profile"}
        </button>
      </div>

      {/* Wallet */}
      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <h2 className="text-[16px] font-medium text-gray-900 mb-5 flex items-center gap-2">
          <Wallet size={16} /> Wallet
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F5F5F5] rounded-xl px-4 py-3">
          <div className="min-w-0">
            <div className="text-[12px] text-gray-500">Connected address</div>
            <div className="text-[14px] font-mono text-gray-900 truncate">{operator.address}</div>
          </div>
          <button
            onClick={copy}
            className="inline-flex items-center gap-2 text-[13px] font-medium rounded-full border border-gray-300 hover:border-gray-900 px-4 py-2 transition-colors self-start shrink-0"
          >
            {copied ? <Check size={14} className="text-gray-900" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[13px] text-gray-600">
          <Globe size={14} />
          Network: <span className="font-medium text-gray-900">Base mainnet</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#ECE81A] ml-1" />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl p-5 sm:p-7">
        <h2 className="text-[16px] font-medium text-gray-900 mb-2">Notifications</h2>
        <div className="flex flex-col">
          {notifications.map((n) => (
            <div key={n.key} className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
              <div>
                <div className="text-[14px] font-medium text-gray-900">{n.label}</div>
                <div className="text-[12px] text-gray-500">{n.desc}</div>
              </div>
              <Toggle on={toggles[n.key]} onClick={() => flip(n.key)} />
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 border border-gray-200">
        <h2 className="text-[16px] font-medium text-gray-900 mb-1">Danger zone</h2>
        <p className="text-[13px] text-gray-500 mb-4">Halting your fleet stops all units and pauses settlement.</p>
        <button
          onClick={() => haltMutation.mutate()}
          disabled={haltMutation.isPending}
          className="inline-flex items-center gap-2 text-[13px] font-medium rounded-full bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 transition-colors"
        >
          {haltMutation.isPending ? "Halting…" : haltMutation.isSuccess ? "Fleet halted" : "Halt entire fleet"}
        </button>
      </div>
    </div>
  );
}
