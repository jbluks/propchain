// wallet.ts
type Eip1193Provider = {
  request: <T = unknown>(args: { method: string; params?: unknown[] | object }) => Promise<T>;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
  isPhantom?: boolean;
  providers?: Eip1193Provider[]; // some wallets expose a list
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export type Discovered = { provider: Eip1193Provider; info?: { rdns?: string; uuid?: string; name?: string } };

export async function discoverProviders(timeoutMs = 200): Promise<Discovered[]> {
  const found: Discovered[] = [];

  // EIP-6963 discovery
  const onAnnounce = (e: Event) => {
    const ev = e as CustomEvent;
    const detail = ev.detail as { provider: Eip1193Provider; info: { rdns?: string; uuid?: string; name?: string } };
    found.push({ provider: detail.provider, info: detail.info });
  };
  window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  // wait briefly for providers to announce
  await new Promise((r) => setTimeout(r, timeoutMs));
  window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);

  // Legacy injection (single or multiplexed)
  const eth = window.ethereum as Eip1193Provider | undefined;
  if (eth) {
    if ((eth as any).providers?.length) {
      for (const p of (eth as any).providers as Eip1193Provider[]) {
        found.push({ provider: p, info: undefined });
      }
    } else {
      found.push({ provider: eth, info: undefined });
    }
  }

  return found;
}

export async function getMetaMaskProvider(): Promise<Eip1193Provider | null> {
  const providers = await discoverProviders();
  // Prefer provider that declares MetaMask
  const mm =
    providers.find((p) => p.provider.isMetaMask && !p.provider.isPhantom) ??
    // Some wallets supply rdns info via EIP-6963
    providers.find((p) => p.info?.rdns === "io.metamask") ??
    null;

  return mm?.provider ?? null;
}

export async function connectMetaMaskWallet() {
  const provider = await getMetaMaskProvider();

  if (!provider) {
    throw new Error("MetaMask provider not found. If you have multiple wallets, disable others or open MetaMask.");
  }

  // Request accounts (must be from a user gesture)
  try {
    const accounts = await provider.request<string[]>({ method: "eth_requestAccounts" });
    const chainId = await provider.request<string>({ method: "eth_chainId" });

    return { provider, accounts, chainId };
  } catch (err: any) {
    console.log(err)
    // Standard EIP-1193 error handling
    if (err?.code === -32002) {
      throw new Error("A connection request is already pending in MetaMask. Please open the extension and complete it.");
    }
    if (err?.code === 4001) {
      throw new Error("Request rejected in MetaMask.");
    }
    // Surface original message when unknown
    throw new Error(err?.message || "Failed to connect wallet.");
  }
}