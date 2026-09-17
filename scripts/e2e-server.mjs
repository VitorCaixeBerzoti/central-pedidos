import { createRequire } from "node:module"
import { execFileSync, spawn } from "node:child_process"
import { randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
const require = createRequire(new URL("../backend/package.json", import.meta.url))
require("dotenv").config({
  path: fileURLToPath(new URL("../backend/.env", import.meta.url)),
  quiet: true,
})
const { Pool } = require("pg")
const root = fileURLToPath(new URL("../", import.meta.url))
const backend = fileURLToPath(new URL("../backend/", import.meta.url))
const frontend = fileURLToPath(new URL("../frontend/", import.meta.url))
const originalUrl = process.env.DATABASE_URL
const banco = `orbita_e2e_${randomUUID().replaceAll("-", "")}`
const pool = new Pool({ connectionString: originalUrl })
let created = false
try {
  await pool.query(`CREATE DATABASE "${banco}"`)
  created = true
  mkdirSync(`${root}/artifacts`, { recursive: true })
  writeFileSync(`${root}/artifacts/e2e-database.json`, JSON.stringify({ banco }))
  const url = new URL(originalUrl)
  url.pathname = `/${banco}`
  const env = {
    ...process.env,
    DATABASE_URL: url.toString(),
    NODE_ENV: "test",
    PORT: "3101",
    APP_ORIGIN: "http://localhost:3101",
  }
  execFileSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    cwd: backend,
    env,
    stdio: "inherit",
  })
  execFileSync(process.execPath, ["--import", "tsx", "prisma/seed.ts"], {
    cwd: backend,
    env,
    stdio: "inherit",
  })
  execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "-b"], {
    cwd: frontend,
    stdio: "inherit",
  })
  execFileSync(process.execPath, ["node_modules/vite/bin/vite.js", "build"], {
    cwd: frontend,
    stdio: "inherit",
  })
  const server = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
    cwd: backend,
    env,
    stdio: "inherit",
    windowsHide: true,
  })
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => {
      server.kill()
      process.exit()
    })
  server.on("exit", (code) => process.exit(code ?? 0))
} catch (error) {
  if (created) await pool.query(`DROP DATABASE "${banco}" WITH (FORCE)`)
  throw error
} finally {
  await pool.end()
}
