export function createSelectChain<T>(result: T, terminal: "from" | "limit" | "offset" = "limit") {
  const chain: any = {};

  chain.from = jest.fn(() => (terminal === "from" ? Promise.resolve(result) : chain));
  chain.leftJoin = jest.fn(() => chain);
  chain.where = jest.fn(() => chain);
  chain.orderBy = jest.fn(() => chain);
  chain.limit = jest.fn(() => (terminal === "limit" ? Promise.resolve(result) : chain));
  chain.offset = jest.fn(() => Promise.resolve(result));

  return chain;
}

export function createInsertChain<T>(result: T) {
  const chain: any = {};

  chain.returning = jest.fn(async () => result);
  chain.values = jest.fn(() => chain);

  return chain;
}

export function createUpdateChain<T>(result: T) {
  const chain: any = {};

  chain.returning = jest.fn(async () => result);
  chain.set = jest.fn(() => chain);
  chain.where = jest.fn(() => chain);

  return chain;
}

export function createDeleteChain() {
  return {
    where: jest.fn(async () => undefined),
  };
}

export function jsonRequest(url: string, body: unknown, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");

  return new Request(url, {
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}