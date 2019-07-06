import { createServer, plugins, Server, RequestHandlerType } from "restify";
import * as dgram from "dgram";
import * as jwt from "jsonwebtoken";
import axios from "axios";

type ServiceAdvertisement = {
  name: string;
  host: string;
  port: number;
  endpoints: string[];
};

type ServiceComm = ServiceAdvertisement;

type Payload = {
  [key: string]: any;
};

type Response = {
  [key: string]: any;
};

type Caller = (
  serviceName: string,
  methodName: string,
  payload: Payload
) => Response;

type Responder = (call: Caller, payload: Payload) => Response;

const PORT = 20000;
const MULTICAST_ADDR = "233.255.255.255";
const SERVICE_PORT = parseInt(
  `3${Math.floor(Math.random() * 9)}3${Math.floor(Math.random() * 9)}`
);

class Service {
  server: Server;
  endpoints: { [name: string]: Responder };
  services: { [serviceName: string]: ServiceAdvertisement };
  beacon: dgram.Socket;

  static parseMessage(buffer: Buffer): ServiceComm {
    return JSON.parse(buffer.toString());
  }

  static packMessage(comm: ServiceComm): Buffer {
    return Buffer.from(JSON.stringify(comm));
  }

  constructor(private name: string, private port?: number) {
    this.beacon = dgram.createSocket({ type: "udp4", reuseAddr: true });
    this.server = createServer();
    this.server.use(plugins.bodyParser());
    this.server.post("/", async (req, res) => {
      const { method, payload } = req.body;
      const caller = async (
        serviceName: string,
        methodName: string,
        payload: Payload
      ) => {
        let service = this.services[serviceName];
        if (!service) throw new Error("Service Unavailable");
        return await axios
          .post(`http://${service.host}:${service.port}/`, {
            method: methodName,
            payload
          })
          .then(response => {
            return response.data;
          });
      };
      const endpoint = this.endpoints[method];
      if (!endpoint) {
        console.log({ method, payload });
        return res.json({
          error: true,
          message: `Method ${method} does not exist.`
        });
      }
      const response = await this.endpoints[method](caller, payload);
      res.json(response);
    });
    this.endpoints = {};
    this.services = {};
    this.expose();
  }

  expose() {
    this.beacon.bind(PORT);

    const handle = setInterval(() => {
      if (!this.beacon) return;

      let message = Service.packMessage({
        name: this.name,
        endpoints: Object.keys(this.endpoints),
        host: "0.0.0.0",
        port: this.port || SERVICE_PORT
      });

      this.beacon.send(message, 0, message.length, PORT, MULTICAST_ADDR);
    }, 2500);

    this.beacon
      .on("listening", () => {
        if (!this.beacon) return;
        this.beacon.addMembership(MULTICAST_ADDR);
      })
      .on("error", error => {
        console.error(error);
      })
      .on("message", (message, rinfo) => {
        const payload = Service.parseMessage(message);
        if (payload.name === this.name) return;
        if (!this.services[payload.name]) console.log(`->[${payload.name}]<-${payload.host}:${payload.port}`);
        this.services[payload.name] = payload;
      });
  }

  start(): Service {
    this.server.use(plugins.bodyParser());

    this.server.listen(this.port || SERVICE_PORT, () => {
      console.log("Listening on ", this.port || SERVICE_PORT);
    });

    return this;
  }

  register(name: string, handler: Responder): Service {
    this.endpoints[name] = handler;
    return this;
  }
}

export { Service };
