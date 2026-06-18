"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import type { Address } from "viem";
import { createSiweMessage } from "viem/siwe";
import { apiPost } from "@/lib/api";
import { meQueryOptions } from "@/lib/queries";
import type { Me } from "@/api/auth";

type SignInArgs = {
  address?: Address;
  chainId?: number;
  redirect?: boolean;
};

export function useAuth() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnectAsync } = useDisconnect();
  const queryClient = useQueryClient();
  const router = useRouter();
  const meQuery = useQuery(meQueryOptions());

  const signIn = useCallback(
    async (args: SignInArgs = {}) => {
      const addr = args.address ?? address;
      const cid = args.chainId ?? chainId;
      if (!addr || !cid) throw new Error("Connect a wallet before signing in.");

      const { nonce } = await apiPost<{ nonce: string }>("/api/auth/nonce");
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
      const user = await apiPost<Me>("/api/auth/verify", { message, signature });

      queryClient.setQueryData(meQueryOptions().queryKey, user);
      if (args.redirect) router.push("/dashboard");
      return user;
    },
    [address, chainId, signMessageAsync, queryClient, router],
  );

  const signOut = useCallback(async () => {
    await apiPost("/api/auth/logout");
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

export const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
