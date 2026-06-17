import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import type { Address } from "viem";
import { createSiweMessage } from "viem/siwe";
import { getNonce, logout, verifySiwe } from "@/api/auth";
import { meQueryOptions } from "@/lib/queries";

type SignInArgs = {
  /** Override the connected account (e.g. the result of a fresh connectAsync). */
  address?: Address;
  chainId?: number;
  /** Navigate to the Command Center on success. */
  redirect?: boolean;
};

/**
 * Wallet + session state for the UI. `signIn` runs the full SIWE handshake
 * (nonce → sign → verify) and seeds the `me` cache; `signOut` clears both the
 * server session and the wagmi connection.
 */
export function useAuth() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnectAsync } = useDisconnect();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const meQuery = useQuery(meQueryOptions());

  const signIn = useCallback(
    async (args: SignInArgs = {}) => {
      const addr = args.address ?? address;
      const cid = args.chainId ?? chainId;
      if (!addr || !cid) throw new Error("Connect a wallet before signing in.");

      const { nonce } = await getNonce();
      const message = createSiweMessage({
        address: addr,
        chainId: cid,
        domain: window.location.host,
        uri: window.location.origin,
        nonce,
        version: "1",
        statement: "Sign in to Clad Protocol to access your Command Center.",
        issuedAt: new Date(),
      });
      const signature = await signMessageAsync({ message });
      const user = await verifySiwe({ data: { message, signature } });

      queryClient.setQueryData(meQueryOptions().queryKey, user);
      if (args.redirect) navigate({ to: "/dashboard" });
      return user;
    },
    [address, chainId, signMessageAsync, queryClient, navigate],
  );

  const signOut = useCallback(async () => {
    await logout();
    await disconnectAsync().catch(() => undefined);
    queryClient.setQueryData(meQueryOptions().queryKey, null);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  }, [disconnectAsync, queryClient]);

  return {
    address,
    isConnected,
    user: meQuery.data ?? null,
    isAuthenticated: Boolean(meQuery.data),
    isLoading: meQuery.isLoading,
    signIn,
    signOut,
  };
}

/** Truncate an address for display: 0x1234…cdef. */
export const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
