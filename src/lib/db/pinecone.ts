import { Pinecone } from "@pinecone-database/pinecone";
import dns from "node:dns";
import https from "node:https";
import fetch, { type RequestInit, type RequestInfo } from "node-fetch";

const apiKey = process.env.PINECONE_API_KEY;

const isPineconeEnabled =
  Boolean(apiKey) && process.env.PINECONE_DISABLED !== "true";

const environment = process.env.PINECONE_ENVIRONMENT || "gcp-starter";
const projectId = process.env.PINECONE_PROJECT_ID;
const indexName = process.env.PINECONE_INDEX_NAME || "nextjs-ai-note-app";

type PineconeIndex = ReturnType<Pinecone["Index"]>;

let notesIndex: PineconeIndex | null = null;

if (isPineconeEnabled && apiKey) {
  let dnsIndex = 0;
  const agent = new https.Agent({
    lookup: (hostname, options, callback) => {
      const wantsAll =
        typeof options === "object" && options !== null && "all" in options
          ? Boolean(options.all)
          : false;
      const callbackAll = callback as (
        error: NodeJS.ErrnoException | null,
        addresses: dns.LookupAddress[],
      ) => void;
      const callbackOne = callback as unknown as (
        error: NodeJS.ErrnoException | null,
        address: string,
        family: number,
      ) => void;

      dns.resolve4(hostname, (error, addresses) => {
        if (error || !addresses.length) {
          if (wantsAll) {
            callbackAll(error ?? new Error("No DNS records found"), []);
          } else {
            callbackOne(error ?? new Error("No DNS records found"), "", 4);
          }
          return;
        }

        if (wantsAll) {
          callbackAll(
            null,
            addresses.map((address) => ({ address, family: 4 })),
          );
          return;
        }

        const address = addresses[dnsIndex % addresses.length];
        dnsIndex += 1;
        callbackOne(null, address, 4);
      });
    },
  });

  const pineconeFetch = (url: RequestInfo, init?: RequestInit) => {
    return fetch(url, { ...init, agent });
  };

  const pinecone = new Pinecone({
    environment,
    apiKey,
    ...(projectId ? { projectId } : {}),
    fetchApi: pineconeFetch as unknown as typeof globalThis.fetch,
  });

  notesIndex = pinecone.Index(indexName);
}

export { isPineconeEnabled, notesIndex };
