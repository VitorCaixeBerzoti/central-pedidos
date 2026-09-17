import "dotenv/config"
import { app } from "./app.js"
import { prisma } from "./lib/prisma.js"

const port = Number(process.env.PORT ?? 3000)
const server = app.listen(port, () => console.log(`Órbita disponível em http://localhost:${port}`))
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    server.close(() => {
      void prisma.$disconnect().then(() => process.exit(0))
    })
  })
}
