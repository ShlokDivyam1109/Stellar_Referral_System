/**
 * useWallet.js
 *
 * Uses @stellar/freighter-api 6.0.1 (latest).
 *
 * Verified API from official docs (docs.freighter.app):
 *   isConnected()   -> { isConnected: boolean, error?: string }
 *   requestAccess() -> { address: string, error?: string }
 *
 * In v2.0.0 isConnected() returned a plain boolean — that's why the old
 * `connectionResult.isConnected` check always gave undefined (falsy) and
 * threw "not installed" even with Freighter present. Upgrading to 6.0.1
 * gives us the object shape the docs actually describe.
 */

import { useState, useCallback } from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      // isConnected() -> { isConnected: boolean, error?: string }
      const connResult = await isConnected();
      if (!connResult.isConnected) {
        throw new Error(
          "Freighter is not installed or not active. Install it from freighter.app, then reload this page."
        );
      }

      // requestAccess() opens the Freighter approval popup
      // -> { address: string, error?: string }
      const accessResult = await requestAccess();
      if (accessResult.error) {
        throw new Error(accessResult.error);
      }
      if (!accessResult.address) {
        throw new Error(
          "No address returned. Make sure you are logged into Freighter and it is set to Testnet."
        );
      }

      setAddress(accessResult.address);
    } catch (err) {
      setError(err.message ?? String(err));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  return {
    address,
    connected: !!address,
    connecting,
    error,
    connect,
    disconnect,
  };
}