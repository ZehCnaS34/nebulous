import { createServer, plugins, Server, RequestHandlerType } from "restify";
import * as dgram from "dgram";

type ServiceAdvertisement = {
  name: string;
  host: string;
  port: number;
  endpoints: string[];
};

type ServiceComm = ServiceAdvertisement;

const PORT = 20000;
const MULTICAST_ADDR = "233.255.255.255";
const SERVICE_PORT = parseInt(
  `3${Math.floor(Math.random() * 9)}3${Math.floor(Math.random() * 9)}`
);

class Service {
  server: Server;
  endpoints: string[];
  beacon: dgram.Socket | null;

  static parseMessage(buffer: Buffer): ServiceComm {
    return JSON.parse(buffer.toString());
  }

  static packMessage(comm: ServiceComm): Buffer {
    return Buffer.from(JSON.stringify(comm));
  }

  constructor(private name: string) {
    this.server = createServer();
    this.endpoints = [];
    this.beacon = null;
    this.expose();
  }

  expose() {
    this.beacon = dgram.createSocket({ type: "udp4", reuseAddr: true });
    this.beacon.bind(PORT);

    const handle = setInterval(() => {
      if (!this.beacon) return;

      let message = Service.packMessage({
        name: this.name,
        endpoints: this.endpoints,
        host: "0.0.0.0",
        port: SERVICE_PORT
      });

      this.beacon.send(message, 0, message.length, PORT, MULTICAST_ADDR);
    }, 2500);

    this.beacon.on("listening", () => {
      if (!this.beacon) return;
      this.beacon.addMembership(MULTICAST_ADDR);
    });

    this.beacon.on("message", (message, rinfo) => {
      const payload = Service.parseMessage(message);
      console.log("->", payload);
    });
  }

  start() {
    this.server.use(plugins.bodyParser());

    this.server.listen(SERVICE_PORT, () => {
      console.log("Listening on ", SERVICE_PORT);
    });
  }

  register(path: string, handler: RequestHandlerType) {
    this.endpoints.push(path);
    this.server.get(path, handler);
  }
}

export { Service };
