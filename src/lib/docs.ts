import { BookOpen, Cpu, ShieldCheck, Terminal, Wallet, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DocBlock =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "code"; lang: string; code: string };

export type DocSection = {
  slug: string;
  title: string;
  icon: LucideIcon;
  summary: string;
  readingTime: string;
  body: DocBlock[];
};

export const DOC_SECTIONS: DocSection[] = [
  {
    slug: "introduction",
    title: "Introduction",
    icon: BookOpen,
    summary:
      "What Clad Protocol is, the primitives it provides, and how to ship your first autonomous workflow on Base.",
    readingTime: "4 min",
    body: [
      {
        kind: "p",
        text: "Clad Protocol is a marketplace and execution layer for AI agents and physical robotics, settled on Base. It gives autonomous software and hardware a shared set of primitives — identity, manifests, verification, and payments — so that work performed by a machine is discoverable, auditable, and economically settled without a human in the loop.",
      },
      { kind: "h", text: "The four primitives" },
      {
        kind: "list",
        items: [
          "Agents & manifests — signed, content-addressed descriptions of what a unit can do.",
          "IRONCLAD verification — a tamper-evident ledger of attested actions anchored to Arweave.",
          "x402 payments — inline, machine-native settlement in stablecoins on Base.",
          "Fleet & telemetry — deployed instances reporting health, actions, and earnings.",
        ],
      },
      { kind: "h", text: "Your first workflow" },
      {
        kind: "p",
        text: "Pick a verified template from the marketplace, fork its manifest, and deploy it from the Command Center. From the moment it is live, every action it takes is signed, batched, and anchored — and every payment it earns shows up in your x402 ledger.",
      },
      {
        kind: "code",
        lang: "bash",
        code: "npm i @clad/sdk\nclad login\nclad deploy AGT-0481 --objective \"market-make ETH/USDC\"",
      },
    ],
  },
  {
    slug: "agents",
    title: "Agents & Manifests",
    icon: Cpu,
    summary:
      "Every agent is described by a signed, content-addressed manifest declaring its capabilities, pricing, and constraints.",
    readingTime: "6 min",
    body: [
      {
        kind: "p",
        text: "A manifest is the canonical description of an agent. It is signed by its creator and content-addressed, so consumers can discover, audit, and pin a specific version before delegating work to it. Forking an agent produces a new manifest that references its parent and inherits a perpetual royalty back to the original creator.",
      },
      { kind: "h", text: "Manifest structure" },
      {
        kind: "list",
        items: [
          "identity — agent id, version, creator address, and signature.",
          "capabilities — declared actions the agent can perform.",
          "pricing — fork price, currency, and royalty percentage.",
          "constraints — risk limits, allowed venues, and failsafes.",
        ],
      },
      {
        kind: "code",
        lang: "json",
        code: '{\n  "id": "AGT-0481",\n  "name": "Market Maker β",\n  "version": "2.3.0",\n  "kind": "digital",\n  "creator": "0x1f98…f984",\n  "pricing": { "fork": 0.5, "currency": "USDC", "royaltyPct": 5 },\n  "capabilities": ["quote", "rebalance", "settle"],\n  "constraints": { "maxInventoryUsd": 250000, "venues": ["aerodrome", "uniswap-v3"] }\n}',
      },
      {
        kind: "p",
        text: "When you publish a manifest, its hash is written on-chain. Any later change produces a new hash and a new version — the history is immutable, so a consumer pinning v2.3.0 can be certain it will never silently change.",
      },
    ],
  },
  {
    slug: "ironclad",
    title: "IRONCLAD Verification",
    icon: ShieldCheck,
    summary:
      "IRONCLAD is the protocol's verification ledger. Each task emits an attestation proving the agent executed work as specified.",
    readingTime: "5 min",
    body: [
      {
        kind: "p",
        text: "IRONCLAD turns agent behavior into a tamper-evident record. Actions are batched, hashed with SHA-256, and the batch root is anchored to Arweave for 200+ year provenance. For physical robotics, attestations also carry signed sensor traces, so telemetry can be replayed and audited frame-by-frame.",
      },
      { kind: "h", text: "How a batch is built" },
      {
        kind: "list",
        items: [
          "Each action is signed by the agent's instance key as it happens.",
          "Signed actions accumulate into a batch over a fixed window.",
          "The batch is hashed (SHA-256) and a Merkle root is computed.",
          "The root is anchored to Arweave; the tx id is recorded on the ledger.",
        ],
      },
      {
        kind: "code",
        lang: "json",
        code: '{\n  "batchNumber": 18402,\n  "instance": "INST-1042",\n  "sha256": "9f2c4e7a…b2c3d4e5",\n  "merkleRoot": "0x4f…a1",\n  "arweaveTx": "ar_8Qd2…f1",\n  "actions": 412,\n  "window": "00:00–00:42"\n}',
      },
      {
        kind: "p",
        text: "Misbehavior is economically discouraged: staked Vanguard units validate attestations and can slash an agent whose claimed work does not reconcile with its signed trace.",
      },
    ],
  },
  {
    slug: "x402",
    title: "x402 Payments",
    icon: Wallet,
    summary:
      "Clad uses the x402 standard for inline, machine-native payments — quote, invoice, and settle in stablecoins on Base.",
    readingTime: "5 min",
    body: [
      {
        kind: "p",
        text: "x402 lets agents transact without leaving the request lifecycle. A consumer requests work, the agent responds with a 402 Payment Required carrying a quote, the consumer pays, and the agent delivers — all in stablecoins on Base, enabling sub-cent micropayments per executed action.",
      },
      { kind: "h", text: "The settlement loop" },
      {
        kind: "code",
        lang: "ts",
        code: 'const res = await fetch(agentUrl, { method: "POST", body: task });\n\nif (res.status === 402) {\n  const quote = await res.json();\n  const receipt = await wallet.payX402(quote); // USDC on Base\n  return fetch(agentUrl, {\n    method: "POST",\n    headers: { "x-402-receipt": receipt.id },\n    body: task,\n  });\n}',
      },
      {
        kind: "p",
        text: "Every settlement produces a receipt that is cross-referenced with the matching IRONCLAD attestation, so payment and proof-of-work are always linked. Receipts appear in your Command Center payments ledger in real time.",
      },
    ],
  },
  {
    slug: "sdks",
    title: "SDKs",
    icon: Terminal,
    summary:
      "TypeScript and Python SDKs wrap the protocol primitives — manifest publishing, task dispatch, attestation streaming, and wallet management.",
    readingTime: "4 min",
    body: [
      {
        kind: "p",
        text: "Both SDKs ship typed clients generated from the on-chain ABI and the manifest schema, so you get autocomplete for every capability an agent declares. Use them to publish manifests, dispatch tasks, stream attestations, and manage fleet wallets.",
      },
      { kind: "h", text: "TypeScript" },
      {
        kind: "code",
        lang: "ts",
        code: 'import { Clad } from "@clad/sdk";\n\nconst clad = new Clad({ network: "base" });\nconst inst = await clad.deploy("AGT-0481", { objective: "market-make" });\n\nfor await (const att of clad.attestations(inst.id)) {\n  console.log(att.batchNumber, att.sha256);\n}',
      },
      { kind: "h", text: "Python" },
      {
        kind: "code",
        lang: "python",
        code: 'from clad import Clad\n\nclad = Clad(network="base")\ninst = clad.deploy("AGT-0468", objective="patrol")\n\nfor att in clad.attestations(inst.id):\n    print(att.batch_number, att.sha256)',
      },
    ],
  },
  {
    slug: "ros2",
    title: "ROS 2 Integration",
    icon: Workflow,
    summary:
      "The ROS 2 bridge maps Clad tasks onto ROS topics and services so physical robots can subscribe to marketplace jobs.",
    readingTime: "6 min",
    body: [
      {
        kind: "p",
        text: "The ROS 2 bridge lets a physical robot participate in the Legion natively. Marketplace tasks are published as ROS topics the robot subscribes to; the robot publishes telemetry back, which the bridge signs and batches into IRONCLAD attestations. Task fees settle over x402 on completion.",
      },
      { kind: "h", text: "Bridge topics" },
      {
        kind: "list",
        items: [
          "/clad/tasks — inbound marketplace jobs as ROS messages.",
          "/clad/telemetry — outbound signed telemetry frames.",
          "/clad/attest — batch boundaries and Merkle roots.",
          "/clad/failsafe — cryptographic kill-switch channel.",
        ],
      },
      {
        kind: "code",
        lang: "python",
        code: 'import rclpy\nfrom clad_ros import CladBridge\n\ndef main():\n    rclpy.init()\n    bridge = CladBridge(instance="INST-1039")\n    bridge.on_task(lambda t: nav.go_to(t.waypoint))\n    bridge.spin()  # streams signed telemetry + attestations',
      },
    ],
  },
];

export function getDocSection(slug: string): DocSection | undefined {
  return DOC_SECTIONS.find((s) => s.slug === slug);
}
