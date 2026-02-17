import { createRouter, type ServiceRouter } from "@agentcash/router";

let _router: ServiceRouter | undefined;

function getRouter(): ServiceRouter {
  if (!_router) {
    // Lazy import to avoid circular deps and build-time evaluation issues.
    // When SKIP_ENV_VALIDATION is set (e.g. during `next build`), env vars
    // may be undefined — provide a dummy address so the router can initialize.
    const payeeAddress =
      process.env.X402_WALLET_ADDRESS ?? "0x0000000000000000000000000000000000000000";

    _router = createRouter({
      payeeAddress,
      network: "eip155:8453",
    });
  }
  return _router;
}

export const router = new Proxy({} as ServiceRouter, {
  get(_target, prop, receiver) {
    return Reflect.get(getRouter(), prop, receiver);
  },
});
