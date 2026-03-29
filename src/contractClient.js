import {
  Contract,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import { CONTRACT_ID, RPC_URL, NETWORK_PASSPHRASE } from "./constants.js";

function getServer() {
  return new SorobanRpc.Server(RPC_URL, { allowHttp: false });
}

function getContract() {
  return new Contract(CONTRACT_ID);
}

async function simulateRead(method, args = [], signerAddress) {
  const server = getServer();
  const contract = getContract();
  const sourceAccount = await server.getAccount(signerAddress);
  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();
  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation error: ${simResult.error}`);
  }
  const returnVal = simResult.result?.retval;
  if (!returnVal) return null;
  return scValToNative(returnVal);
}

async function invokeContract(method, args, signerAddress) {
  console.log("=== invokeContract called ===");
  console.log("Method:", method);
  console.log("Signer:", signerAddress);

  const server = getServer();
  const contract = getContract();
  const sourceAccount = await server.getAccount(signerAddress);

  let tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  console.log("Sim status:", simResult.error ?? "OK");
  console.log("Sim auth entries:", simResult.result?.auth);

  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation error: ${simResult.error}`);
  }

  let assembledTx;
  try {
    assembledTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  } catch (e) {
    throw new Error(`assembleTransaction failed: ${e.message}`);
  }

  console.log("Assembled TX XDR:", assembledTx.toXDR());

  const signResult = await signTransaction(assembledTx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: signerAddress,
  });

  console.log("Sign result:", signResult);

  if (signResult.error) {
    throw new Error(
      typeof signResult.error === "string"
        ? signResult.error
        : signResult.error.message ?? "Signing failed or user rejected."
    );
  }

  if (!signResult.signedTxXdr) {
    throw new Error("signedTxXdr is missing — did user reject?");
  }

  const signedTx = TransactionBuilder.fromXDR(
    signResult.signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const sendResult = await server.sendTransaction(signedTx);
  console.log("Send result:", sendResult);

  if (sendResult.status === "ERROR") {
    throw new Error(`Send failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  const hash = sendResult.hash;
  console.log("TX Hash:", hash);

  let getResult;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      getResult = await server.getTransaction(hash);
      console.log(`Poll ${i}: status =`, getResult.status);
    } catch (e) {
      console.warn(`Poll ${i}: SDK XDR decode bug — fetching raw RPC...`);

      try {
        const raw = await fetch(RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTransaction",
            params: { hash },
          }),
        });
        const json = await raw.json();
        console.log("Raw RPC response status:", json?.result?.status);

        const diagEvents = json?.result?.diagnosticEventsXdr;
        console.log("diagEvents count:", diagEvents?.length);

        if (diagEvents && diagEvents.length >= 2) {
          const fnReturnEvent = xdr.DiagnosticEvent.fromXDR(diagEvents[1], "base64");
          const eventBody = fnReturnEvent.event().body().v0();
          const dataVal = eventBody.data();
          console.log("dataVal switch:", dataVal.switch().name);

          if (dataVal.switch().name === "scvVoid") {
            console.log("✅ void return — tx succeeded");
            return { hash, referralId: null };
          }

          const referralId = scValToNative(dataVal).toString();
          console.log("✅ Referral ID:", referralId);
          return { hash, referralId };
        }

        if (json?.result?.status === "SUCCESS") {
          return { hash, referralId: null };
        }
      } catch (e2) {
        console.warn("Raw decode also failed:", e2.message);
      }

      return { hash, referralId: null };
    }

    if (getResult.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      return { hash, referralId: null };
    }
    if (getResult.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Transaction failed on-chain: ${JSON.stringify(getResult)}`);
    }
  }

  throw new Error(`Transaction timed out`);
}

export async function registerReferral(referrerAddress, referredAddress) {
  const result = await invokeContract(
    "register_referral",
    [
      nativeToScVal(referrerAddress, { type: "address" }),
      nativeToScVal(referredAddress, { type: "address" }),
    ],
    referredAddress
  );
  return result;
}

export async function claimReward(referralId, signerAddress) {
  return invokeContract(
    "claim_reward",
    [nativeToScVal(Number(referralId), { type: "u64" })],
    signerAddress
  );
}

export async function viewReferral(referralId, signerAddress) {
  return simulateRead(
    "view_referral",
    [nativeToScVal(Number(referralId), { type: "u64" })],
    signerAddress
  );
}

export async function viewBalance(userAddress, signerAddress) {
  return simulateRead(
    "view_balance",
    [nativeToScVal(userAddress, { type: "address" })],
    signerAddress
  );
}

export async function viewStats(signerAddress) {
  return simulateRead("view_stats", [], signerAddress);
}