import React from "react";
import { connectMetaMaskWallet, Discovered } from "../../config/wallet";
import truncateEthAddress from "truncate-eth-address";

interface WalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: Discovered[];
  address?: string;
  onConnected: (accounts: string[]) => void;
  isConnected?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  providers,
  onConnected,
  address,
  isConnected,
}: WalletsModalProps) {
  if (!isOpen) return null; // Don't render if not open

  const handleConnectWallet = async () => {
    try {
      const { accounts } = await connectMetaMaskWallet();
      onConnected(accounts);
      onClose();
    } catch (e) {
      console.error(e);
      alert((e as Error).message); // or render nicely in UI
    }
  };

  console.log(providers);

  const filteredProviders = providers
    .filter((provider) => provider.info)
    .filter((provider) => provider.info?.name === "MetaMask");

  if (providers)
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg max-w-md w-full relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
          <div className="p-2">
            <h3 className="pb-4 text-xl font-bold">Available Wallets</h3>
            <ul>
              {filteredProviders.length === 0 ? (
                <div className="text-center">
                  MetaMask not installed. You can download it from:
                  <div className="pt-4">
                    <a
                      className="hover:underline text-blue-500 hover:text-blue-400 font-bold"
                      href="https://metamask.io/en-GB"
                      target="_blank"
                    >
                      https://metamask.io/en-GB
                    </a>
                  </div>
                </div>
              ) : (
                filteredProviders.map((provider) => (
                  <li
                    key={provider.info?.uuid}
                    className="flex justify-between"
                  >
                    <div className="pr-2 flex align-center">
                      <svg height="40" width="40">
                        <image xlinkHref={provider.info?.icon} />
                      </svg>
                      <div className="pl-2">
                        <span className="font-bold">{provider.info?.name}</span>
                        {address && (
                          <div className="text-xs">
                            {truncateEthAddress(address)}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleConnectWallet}
                      className="py-1 px-2 bg-green-500 disabled:bg-gray-300 rounded-md text-white font-bold"
                      disabled={isConnected}
                    >
                      {isConnected ? "Connected" : "Connect"}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    );
}
