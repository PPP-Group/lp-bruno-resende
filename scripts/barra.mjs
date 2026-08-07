/* Confere que a barra de rolagem sai na cor da campanha, e não na do sistema.
   ----------------------------------------------------------------------------
   Não dá para provar isso por captura de tela: o Chrome sem cabeça desenha
   barra sobreposta, que não ocupa largura nenhuma e não aparece no PNG. E as
   capturas de `shots.mjs` rodam com --hide-scrollbars de propósito.

   Então a prova é no CSS publicado: se as regras estão no bundle e apontam para
   as variáveis da paleta, a barra sai na identidade em qualquer navegador que
   as suporte.

   Uso: npm run build && node scripts/barra.mjs */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const PASTA = 'dist/assets'
const folha = readdirSync(PASTA).find((f) => f.startsWith('index-') && f.endsWith('.css'))
if (!folha) {
  console.error('Nenhum CSS em dist/. Rode `npm run build` antes.')
  process.exit(1)
}

const css = readFileSync(join(PASTA, folha), 'utf-8')

const esperado = [
  ['WebKit, largura', /::-webkit-scrollbar\{width:13px/],
  ['WebKit, trilho na cor de recuo', /::-webkit-scrollbar-track\{background:var\(--color-papel-fundo\)/],
  ['WebKit, alça no azul de marca', /::-webkit-scrollbar-thumb\{background:var\(--color-vivo\)/],
  ['WebKit, alça em rosa ao passar', /::-webkit-scrollbar-thumb:hover\{background:var\(--color-rosa\)/],
  ['Firefox, mesma dupla de cores', /scrollbar-color:var\(--color-vivo\) var\(--color-papel-fundo\)/],
]

let falhas = 0
for (const [nome, padrao] of esperado) {
  const ok = padrao.test(css)
  if (!ok) falhas += 1
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${nome}`)
}

console.log(`\n${esperado.length - falhas}/${esperado.length} regras da barra publicadas em ${folha}`)
process.exit(falhas ? 1 : 0)
