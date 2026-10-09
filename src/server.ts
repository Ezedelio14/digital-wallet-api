import "dotenv/config";
import { app } from "./app.js";

const port = Number(process.env.PORT) || 3333;

app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`🚀 Digital Wallet API active at http://localhost:${port}`);
  console.log(
    `📚 OpenAPI / Swagger UI interactive docs at http://localhost:${port}/docs`,
  );
});
