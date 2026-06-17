"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Loader2, Wallet } from "lucide-react";
import { useConnect } from "wagmi";
import type { Connector } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

type OpenOptions = { redirect?: boolean };
type WalletModalContextValue = { open: (opts?: OpenOptions) => void; close: () => void };

const WalletModalContext = createContext<WalletModalContextValue | null>(null);

export function useWalletModal(): WalletModalContextValue {
  const ctx = useContext(WalletModalContext);
  if (!ctx) throw new Error("useWalletModal must be used within <WalletModalProvider>");
  return ctx;
}

/**
 * Mounts a single connect-wallet modal and exposes `open()`/`close()` through
 * context so any button (hero, header, CTA) can trigger the connect → SIWE flow
 * while keeping its own styling. On a successful connect it signs the operator
 * in and optionally routes to the Command Center.
 */
export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { connectors, connectAsync } = useConnect();
  const { signIn } = useAuth();

  const open = useCallback((opts?: OpenOptions) => {
    setRedirect(Boolean(opts?.redirect));
    setError(null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPendingId(null);
  }, []);

  const handleConnect = useCallback(
    async (connector: Connector) => {
      setError(null);
      setPendingId(connector.uid);
      try {
        const result = await connectAsync({ connector });
        await signIn({ address: result.accounts[0], chainId: result.chainId, redirect });
        setIsOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not connect. Please try again.");
      } finally {
        setPendingId(null);
      }
    },
    [connectAsync, signIn, redirect],
  );

  const value = useMemo<WalletModalContextValue>(() => ({ open, close }), [open, close]);

  // De-dupe connectors that report the same name (e.g. multiple injected).
  const seen = new Set<string>();
  const options = connectors.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  return (
    <WalletModalContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={(o) => (o ? setIsOpen(true) : close())}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet size={18} /> Connect wallet
            </DialogTitle>
            <DialogDescription>
              Sign in with your wallet to access the Command Center. You'll be asked to sign a
              message — this is free and never moves funds.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex flex-col gap-2">
            {options.map((connector) => {
              const pending = pendingId === connector.uid;
              return (
                <button
                  key={connector.uid}
                  onClick={() => handleConnect(connector)}
                  disabled={pendingId !== null}
                  className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-gray-900 disabled:opacity-60"
                >
                  <span className="flex items-center gap-3">
                    {connector.icon ? (
                      <img src={connector.icon} alt="" className="h-6 w-6 rounded-md" />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100">
                        <Wallet size={14} className="text-gray-700" />
                      </span>
                    )}
                    <span className="text-[14px] font-medium text-gray-900">{connector.name}</span>
                  </span>
                  {pending && <Loader2 size={16} className="animate-spin text-gray-500" />}
                </button>
              );
            })}
            {options.length === 0 && (
              <p className="text-[13px] text-gray-500">
                No wallet detected. Install MetaMask or another browser wallet to continue.
              </p>
            )}
          </div>

          {error && <p className="mt-1 text-[13px] text-red-600">{error}</p>}
        </DialogContent>
      </Dialog>
    </WalletModalContext.Provider>
  );
}
