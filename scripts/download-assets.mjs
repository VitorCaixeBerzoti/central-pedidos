import { mkdir, writeFile } from "node:fs/promises"
const images = {
  headphones: "photo-1546435770-a3e426bf472b",
  camera: "photo-1516035069371-29a1b244cc32",
  watch: "photo-1523275335684-37898b6baf30",
  sneakers: "photo-1542291026-7eec264c27ff",
  backpack: "photo-1553062407-98eeb64c6a62",
  lamp: "photo-1507473885765-e6ed057f782c",
  chair: "photo-1598300042247-d088f8ab3a91",
  keyboard: "photo-1587829741301-dc798b83add3",
  skincare: "photo-1556229010-6c3f2c9ca5f8",
  books: "photo-1544947950-fa07a98d237f",
  speaker: "photo-1608043152269-423dbba4e7e1",
  plant: "photo-1485955900006-10f4d324d411",
}
const dir = new URL("../frontend/public/images/", import.meta.url)
await mkdir(dir, { recursive: true })
for (const [name, photo] of Object.entries(images)) {
  const response = await fetch(
    `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1000&q=85`,
  )
  if (!response.ok) throw new Error(`${name}: ${response.status}`)
  await writeFile(new URL(`${name}.jpg`, dir), Buffer.from(await response.arrayBuffer()))
  console.log(`Imagem salva: ${name}`)
}
