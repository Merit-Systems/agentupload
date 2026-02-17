import { createRouter, type ServiceRouter } from "@agentcash/router";

let _router: ServiceRouter | undefined;
let _protocols: ("x402" | "mpp")[] | undefined;

function init() {
  if (!_router) {
    const payeeAddress =
      process.env.X402_WALLET_ADDRESS ?? "0x0000000000000000000000000000000000000000";

    const mppSecretKey = process.env.MPP_SECRET_KEY;
    const mppCurrency = process.env.MPP_CURRENCY;
    const hasMpp = !!(mppSecretKey && mppCurrency);

    _protocols = hasMpp ? ["x402", "mpp"] : ["x402"];

    _router = createRouter({
      payeeAddress,
      network: "eip155:8453",
      protocols: _protocols,
      ...(hasMpp && {
        mpp: {
          secretKey: mppSecretKey,
          currency: mppCurrency,
          recipient: process.env.MPP_RECIPIENT,
          rpcUrl: process.env.TEMPO_RPC_URL,
        },
      }),
    });
  }
  return { router: _router, protocols: _protocols! };
}

export const router = new Proxy({} as ServiceRouter, {
  get(_target, prop, receiver) {
    return Reflect.get(init().router, prop, receiver);
  },
});

/** Resolved protocols for use in route-level .paid() options. */
export function getProtocols() {
  return init().protocols;
}
