// components/WalletConnector.tsx
"use client";

import React, { useEffect, useState } from "react";
import { web3Enable, web3Accounts } from "@polkadot/extension-dapp";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wallet } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function WalletConnector() {
  const [open, setOpen] = useState(false);
  const [extensions, setExtensions] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<{ address: string; name?: string }[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [api, setApi] = useState<ApiPromise | null>(null);

  // detect injected extensions on mount
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).injectedWeb3) {
      setExtensions(Object.keys((window as any).injectedWeb3));
    }
  }, []);

  // initialize Polkadot API once
  useEffect(() => {
    const init = async () => {
      const provider = new WsProvider("wss://rpc.polkadot.io");
      const _api = await ApiPromise.create({ provider });
      setApi(_api);
    };
    init();
  }, []);

  // subscribe to balance changes whenever `selected` or `api` changes
  useEffect(() => {
    if (selected && api) {
      let unsubscribe: () => void;
      api.query.system
        .account(selected, ({ data: { free } }) => {
          setBalance(free.toHuman());
        })
        .then((u) => (unsubscribe = u))
        .catch(console.error);
      return () => unsubscribe?.();
    }
  }, [selected, api]);

  // connect to extension and load accounts
  const connectWallet = async () => {
    await web3Enable("SmarTrust");
    const all = await web3Accounts();
    setAccounts(all);
    if (all.length > 0) {
      setSelected(all[0].address);
    }
  };

  // clear all local wallet state
  const disconnectWallet = () => {
    setAccounts([]);
    setSelected("");
    setBalance("");
  };

  // installation links for missing
  const installUrls: Record<string, string> = {
    talisman: "https://talisman.xyz/",
    "subwallet-js": "https://subwallet.app/",
    "polkadot-js": "https://polkadot.js.org/extension/",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open wallet connector">
          <Wallet />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Wallets ({accounts.length} connected)</DialogTitle>
          <DialogDescription>
            Select a wallet to connect to your account. If you don’t have one installed,
            you can install it below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {/* Show detected extensions and Connect/Disconnect */}
          {extensions.map((ext) => (
            <div key={ext} className="flex justify-between items-center">
              <span className="capitalize">{ext.replace(/-js$/, "")}</span>
              {accounts.length > 0 ? (
                <Button size="sm" variant="destructive" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={connectWallet}>
                  Connect
                </Button>
              )}
            </div>
          ))}

          {/* Offer install links for extensions not detected */}
          {["talisman", "subwallet-js", "polkadot-js"]
            .filter((id) => !extensions.includes(id))
            .map((id) => (
              <div key={id} className="flex justify-between items-center">
                <span className="capitalize">{id.replace(/-js$/, "")}</span>
                <Button size="sm" variant="link" asChild>
                  <a href={installUrls[id]} target="_blank" rel="noreferrer">
                    Install
                  </a>
                </Button>
              </div>
            ))}
        </div>

        {accounts.length > 0 && (
          <>
            <Separator className="my-4" />

            <Label htmlFor="account-select">Free Balance on Polkadot</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger id="account-select">
                <SelectValue placeholder="Select an Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.address} value={a.address}>
                    {a.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="mt-2 text-lg font-medium">{balance || "Loading…"} </p>
          </>
        )}

        <DialogFooter className="flex flex-col space-y-2">
          {/* Disconnect button here too, if you want quick access */}
          {accounts.length > 0 && (
            <Button variant="destructive" onClick={disconnectWallet} className="w-full">
              Disconnect All
            </Button>
          )}
          <Button onClick={() => setOpen(false)} className="w-full">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
