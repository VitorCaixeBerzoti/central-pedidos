import { createRequire } from "node:module"
import { readFileSync, unlinkSync } from "node:fs"
import { fileURLToPath } from "node:url"
const require = createRequire(new URL("../backend/package.json", import.meta.url))
export default async function teardown() {
  require("dotenv").config({
    path: fileURLToPath(new URL("../backend/.env", import.meta.url)),
    quiet: true,
  })
  const path = fileURLToPath(new URL("../artifacts/e2e-database.json", import.meta.url))
  let banco: string
  try {
    banco = JSON.parse(readFileSync(path, "utf8")).banco
  } catch {
    return
  }
  if (!/^orbita_e2e_[a-f0-9]{32}$/.test(banco))
    throw new Error("Nome de banco de teste inesperado.")
  const { Pool } = require("pg")
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await pool.query(`DROP DATABASE IF EXISTS "${banco}" WITH (FORCE)`)
    unlinkSync(path)
  } finally {
    await pool.end()
  }
}
