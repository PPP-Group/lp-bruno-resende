/* Molduras do gerador de artes: baixa do site antigo e recodifica em WebP.
   ----------------------------------------------------------------------------
   Uso: npm run molduras

   Roda na mão, uma vez, como shots.mjs e provar.mjs. Os arquivos que ele gera
   são versionados; o script fica no repositório para que dê para refazer tudo
   quando a campanha trocar uma moldura.

   Os PNGs originais somam 29,6 MB, com um deles em 6,3 MB. Isso não entra numa
   landing page, e é por isso que este script existe. */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const BASE =
  'https://drbrunoresende.com.br/wp-content/plugins/dr-bruno-gerador-artes/assets/images'
const SAIDA = 'public/assets/molduras'

const TETO_OVERLAY = 200 * 1024
const TETO_MINI = 20 * 1024
const ORCAMENTO = 4 * 1024 * 1024

const formatos = [
  { id: 'perfil', origem: 'profile', quantos: 8, largura: 2048, altura: 2048 },
  { id: 'story', origem: 'story', quantos: 10, largura: 1080, altura: 1920 },
]

const kb = (n) => `${Math.round(n / 1024)} KB`
const dois = (n) => String(n).padStart(2, '0')

async function baixar(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`)
  return Buffer.from(await r.arrayBuffer())
}

async function gravar(caminho, buffer) {
  await mkdir(dirname(caminho), { recursive: true })
  await writeFile(caminho, buffer)
}

/* Escada de qualidade: lossless primeiro, e daí descendo até caber no teto.
   Para na primeira que couber, então cada moldura fica na melhor qualidade que
   o orçamento permite, em vez de todas caírem para o pior caso de uma delas.

   O degrau mais fundo, q70, existe por causa de perfil-07: ela sozinha tem
   6,1 MB de PNG, quase tudo grão fino no azul de fundo. É exatamente o que o
   WebP com perda joga fora barato, e a 1:1 nem a letra branca nem o número
   mudam. As chapadas com texto param em lossless ou q92 e nem chegam aqui.

   `smartSubsample` foi testado e piora: em perfil-07 leva q75 de 217 para
   315 KB. Não ligue. */
const ESCADA = [92, 88, 84, 80, 75, 70]

async function comprimir(png, teto) {
  const semPerda = await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer()
  if (semPerda.length <= teto) return { buffer: semPerda, modo: 'lossless' }

  let ultimo = { buffer: semPerda, modo: 'lossless' }

  for (const qualidade of ESCADA) {
    const tentativa = await sharp(png)
      .webp({ quality: qualidade, alphaQuality: 100, effort: 6 })
      .toBuffer()

    if (tentativa.length < ultimo.buffer.length) {
      ultimo = { buffer: tentativa, modo: `q${qualidade}` }
    }
    if (ultimo.buffer.length <= teto) break
  }

  return ultimo
}

const linhas = []
const manifesto = {}
let totalAntes = 0
let totalDepois = 0

for (const formato of formatos) {
  manifesto[formato.id] = []

  for (let n = 1; n <= formato.quantos; n++) {
    /* A pasta do plugin antigo chama-se `profile`, mas os arquivos dentro dela
       já se chamam `perfil-NN.png`. Daí `origem` separado de `id`. */
    const id = `${formato.id}-${dois(n)}`
    const png = await baixar(`${BASE}/${formato.origem}/${id}.png`)

    const meta = await sharp(png).metadata()
    if (meta.width !== formato.largura || meta.height !== formato.altura) {
      throw new Error(
        `${id}: esperava ${formato.largura}x${formato.altura}, veio ${meta.width}x${meta.height}`,
      )
    }

    const overlay = await comprimir(png, TETO_OVERLAY)
    await gravar(join(SAIDA, formato.id, `${id}.webp`), overlay.buffer)

    const miniPng = await sharp(png)
      .resize({ width: 320, height: 320, fit: 'inside' })
      .png()
      .toBuffer()
    const mini = await comprimir(miniPng, TETO_MINI)
    await gravar(join(SAIDA, 'mini', `${id}.webp`), mini.buffer)

    totalAntes += png.length
    totalDepois += overlay.buffer.length + mini.buffer.length

    linhas.push({
      id,
      antes: png.length,
      overlay: overlay.buffer.length,
      modo: overlay.modo,
      mini: mini.buffer.length,
      estourou: overlay.buffer.length > TETO_OVERLAY || mini.buffer.length > TETO_MINI,
    })

    manifesto[formato.id].push(`{ id: '${id}', rotulo: 'Moldura ${n}' }`)
  }
}

console.log('\nid           antes    overlay   modo       mini')
console.log('-'.repeat(56))
for (const l of linhas) {
  console.log(
    `${l.id.padEnd(12)} ${kb(l.antes).padStart(8)} ${kb(l.overlay).padStart(8)}   ${l.modo.padEnd(9)} ${kb(l.mini).padStart(7)}${l.estourou ? '  ESTOUROU O TETO' : ''}`,
  )
}
console.log('-'.repeat(56))
console.log(`total antes:  ${kb(totalAntes)}`)
console.log(`total depois: ${kb(totalDepois)}  (orçamento ${kb(ORCAMENTO)})`)

console.log('\nManifesto para src/data/candidato.js:\n')
for (const [formato, itens] of Object.entries(manifesto)) {
  console.log(`  // ${formato}`)
  for (const item of itens) console.log(`  ${item},`)
}

const acima = linhas.filter((l) => l.estourou)
if (acima.length) {
  console.error(
    `\nFALHA: ${acima.length} arquivo(s) acima do teto: ${acima.map((l) => l.id).join(', ')}`,
  )
}
if (totalDepois > ORCAMENTO) {
  console.error(`\nFALHA: total de ${kb(totalDepois)} acima do orçamento de ${kb(ORCAMENTO)}`)
}
process.exit(acima.length || totalDepois > ORCAMENTO ? 1 : 0)
