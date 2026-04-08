import type { FastifyInstance, FastifyRequest } from "fastify";
import WebSocket from "ws";

type WsQuery = {
  token_ids?: string;
  token_id?: string;
};

const parseTokenIds = (req: FastifyRequest): string[] => {
  const query = req.query as WsQuery | undefined;
  const raw = query?.token_ids ?? query?.token_id ?? "";
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const CLOB_WS_URL = "wss://ws-subscriptions-clob.polymarket.com/ws/market";

export async function wsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/ws/orderbook", { websocket: true }, (connection, req) => {
    const tokenIds = parseTokenIds(req);
    const upstream = new WebSocket(CLOB_WS_URL);

    const sendSubscribe = () => {
      if (!tokenIds.length) return;
      upstream.send(
        JSON.stringify({
          assets_ids: tokenIds,
          type: "market",
          custom_feature_enabled: true
        })
      );
    };

    const pingInterval = setInterval(() => {
      if (upstream.readyState === WebSocket.OPEN) {
        upstream.send("PING");
      }
    }, 10000);

    upstream.on("open", () => {
      sendSubscribe();
    });

    upstream.on("message", (data) => {
      if (connection.socket.readyState === connection.socket.OPEN) {
        connection.socket.send(data.toString());
      }
    });

    upstream.on("close", () => {
      if (connection.socket.readyState === connection.socket.OPEN) {
        connection.socket.close();
      }
    });

    upstream.on("error", () => {
      if (connection.socket.readyState === connection.socket.OPEN) {
        connection.socket.close();
      }
    });

    connection.socket.on("close", () => {
      clearInterval(pingInterval);
      if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
        upstream.close();
      }
    });
  });
}
