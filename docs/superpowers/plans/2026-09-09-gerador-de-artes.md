# Gerador de artes de apoio — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Acrescentar à landing page uma seção onde a pessoa envia a própria foto, escolhe uma das dezoito molduras da campanha e baixa a arte pronta em PNG, para foto de perfil (2048 × 2048) ou para story (1080 × 1920).

**Architecture:** Toda a geometria vive em dois módulos puros (`desenharArte.js`, `arteEstado.js`) que não importam React nem tocam em DOM, e que são cobertos por `node --test`. Um hook (`useArte.js`) liga esses módulos ao React, carrega imagens e coalesce redesenho em `requestAnimationFrame`. Quatro componentes desenham a seção: casca com abas, grade de molduras, cartão de enquadramento e cartão de resultado. O deslocamento da foto é guardado em fração do quadro, não em pixels, o que permite desenhar a mesma cena num canvas pequeno na tela e num canvas de tamanho nativo só na hora de exportar.

**Tech Stack:** React 18, Vite 6, Tailwind 4 (só como fonte de tokens — o CSS da seção é escrito à mão, como o resto do site), Canvas 2D, `createImageBitmap`, `OffscreenCanvas`. Testes de unidade em `node --test` (embutido no Node, sem dependência nova). Provas de comportamento em `scripts/provar.mjs`, com `puppeteer-core` sobre o Chrome instalado. `sharp` entra só como `devDependency`, para o script de assets.

**Spec:** [`docs/superpowers/specs/2026-09-09-gerador-de-artes-design.md`](../specs/2026-09-09-gerador-de-artes-design.md)

## Global Constraints

- **Idioma do código.** Nomes de arquivo, componente, função, variável, classe CSS e chave de dado em português, como todo o repositório. Comentários em português, explicando *por quê*, não *o quê*.
- **Nenhuma string visível dentro de componente.** Todo texto que a pessoa lê mora em `src/data/candidato.js`. É regra escrita no cabeçalho daquele arquivo.
- **Cores.** Só os tokens de `src/styles/tokens.css`. Tom novo se deriva com `color-mix()` a partir de um oficial. Nenhum hexadecimal solto no CSS da seção.
- **Ordem dos imports em `global.css` é regra, não arrumação.** `arte.css` entra depois de `conquistas.css` e antes de `contato.css`.
- **Zoom preso entre 1 e 3.** Deslocamento sempre preso na borda da foto: nunca aparece vazio atrás.
- **Formatos:** `perfil` 2048 × 2048 com 8 molduras; `story` 1080 × 1920 com 10 molduras.
- **Nomes dos arquivos baixados:** `foto-perfil-dr-bruno-resende-4400.png` e `story-dr-bruno-resende-4400.png`.
- **Orçamento de peso dos assets:** 4 MB para os 36 arquivos, teto de 200 KB por overlay e 20 KB por miniatura.
- **Tetos de entrada:** arquivo de até 25 MB; foto reduzida a 4096px na maior aresta antes de virar bitmap.
- **Nenhum `alert()`.** Toda mensagem sai num elemento `[role="status"]` com `aria-live="polite"`.
- **Alvo de toque nunca abaixo de 44px.**
- **Nenhuma dependência nova de runtime.** `sharp` é `devDependency` e não entra no bundle.
- **Servidor de desenvolvimento:** porta 5181, configurada em `vite.config.js` e em `.claude/launch.json`. As provas usam `URL_ALVO=http://localhost:5181`.

---

### Task 1: Pipeline das molduras

Baixa as dezoito molduras do site antigo, recodifica em WebP com alfa, grava overlay e miniatura, e emite o manifesto que a Task 4 vai colar em `candidato.js`.

**Files:**
- Create: `scripts/molduras.mjs`
- Create: `public/assets/molduras/perfil/perfil-01.webp` … `perfil-08.webp`
- Create: `public/assets/molduras/story/story-01.webp` … `story-10.webp`
- Create: `public/assets/molduras/mini/perfil-01.webp` … `story-10.webp`
- Modify: `package.json` (acrescenta `sharp` em `devDependencies` e o atalho `molduras` em `scripts`)
- Test: o próprio `scripts/molduras.mjs`, que sai com código 1 quando o orçamento estoura

**Interfaces:**
- Consumes: nada.
- Produces: os 36 arquivos WebP nos caminhos acima, e um manifesto impresso na saída padrão no formato que a Task 4 consome. Os ids são `perfil-01`…`perfil-08` e `story-01`…`story-10`, e os caminhos são derivados deles: `/assets/molduras/<formato>/<id>.webp` e `/assets/molduras/mini/<id>.webp`.

- [ ] **Step 1: Instalar o `sharp` como dependência de desenvolvimento**

```bash
npm install --save-dev sharp
```

Confira que ele caiu em `devDependencies`, e não em `dependencies`:

```bash
node -e "const p=require('./package.json'); console.log('dev:', !!p.devDependencies.sharp, '| runtime:', !!p.dependencies.sharp)"
```

Esperado: `dev: true | runtime: false`

- [ ] **Step 2: Escrever o script**

Crie `scripts/molduras.mjs`:

```js
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

/* Lossless primeiro. A maioria das molduras é cor chapada com texto, terreno em
   que o lossless ganha do com perda e ainda entrega borda de letra limpa. Só
   cai para q92 nas que não couberem no teto, que devem ser as que trazem foto. */
async function comprimir(png, teto) {
  const semPerda = await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer()
  if (semPerda.length <= teto) return { buffer: semPerda, modo: 'lossless' }

  const comPerda = await sharp(png)
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toBuffer()

  return comPerda.length < semPerda.length
    ? { buffer: comPerda, modo: 'q92' }
    : { buffer: semPerda, modo: 'lossless' }
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
  console.error(`\nFALHA: ${acima.length} arquivo(s) acima do teto: ${acima.map((l) => l.id).join(', ')}`)
}
if (totalDepois > ORCAMENTO) {
  console.error(`\nFALHA: total de ${kb(totalDepois)} acima do orçamento de ${kb(ORCAMENTO)}`)
}
process.exit(acima.length || totalDepois > ORCAMENTO ? 1 : 0)
```

- [ ] **Step 3: Acrescentar o atalho ao `package.json`**

Em `"scripts"`, depois de `"preview"`:

```json
    "molduras": "node scripts/molduras.mjs"
```

- [ ] **Step 4: Rodar e ler a tabela**

```bash
npm run molduras
```

Esperado: tabela com dezoito linhas, nenhuma marcada `ESTOUROU O TETO`, e `total depois` abaixo de 4096 KB. Código de saída 0.

Se sair 1, **não conserte afrouxando o teto.** Registre o número real, veja quais molduras estouraram e reporte: o orçamento é do projeto aprovado, e mudá-lo é decisão de quem pediu a funcionalidade, não de quem implementa.

- [ ] **Step 5: Conferir que os 36 arquivos existem e têm as dimensões certas**

```bash
node -e "
const sharp=require('sharp');const fs=require('fs');
const esperado={perfil:[2048,2048],story:[1080,1920]};
(async()=>{
  let n=0;
  for(const f of ['perfil','story']){
    for(const a of fs.readdirSync('public/assets/molduras/'+f)){
      const m=await sharp('public/assets/molduras/'+f+'/'+a).metadata();
      if(m.width!==esperado[f][0]||m.height!==esperado[f][1]) throw new Error(a+' '+m.width+'x'+m.height);
      if(!m.hasAlpha) throw new Error(a+' perdeu o canal alfa');
      n++;
    }
  }
  const minis=fs.readdirSync('public/assets/molduras/mini').length;
  console.log('overlays', n, '| minis', minis);
})()"
```

Esperado: `overlays 18 | minis 18`, sem exceção. O teste do alfa importa: moldura sem transparência tapa a foto inteira.

- [ ] **Step 6: Commit**

```bash
git add scripts/molduras.mjs package.json package-lock.json public/assets/molduras
git commit -m "feat: molduras do gerador de artes em WebP

Baixa as dezoito molduras do plugin do site antigo e recodifica em WebP
com alfa, gravando overlay em tamanho nativo e miniatura de 320px. O
script confere as dimensões na origem e falha quando o resultado passa
do teto por arquivo ou do orçamento total.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Geometria e composição

O módulo puro que decide onde a foto é desenhada. Nenhuma dependência, nenhum React, nenhum DOM: recebe números e um contexto de canvas.

**Files:**
- Create: `src/lib/desenharArte.js`
- Test: `src/lib/desenharArte.teste.js`
- Modify: `package.json` (atalho `provar:unidade`)

**Interfaces:**
- Consumes: nada.
- Produces:
  - `ZOOM_MIN = 1`, `ZOOM_MAX = 3`
  - `prenderNo(valor: number, min: number, max: number): number`
  - `escalaBase(foto: Medida, quadro: Medida): number`
  - `limites(foto: Medida | null, quadro: Medida, zoom: number): { x: number, y: number }`
  - `prender(deslocamento: Ponto, lim: Ponto): Ponto`
  - `enquadrar(foto: Medida, alvo: Medida, zoom: number, deslocamento: Ponto): { x, y, largura, altura }`
  - `compor(ctx: CanvasRenderingContext2D, cena: Cena): void`
  - Onde `Medida = { largura: number, altura: number }`, `Ponto = { x: number, y: number }`, e
    `Cena = { foto: Foto | null, moldura: CanvasImageSource | null, zoom: number, deslocamento: Ponto }`,
    com `Foto = { bitmap: CanvasImageSource, largura: number, altura: number }`.

- [ ] **Step 1: Escrever os testes que falham**

Crie `src/lib/desenharArte.teste.js`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { escalaBase, limites, prender, enquadrar, prenderNo } from './desenharArte.js'

const quadrado = { largura: 2048, altura: 2048 }
const story = { largura: 1080, altura: 1920 }

test('prenderNo mantém dentro da faixa', () => {
  assert.equal(prenderNo(5, 1, 3), 3)
  assert.equal(prenderNo(0, 1, 3), 1)
  assert.equal(prenderNo(2, 1, 3), 2)
})

test('escalaBase cobre o quadro pelo lado mais apertado', () => {
  // Foto deitada num quadro quadrado: quem manda é a altura.
  assert.equal(escalaBase({ largura: 4000, altura: 2000 }, quadrado), 2048 / 2000)
  // Foto em pé num quadro quadrado: quem manda é a largura.
  assert.equal(escalaBase({ largura: 2000, altura: 4000 }, quadrado), 2048 / 2000)
})

test('foto na mesma proporção do quadro, em zoom 1, não tem para onde ir', () => {
  const lim = limites({ largura: 1000, altura: 1000 }, quadrado, 1)
  assert.deepEqual(lim, { x: 0, y: 0 })
})

test('foto deitada sobra na horizontal e só na horizontal', () => {
  // 4000x2000 num quadro 2048x2048: escala 1,024, a foto vira 4096x2048.
  // Sobra 2048 na largura, metade para cada lado: meia largura de quadro.
  const lim = limites({ largura: 4000, altura: 2000 }, quadrado, 1)
  assert.equal(lim.x, 0.5)
  assert.equal(lim.y, 0)
})

test('o limite cresce com o zoom', () => {
  const um = limites({ largura: 1000, altura: 1000 }, quadrado, 1)
  const tres = limites({ largura: 1000, altura: 1000 }, quadrado, 3)
  assert.equal(um.x, 0)
  assert.equal(tres.x, 1) // (3-1)/2 = 1 largura de quadro para cada lado
  assert.equal(tres.y, 1)
})

test('o limite em fração não depende do tamanho do alvo', () => {
  // É a invariante que sustenta desenhar a 700px e exportar a 2048px.
  const foto = { largura: 3000, altura: 2000 }
  const grande = limites(foto, quadrado, 1.7)
  const pequeno = limites(foto, { largura: 512, altura: 512 }, 1.7)
  assert.equal(grande.x.toFixed(10), pequeno.x.toFixed(10))
  assert.equal(grande.y.toFixed(10), pequeno.y.toFixed(10))
})

test('sem foto não há limite', () => {
  assert.deepEqual(limites(null, quadrado, 2), { x: 0, y: 0 })
})

test('prender corta o deslocamento nos dois eixos', () => {
  const lim = { x: 0.5, y: 0.2 }
  assert.deepEqual(prender({ x: 9, y: -9 }, lim), { x: 0.5, y: -0.2 })
  assert.deepEqual(prender({ x: 0.1, y: 0.1 }, lim), { x: 0.1, y: 0.1 })
})

test('enquadrar centraliza quando o deslocamento é zero', () => {
  const cx = enquadrar({ largura: 4000, altura: 2000 }, quadrado, 1, { x: 0, y: 0 })
  assert.equal(cx.largura, 4096)
  assert.equal(cx.altura, 2048)
  assert.equal(cx.x, -1024) // (2048 - 4096) / 2
  assert.equal(cx.y, 0)
})

test('enquadrar aplica o deslocamento em fração do alvo', () => {
  const cx = enquadrar({ largura: 4000, altura: 2000 }, quadrado, 1, { x: 0.25, y: 0 })
  assert.equal(cx.x, -1024 + 0.25 * 2048)
})

test('a mesma cena desenha proporcionalmente igual em qualquer tamanho', () => {
  const foto = { largura: 3000, altura: 2000 }
  const desl = { x: 0.1, y: -0.05 }
  const grande = enquadrar(foto, story, 1.4, desl)
  const pequeno = enquadrar(foto, { largura: 270, altura: 480 }, 1.4, desl)
  const razao = 1080 / 270
  assert.equal((grande.x / pequeno.x).toFixed(6), String(razao.toFixed(6)))
  assert.equal((grande.largura / pequeno.largura).toFixed(6), String(razao.toFixed(6)))
})
```

- [ ] **Step 2: Acrescentar o atalho e rodar para ver falhar**

Em `"scripts"` do `package.json`:

```json
    "provar:unidade": "node --test \"src/lib/*.teste.js\""
```

```bash
npm run provar:unidade
```

Esperado: FALHA, com `Cannot find module` apontando para `src/lib/desenharArte.js`.

- [ ] **Step 3: Escrever a implementação mínima**

Crie `src/lib/desenharArte.js`:

```js
/* ============================================================================
   GEOMETRIA DA ARTE
   ----------------------------------------------------------------------------
   Sem React, sem DOM: números entram, números saem. É a parte que precisa estar
   certa, e é a parte que dá para conferir sem montar nada.

   A decisão que amarra o módulo inteiro: o deslocamento da foto é guardado em
   FRAÇÃO do quadro, não em pixels. Com isso a mesma cena desenha idêntica na
   prévia de 240px, no canvas de trabalho de 700px e no arquivo de 2048px, e o
   canvas de trabalho fica livre para ter o tamanho que a tela pedir.
   ========================================================================== */

export const ZOOM_MIN = 1
export const ZOOM_MAX = 3

export const prenderNo = (valor, min, max) => Math.max(min, Math.min(max, valor))

/* Cover: a foto cobre o quadro inteiro e a sobra é cortada. Nunca aparece vazio
   atrás, que é o que o eleitor esperaria de um app de rede social. */
export function escalaBase(foto, quadro) {
  return Math.max(quadro.largura / foto.largura, quadro.altura / foto.altura)
}

/* O quanto dá para arrastar em cada eixo, em fração do quadro. Zero quer dizer
   que a foto não sobra daquele lado, então não há o que mover. */
export function limites(foto, quadro, zoom) {
  if (!foto) return { x: 0, y: 0 }

  const escala = escalaBase(foto, quadro) * zoom
  const largura = foto.largura * escala
  const altura = foto.altura * escala

  return {
    x: Math.max(0, (largura - quadro.largura) / 2) / quadro.largura,
    y: Math.max(0, (altura - quadro.altura) / 2) / quadro.altura,
  }
}

export function prender(deslocamento, lim) {
  return {
    x: prenderNo(deslocamento.x, -lim.x, lim.x),
    y: prenderNo(deslocamento.y, -lim.y, lim.y),
  }
}

/* Onde a foto vai ser desenhada dentro de `alvo`, em unidades de `alvo`. */
export function enquadrar(foto, alvo, zoom, deslocamento) {
  const escala = escalaBase(foto, alvo) * zoom
  const largura = foto.largura * escala
  const altura = foto.altura * escala

  return {
    x: (alvo.largura - largura) / 2 + deslocamento.x * alvo.largura,
    y: (alvo.altura - altura) / 2 + deslocamento.y * alvo.altura,
    largura,
    altura,
  }
}

/* Desenha a cena no contexto, no tamanho que o contexto tiver. A moldura vem
   por cima e é esticada para o canvas inteiro: ela sempre tem a proporção do
   quadro, então não há distorção. */
export function compor(ctx, { foto, moldura, zoom, deslocamento }) {
  const alvo = { largura: ctx.canvas.width, altura: ctx.canvas.height }
  ctx.clearRect(0, 0, alvo.largura, alvo.altura)

  if (foto) {
    const caixa = enquadrar(foto, alvo, zoom, deslocamento)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(foto.bitmap, caixa.x, caixa.y, caixa.largura, caixa.altura)
  }

  if (moldura) ctx.drawImage(moldura, 0, 0, alvo.largura, alvo.altura)
}
```

- [ ] **Step 4: Rodar até passar**

```bash
npm run provar:unidade
```

Esperado: `pass 11`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/desenharArte.js src/lib/desenharArte.teste.js package.json
git commit -m "feat: geometria da arte, com deslocamento em fração do quadro

O deslocamento em fração é o que permite desenhar a mesma cena num canvas
de tela e num canvas de tamanho nativo sem recalcular nada. Os testes
fixam essa invariante além do cover e dos limites de arraste.

Testes em node --test, embutido no Node: o repositório não tinha runner e
não passa a ter dependência nova por causa disto.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: Estado da seção

O redutor puro. Fica separado do hook justamente para poder ser testado sem montar React.

**Files:**
- Create: `src/lib/arteEstado.js`
- Test: `src/lib/arteEstado.teste.js`

**Interfaces:**
- Consumes: de `desenharArte.js` — `limites`, `prender`, `prenderNo`, `ZOOM_MIN`, `ZOOM_MAX`.
- Produces:
  - `TETO_ARQUIVO = 26214400` (25 MB), `TETO_ARESTA = 4096`
  - `estadoInicial(formatoId: string): Estado`
  - `reduzirArte(estado: Estado, acao: Acao): Estado`
  - Onde `Estado = { formato: string, moldura: number, foto: Foto | null, zoom: number, deslocamento: Ponto, erro: string | null, carregando: boolean }`
  - E `Acao` é uma destas:
    `{ tipo: 'formato', formato: string }`,
    `{ tipo: 'moldura', indice: number }`,
    `{ tipo: 'carregando' }`,
    `{ tipo: 'foto', foto: Foto }`,
    `{ tipo: 'erro', mensagem: string }`,
    `{ tipo: 'zoom', zoom: number, quadro: Medida }`,
    `{ tipo: 'arrastar', dx: number, dy: number, quadro: Medida }`,
    `{ tipo: 'redefinir' }`

- [ ] **Step 1: Escrever os testes que falham**

Crie `src/lib/arteEstado.teste.js`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { estadoInicial, reduzirArte } from './arteEstado.js'

const quadro = { largura: 2048, altura: 2048 }
const foto = { bitmap: null, largura: 4000, altura: 2000 }

const comFoto = () => ({ ...estadoInicial('perfil'), foto })

test('o estado inicial começa na primeira moldura, sem foto', () => {
  const e = estadoInicial('perfil')
  assert.equal(e.formato, 'perfil')
  assert.equal(e.moldura, 0)
  assert.equal(e.foto, null)
  assert.equal(e.zoom, 1)
  assert.deepEqual(e.deslocamento, { x: 0, y: 0 })
})

test('trocar de formato zera o enquadramento e PRESERVA a foto', () => {
  // Quem montou a foto de perfil quase sempre quer o story da mesma foto.
  const antes = { ...comFoto(), moldura: 5, zoom: 2.4, deslocamento: { x: 0.3, y: 0.1 } }
  const depois = reduzirArte(antes, { tipo: 'formato', formato: 'story' })

  assert.equal(depois.formato, 'story')
  assert.equal(depois.moldura, 0)
  assert.equal(depois.zoom, 1)
  assert.deepEqual(depois.deslocamento, { x: 0, y: 0 })
  assert.equal(depois.foto, foto)
})

test('trocar de moldura não mexe no enquadramento', () => {
  const antes = { ...comFoto(), zoom: 2, deslocamento: { x: 0.2, y: 0 } }
  const depois = reduzirArte(antes, { tipo: 'moldura', indice: 3 })

  assert.equal(depois.moldura, 3)
  assert.equal(depois.zoom, 2)
  assert.deepEqual(depois.deslocamento, { x: 0.2, y: 0 })
})

test('o zoom fica preso entre 1 e 3', () => {
  const e = comFoto()
  assert.equal(reduzirArte(e, { tipo: 'zoom', zoom: 9, quadro }).zoom, 3)
  assert.equal(reduzirArte(e, { tipo: 'zoom', zoom: 0.2, quadro }).zoom, 1)
})

test('diminuir o zoom traz o deslocamento de volta para dentro', () => {
  // Em zoom 3 dava para arrastar bem; ao voltar para 1 o limite encolhe e o
  // deslocamento antigo passaria a mostrar vazio atrás da foto.
  const largo = reduzirArte(
    { ...comFoto(), zoom: 3 },
    { tipo: 'arrastar', dx: 5, dy: 5, quadro },
  )
  assert.ok(largo.deslocamento.x > 0.5)

  const apertado = reduzirArte(largo, { tipo: 'zoom', zoom: 1, quadro })
  assert.equal(apertado.deslocamento.x, 0.5) // 4000x2000 em quadro quadrado
  assert.equal(apertado.deslocamento.y, 0)
})

test('arrastar soma e é preso na borda', () => {
  const um = reduzirArte(comFoto(), { tipo: 'arrastar', dx: 0.2, dy: 0.2, quadro })
  assert.equal(um.deslocamento.x, 0.2)
  assert.equal(um.deslocamento.y, 0) // não sobra nada na vertical

  const dois = reduzirArte(um, { tipo: 'arrastar', dx: 0.2, dy: 0, quadro })
  assert.equal(dois.deslocamento.x.toFixed(6), '0.400000')

  const tres = reduzirArte(dois, { tipo: 'arrastar', dx: 5, dy: 0, quadro })
  assert.equal(tres.deslocamento.x, 0.5)
})

test('sem foto, arrastar não faz nada', () => {
  const e = reduzirArte(estadoInicial('perfil'), { tipo: 'arrastar', dx: 1, dy: 1, quadro })
  assert.deepEqual(e.deslocamento, { x: 0, y: 0 })
})

test('carregar uma foto nova zera o enquadramento e limpa o erro', () => {
  const antes = { ...comFoto(), zoom: 2.5, deslocamento: { x: 0.3, y: 0 }, erro: 'tipo' }
  const outra = { bitmap: null, largura: 100, altura: 100 }
  const depois = reduzirArte(antes, { tipo: 'foto', foto: outra })

  assert.equal(depois.foto, outra)
  assert.equal(depois.zoom, 1)
  assert.deepEqual(depois.deslocamento, { x: 0, y: 0 })
  assert.equal(depois.erro, null)
  assert.equal(depois.carregando, false)
})

test('o erro não derruba a foto que já estava lá', () => {
  const depois = reduzirArte(comFoto(), { tipo: 'erro', mensagem: 'tamanho' })
  assert.equal(depois.erro, 'tamanho')
  assert.equal(depois.foto, foto)
  assert.equal(depois.carregando, false)
})

test('redefinir volta ao enquadramento de partida sem perder a foto', () => {
  const antes = { ...comFoto(), zoom: 2.2, deslocamento: { x: 0.4, y: 0.1 } }
  const depois = reduzirArte(antes, { tipo: 'redefinir' })

  assert.equal(depois.zoom, 1)
  assert.deepEqual(depois.deslocamento, { x: 0, y: 0 })
  assert.equal(depois.foto, foto)
})

test('ação desconhecida devolve o mesmo objeto', () => {
  const e = comFoto()
  assert.equal(reduzirArte(e, { tipo: 'nada' }), e)
})
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
npm run provar:unidade
```

Esperado: FALHA, `Cannot find module` apontando para `src/lib/arteEstado.js`. Os onze testes da Task 2 continuam passando.

- [ ] **Step 3: Escrever a implementação mínima**

Crie `src/lib/arteEstado.js`:

```js
/* Estado da seção de artes: redutor puro, sem React.
   ----------------------------------------------------------------------------
   Mora fora do hook para poder ser conferido sem montar componente. O `quadro`
   viaja dentro das ações que dependem dele porque o limite do arraste muda com
   o formato, e um redutor não deve ir buscar dado em lugar nenhum. */

import { limites, prender, prenderNo, ZOOM_MIN, ZOOM_MAX } from './desenharArte.js'

export const TETO_ARQUIVO = 25 * 1024 * 1024
export const TETO_ARESTA = 4096

export const estadoInicial = (formato) => ({
  formato,
  moldura: 0,
  foto: null,
  zoom: 1,
  deslocamento: { x: 0, y: 0 },
  erro: null,
  carregando: false,
})

const PARTIDA = { zoom: 1, deslocamento: { x: 0, y: 0 } }

export function reduzirArte(estado, acao) {
  switch (acao.tipo) {
    /* A foto sobrevive à troca de formato: quem acabou de montar a foto de
       perfil quase sempre quer o story da mesma foto. */
    case 'formato':
      return { ...estado, ...PARTIDA, formato: acao.formato, moldura: 0, erro: null }

    case 'moldura':
      return { ...estado, moldura: acao.indice }

    case 'carregando':
      return { ...estado, carregando: true, erro: null }

    case 'foto':
      return { ...estado, ...PARTIDA, foto: acao.foto, carregando: false, erro: null }

    case 'erro':
      return { ...estado, erro: acao.mensagem, carregando: false }

    /* Prender de novo depois de mexer no zoom não é zelo: ao diminuir, o limite
       encolhe, e o deslocamento de antes passaria a mostrar vazio atrás. */
    case 'zoom': {
      const zoom = prenderNo(acao.zoom, ZOOM_MIN, ZOOM_MAX)
      return {
        ...estado,
        zoom,
        deslocamento: prender(estado.deslocamento, limites(estado.foto, acao.quadro, zoom)),
      }
    }

    case 'arrastar': {
      const bruto = {
        x: estado.deslocamento.x + acao.dx,
        y: estado.deslocamento.y + acao.dy,
      }
      return {
        ...estado,
        deslocamento: prender(bruto, limites(estado.foto, acao.quadro, estado.zoom)),
      }
    }

    case 'redefinir':
      return { ...estado, ...PARTIDA }

    default:
      return estado
  }
}
```

- [ ] **Step 4: Rodar até passar**

```bash
npm run provar:unidade
```

Esperado: `pass 22`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/arteEstado.js src/lib/arteEstado.teste.js
git commit -m "feat: redutor da seção de artes

Puro e fora do hook, para ser conferido sem montar React. Os testes fixam
as duas regras que não são óbvias: a foto sobrevive à troca de formato, e
diminuir o zoom traz o deslocamento de volta para dentro do limite novo.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: Conteúdo, navegação e casca da seção

A seção aparece na página, no lugar certo, com cabeçalho, abas de formato e os três cartões vazios. Ainda não faz nada.

**Files:**
- Create: `src/components/arte/Arte.jsx`
- Create: `src/styles/arte.css`
- Modify: `src/data/candidato.js` (bloco `arte` e entrada em `secoes`)
- Modify: `src/App.jsx`
- Modify: `src/styles/global.css`
- Test: `scripts/provar.mjs`

**Interfaces:**
- Consumes: o manifesto impresso pela Task 1.
- Produces:
  - `candidato.arte` com a forma descrita abaixo, e `secoes` contendo `{ id: 'arte', rotulo: 'Sua arte' }`.
  - Componente `<Arte />`, exportado nomeado de `src/components/arte/Arte.jsx`.
  - Marcação com estes ganchos, que as tasks seguintes e as provas usam:
    `#arte`, `.arte__aba[data-formato]`, `.arte__painel`, `.arte__aviso[role="status"]`.

- [ ] **Step 1: Escrever a prova que falha**

Em `scripts/provar.mjs`, antes do bloco final de rolagem (o que começa em `await pagina.setViewport({ width: 1440, height: 900 })` seguido de `pagina.reload`), insira:

```js
/* ---------- Gerador de artes: a seção existe e está no lugar ---------- */
await pagina.setViewport({ width: 1440, height: 900 })
await espera(300)

const secaoArte = await pagina.evaluate(() => {
  const secao = document.getElementById('arte')
  if (!secao) return null

  const ordem = [...document.querySelectorAll('main section[id]')].map((s) => s.id)
  const abas = [...document.querySelectorAll('.arte__aba')].map((b) => ({
    formato: b.dataset.formato,
    marcada: b.getAttribute('aria-selected'),
  }))

  return {
    ordem,
    abas,
    fundo: getComputedStyle(secao).backgroundColor,
    aviso: !!secao.querySelector('.arte__aviso[role="status"]'),
    noMenu: [...document.querySelectorAll('.nav a')].some((a) => a.getAttribute('href') === '#arte'),
  }
})

conferir('Seção de artes existe', secaoArte !== null)
conferir(
  'Seção de artes fica entre conquistas e contato',
  secaoArte?.ordem.indexOf('arte') === secaoArte?.ordem.indexOf('conquistas') + 1 &&
    secaoArte?.ordem.indexOf('contato') === secaoArte?.ordem.indexOf('arte') + 1,
  secaoArte?.ordem.join(' > '),
)
conferir('Seção de artes está no menu', secaoArte?.noMenu === true)
conferir(
  'Duas abas de formato, perfil marcada',
  secaoArte?.abas.length === 2 &&
    secaoArte.abas[0].formato === 'perfil' &&
    secaoArte.abas[0].marcada === 'true',
  secaoArte?.abas.map((a) => `${a.formato}:${a.marcada}`).join(' '),
)
conferir('Seção de artes tem região de aviso', secaoArte?.aviso === true)
```

- [ ] **Step 2: Subir o servidor e rodar a prova para ver falhar**

Suba o servidor de desenvolvimento pelo painel Browser (a configuração `lp-bruno-resende` de `.claude/launch.json`, porta 5181). Não use `npm run dev` pelo shell.

```bash
URL_ALVO=http://localhost:5181 node scripts/provar.mjs
```

Esperado: FALHA nas cinco provas novas, `Seção de artes existe` à frente. As provas antigas continuam passando.

- [ ] **Step 3: Acrescentar o conteúdo a `candidato.js`**

Depois do bloco `conquistas` e antes de `contato`, acrescente. Os `rotulo` das molduras vêm do manifesto da Task 1:

```js
  /* --------------------------------------------------------------------------
     05 · SUA ARTE
     ------------------------------------------------------------------------
     As molduras são as mesmas do site antigo. Os caminhos dos arquivos não
     ficam aqui: são derivados do id e do formato em src/lib/useArte.js, para
     que renomear uma pasta não obrigue a mexer em dezoito linhas de dado.
     ---------------------------------------------------------------------- */
  arte: {
    rotulo: 'Participe',
    titulo: 'Leve a campanha na sua foto.',
    chamada:
      'Escolha uma moldura, ajuste o enquadramento e baixe a arte pronta para o seu perfil ou para o seu story. Leva menos de um minuto, e a sua foto não sai do seu aparelho.',

    passos: ['Ajuste sua foto', 'Escolha a moldura', 'Sua arte'],

    formatos: [
      {
        id: 'perfil',
        rotulo: 'Foto do perfil',
        largura: 2048,
        altura: 2048,
        arquivo: 'foto-perfil-dr-bruno-resende-4400.png',
        molduras: [
          { id: 'perfil-01', rotulo: 'Moldura 1' },
          { id: 'perfil-02', rotulo: 'Moldura 2' },
          { id: 'perfil-03', rotulo: 'Moldura 3' },
          { id: 'perfil-04', rotulo: 'Moldura 4' },
          { id: 'perfil-05', rotulo: 'Moldura 5' },
          { id: 'perfil-06', rotulo: 'Moldura 6' },
          { id: 'perfil-07', rotulo: 'Moldura 7' },
          { id: 'perfil-08', rotulo: 'Moldura 8' },
        ],
      },
      {
        id: 'story',
        rotulo: 'Story',
        largura: 1080,
        altura: 1920,
        arquivo: 'story-dr-bruno-resende-4400.png',
        molduras: [
          { id: 'story-01', rotulo: 'Moldura 1' },
          { id: 'story-02', rotulo: 'Moldura 2' },
          { id: 'story-03', rotulo: 'Moldura 3' },
          { id: 'story-04', rotulo: 'Moldura 4' },
          { id: 'story-05', rotulo: 'Moldura 5' },
          { id: 'story-06', rotulo: 'Moldura 6' },
          { id: 'story-07', rotulo: 'Moldura 7' },
          { id: 'story-08', rotulo: 'Moldura 8' },
          { id: 'story-09', rotulo: 'Moldura 9' },
          { id: 'story-10', rotulo: 'Moldura 10' },
        ],
      },
    ],

    /* Textos de estado. Ficam aqui, e não no componente, pela mesma regra que
       vale para o resto da página. */
    avisos: {
      semFoto: 'Escolha uma foto para começar.',
      carregando: 'Preparando a sua foto…',
      pronta: 'Pronto. Baixe a sua arte.',
      tipo: 'Esse arquivo não é uma imagem. Escolha uma foto em JPG, PNG ou WEBP.',
      tamanho: 'Essa imagem passa de 25 MB. Escolha uma foto menor.',
      leitura: 'Não foi possível abrir essa imagem. Tente outra.',
      moldura: 'A moldura não carregou. Confira a conexão e escolha de novo.',
      semPartilha: 'Seu navegador não compartilha arquivos direto. A arte foi baixada.',
    },

    acoes: {
      escolher: 'Escolher foto',
      trocar: 'Trocar foto',
      redefinir: 'Redefinir',
      baixar: 'Baixar PNG',
      compartilhar: 'Compartilhar',
    },

    ajuda: {
      arrastar: 'Arraste para enquadrar. Use a roda do mouse ou dois dedos para aproximar e afastar.',
      teclado:
        'Com o enquadramento em foco: as setas movem a foto, Shift com seta move mais rápido, mais e menos mudam a aproximação, e Home volta ao enquadramento inicial.',
      grade: 'Molduras disponíveis',
      zoom: 'Aproximação',
    },
  },
```

E em `secoes`, entre `conquistas` e `contato`:

```js
  { id: 'arte', rotulo: 'Sua arte' },
```

- [ ] **Step 4: Escrever a casca do componente**

Crie `src/components/arte/Arte.jsx`:

```jsx
import { candidato } from '../../data/candidato.js'
import { useRevelar } from '../../lib/useRevelar.js'

/* A seção do gerador de artes. Os três cartões chegam nas tasks seguintes; por
   ora a casca já fixa a estrutura de abas e a região de aviso. */
export function Arte() {
  const { arte } = candidato
  const [ref, visivel] = useRevelar()

  const formato = arte.formatos[0]

  return (
    <section id="arte" className="secao arte">
      <div ref={ref} className="faixa-conteudo revelar" data-visivel={visivel}>
        <header className="arte__cabeca">
          <p className="rotulo">{arte.rotulo}</p>
          <h2 className="titulo-secao">{arte.titulo}</h2>
          <p className="chamada-secao">{arte.chamada}</p>
        </header>

        <div className="arte__abas" role="tablist" aria-label={arte.titulo}>
          {arte.formatos.map((f) => {
            const ativo = f.id === formato.id
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                id={`aba-${f.id}`}
                aria-selected={ativo}
                aria-controls="painel-arte"
                tabIndex={ativo ? 0 : -1}
                data-formato={f.id}
                className={`btn arte__aba ${ativo ? 'btn--primario' : 'btn--secundario'}`}
              >
                <span className="btn__texto">{f.rotulo}</span>
              </button>
            )
          })}
        </div>

        <div
          className="arte__painel"
          id="painel-arte"
          role="tabpanel"
          aria-labelledby={`aba-${formato.id}`}
        >
          {arte.passos.map((passo, i) => (
            <article key={passo} className="cartao arte__cartao">
              <h3 className="arte__passo">
                <span className="arte__passo-num">{i + 1}</span>
                {passo}
              </h3>
            </article>
          ))}
        </div>

        <p className="arte__aviso" role="status" aria-live="polite">
          {arte.avisos.semFoto}
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Escrever o CSS da casca**

Crie `src/styles/arte.css`:

```css
/* ============================================================================
   SUA ARTE
   ----------------------------------------------------------------------------
   Conquistas é escura e Contato é branco puro. O papel no meio faz o degrau
   entre as duas e evita dois brancos colados.
   ========================================================================== */

.arte {
  background: var(--color-papel);
}

.arte__cabeca {
  max-width: var(--largura-leitura);
  margin-bottom: clamp(2rem, 4vw, 3rem);
}

/* ---------- Abas de formato ---------- */

.arte__abas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: clamp(1.5rem, 3vw, 2.25rem);
}

.arte__aba {
  cursor: pointer;
  border: 0;
}

/* ---------- Os três cartões ---------- */

.arte__painel {
  display: grid;
  gap: clamp(1rem, 2vw, 1.5rem);
  align-items: start;
}

@media (min-width: 900px) {
  .arte__painel {
    grid-template-columns: 1.35fr 1fr 1.1fr;
  }
}

.arte__cartao {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(1.1rem, 2vw, 1.5rem);
}

.arte__passo {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 0;
  font-family: var(--font-campanha);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-mar);
}

/* O número em rosa: no sistema da página, rosa marca o ponto onde o cuidado
   toca. Aqui é onde a pessoa entra na campanha. */
.arte__passo-num {
  display: grid;
  place-items: center;
  flex: none;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 0.5rem;
  background: var(--color-rosa);
  color: #fff;
  font-size: 1rem;
}

/* ---------- Aviso ---------- */

.arte__aviso {
  margin-top: 1.25rem;
  min-height: 1.5rem;
  font-size: var(--text-mini);
  color: var(--color-tinta-fraca);
}

.arte__aviso[data-erro='true'] {
  font-weight: 600;
  color: color-mix(in oklab, var(--color-rosa) 80%, var(--color-tinta));
}
```

- [ ] **Step 6: Ligar o CSS e o componente**

Em `src/styles/global.css`, entre as linhas de `conquistas.css` e `contato.css`:

```css
@import './arte.css';
```

Em `src/App.jsx`, acrescente o import junto dos outros de seção:

```jsx
import { Arte } from './components/arte/Arte.jsx'
```

E no corpo, depois da `FaixaCorrida` das leis e antes de `<Contato />`:

```jsx
        <Arte />
```

- [ ] **Step 7: Rodar a prova até passar**

```bash
URL_ALVO=http://localhost:5181 node scripts/provar.mjs
```

Esperado: as cinco provas novas em OK, e todas as antigas ainda em OK — inclusive `Nenhum erro no console`, `Blocos revelam ao entrar na tela` e as seis de rolagem lateral.

- [ ] **Step 8: Commit**

```bash
git add src/components/arte/Arte.jsx src/styles/arte.css src/styles/global.css src/App.jsx src/data/candidato.js scripts/provar.mjs
git commit -m "feat: casca da seção Sua arte

Cabeçalho, abas de formato e os três cartões, entre a faixa das leis e o
Contato. A faixa fica com Conquistas de propósito: ela é o fecho daquela
seção, repete em movimento o que a seção acabou de provar.

Todo o texto vai para candidato.js, inclusive os avisos de estado.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Grade de molduras

O cartão 2. Grade de miniaturas com semântica de escolha e teclado, e as abas passam a trocar de formato de verdade.

**Files:**
- Create: `src/components/arte/Molduras.jsx`
- Modify: `src/components/arte/Arte.jsx`
- Modify: `src/styles/arte.css`
- Test: `scripts/provar.mjs`

**Interfaces:**
- Consumes: de `arteEstado.js` — `estadoInicial`, `reduzirArte`. De `candidato.js` — `candidato.arte`.
- Produces: componente `<Molduras formato={Formato} indice={number} aoEscolher={(i: number) => void} ajuda={{ grade: string }} />`, exportado nomeado. Marcação: `.molduras__grade[role="radiogroup"]` e `.molduras__opcao[role="radio"][data-id]`.
- Nesta task `Arte.jsx` passa a segurar o estado com `useReducer(reduzirArte, formatos[0].id, estadoInicial)`. A Task 6 move isso para `useArte.js`; a interface que os cartões enxergam não muda.

- [ ] **Step 1: Escrever a prova que falha**

Em `scripts/provar.mjs`, logo depois do bloco da Task 4:

```js
/* ---------- Gerador de artes: a grade de molduras ---------- */
const grade = await pagina.evaluate(() => {
  const g = document.querySelector('.molduras__grade')
  if (!g) return null
  const itens = [...g.querySelectorAll('.molduras__opcao')]
  return {
    papel: g.getAttribute('role'),
    quantos: itens.length,
    marcados: itens.filter((i) => i.getAttribute('aria-checked') === 'true').length,
    primeiro: itens[0]?.getAttribute('aria-checked'),
    focaveis: itens.filter((i) => i.tabIndex === 0).length,
    mini: itens[0]?.querySelector('img')?.getAttribute('src'),
  }
})

conferir('Grade é um radiogroup', grade?.papel === 'radiogroup')
conferir('Oito molduras de perfil', grade?.quantos === 8, String(grade?.quantos))
conferir('Exatamente uma marcada, a primeira', grade?.marcados === 1 && grade?.primeiro === 'true')
conferir('Só um item recebe Tab', grade?.focaveis === 1, String(grade?.focaveis))
conferir(
  'A grade carrega miniatura, não o overlay',
  grade?.mini?.includes('/molduras/mini/') === true,
  grade?.mini,
)

// Seta para a direita anda na grade e leva a marcação junto.
await pagina.focus('.molduras__opcao[aria-checked="true"]')
await pagina.keyboard.press('ArrowRight')
await espera(150)
const depoisDaSeta = await pagina.evaluate(() => {
  const itens = [...document.querySelectorAll('.molduras__opcao')]
  return {
    marcado: itens.findIndex((i) => i.getAttribute('aria-checked') === 'true'),
    focado: itens.indexOf(document.activeElement),
  }
})
conferir(
  'Seta anda na grade e move a marcação',
  depoisDaSeta.marcado === 1 && depoisDaSeta.focado === 1,
  `marcado ${depoisDaSeta.marcado}, focado ${depoisDaSeta.focado}`,
)

// Trocar para story troca a grade e volta para a primeira moldura.
await pagina.click('.arte__aba[data-formato="story"]')
await espera(250)
const noStory = await pagina.evaluate(() => {
  const itens = [...document.querySelectorAll('.molduras__opcao')]
  return {
    quantos: itens.length,
    marcado: itens.findIndex((i) => i.getAttribute('aria-checked') === 'true'),
    aba: document.querySelector('.arte__aba[data-formato="story"]').getAttribute('aria-selected'),
  }
})
conferir('Story tem dez molduras', noStory.quantos === 10, String(noStory.quantos))
conferir('Trocar de formato volta para a primeira moldura', noStory.marcado === 0)
conferir('A aba de story fica marcada', noStory.aba === 'true')

await pagina.click('.arte__aba[data-formato="perfil"]')
await espera(200)
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
URL_ALVO=http://localhost:5181 node scripts/provar.mjs
```

Esperado: FALHA em `Grade é um radiogroup` e nas seguintes.

- [ ] **Step 3: Escrever o componente**

Crie `src/components/arte/Molduras.jsx`:

```jsx
import { useEffect, useRef } from 'react'
import { caminhoMini } from '../../lib/useArte.js'

/* A grade do cartão 2.

   É um radiogroup, e não uma fileira de botões como no site antigo: escolher
   uma moldura é escolher UMA entre várias, e essa é exatamente a semântica que
   o leitor de tela precisa ouvir. Com radiogroup vem o tabindex itinerante,
   que é o que faz o Tab pular a grade inteira em vez de parar dezoito vezes. */
export function Molduras({ formato, indice, aoEscolher, ajuda }) {
  const refs = useRef([])

  useEffect(() => {
    refs.current = refs.current.slice(0, formato.molduras.length)
  }, [formato.molduras.length])

  const andar = (passo) => {
    const total = formato.molduras.length
    const alvo = (indice + passo + total) % total
    aoEscolher(alvo)
    refs.current[alvo]?.focus()
  }

  const noTeclado = (e) => {
    const passos = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    if (e.key in passos) {
      e.preventDefault()
      andar(passos[e.key])
      return
    }
    if (e.key === 'Home') {
      e.preventDefault()
      aoEscolher(0)
      refs.current[0]?.focus()
    }
    if (e.key === 'End') {
      e.preventDefault()
      const fim = formato.molduras.length - 1
      aoEscolher(fim)
      refs.current[fim]?.focus()
    }
  }

  return (
    <div
      className="molduras__grade"
      role="radiogroup"
      aria-label={ajuda.grade}
      onKeyDown={noTeclado}
    >
      {formato.molduras.map((moldura, i) => {
        const marcada = i === indice
        return (
          <button
            key={moldura.id}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={marcada}
            tabIndex={marcada ? 0 : -1}
            data-id={moldura.id}
            className="molduras__opcao"
            onClick={() => aoEscolher(i)}
          >
            <img src={caminhoMini(moldura.id)} alt={moldura.rotulo} loading="lazy" />
            <span className="molduras__selo" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Criar `caminhoMini` e `caminhoMoldura`**

A Task 6 escreve o resto de `src/lib/useArte.js`. Por ora crie o arquivo só com os dois derivadores de caminho:

```js
/* Onde moram os arquivos de moldura. Derivar aqui, e não guardar o caminho no
   dado, é o que permite renomear a pasta sem mexer em dezoito linhas. */
export const caminhoMoldura = (formato, id) => `/assets/molduras/${formato}/${id}.webp`
export const caminhoMini = (id) => `/assets/molduras/mini/${id}.webp`
```

- [ ] **Step 5: Ligar o estado em `Arte.jsx`**

Substitua o corpo de `Arte.jsx` por esta versão, que já segura o estado e liga as abas:

```jsx
import { useMemo, useReducer } from 'react'
import { candidato } from '../../data/candidato.js'
import { useRevelar } from '../../lib/useRevelar.js'
import { estadoInicial, reduzirArte } from '../../lib/arteEstado.js'
import { Molduras } from './Molduras.jsx'

export function Arte() {
  const { arte } = candidato
  const [ref, visivel] = useRevelar()
  const [estado, despachar] = useReducer(reduzirArte, arte.formatos[0].id, estadoInicial)

  const formato = useMemo(
    () => arte.formatos.find((f) => f.id === estado.formato),
    [arte.formatos, estado.formato],
  )

  /* Setas circulam entre as abas, como manda o padrão de tablist. */
  const abasNoTeclado = (e) => {
    const passos = { ArrowRight: 1, ArrowLeft: -1 }
    if (!(e.key in passos)) return
    e.preventDefault()
    const total = arte.formatos.length
    const atual = arte.formatos.findIndex((f) => f.id === estado.formato)
    const alvo = arte.formatos[(atual + passos[e.key] + total) % total]
    despachar({ tipo: 'formato', formato: alvo.id })
    document.querySelector(`.arte__aba[data-formato="${alvo.id}"]`)?.focus()
  }

  return (
    <section id="arte" className="secao arte">
      <div ref={ref} className="faixa-conteudo revelar" data-visivel={visivel}>
        <header className="arte__cabeca">
          <p className="rotulo">{arte.rotulo}</p>
          <h2 className="titulo-secao">{arte.titulo}</h2>
          <p className="chamada-secao">{arte.chamada}</p>
        </header>

        <div className="arte__abas" role="tablist" aria-label={arte.titulo} onKeyDown={abasNoTeclado}>
          {arte.formatos.map((f) => {
            const ativo = f.id === estado.formato
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                id={`aba-${f.id}`}
                aria-selected={ativo}
                aria-controls="painel-arte"
                tabIndex={ativo ? 0 : -1}
                data-formato={f.id}
                className={`btn arte__aba ${ativo ? 'btn--primario' : 'btn--secundario'}`}
                onClick={() => despachar({ tipo: 'formato', formato: f.id })}
              >
                <span className="btn__texto">{f.rotulo}</span>
              </button>
            )
          })}
        </div>

        <div
          className="arte__painel"
          id="painel-arte"
          role="tabpanel"
          aria-labelledby={`aba-${estado.formato}`}
        >
          <article className="cartao arte__cartao">
            <h3 className="arte__passo">
              <span className="arte__passo-num">1</span>
              {arte.passos[0]}
            </h3>
          </article>

          <article className="cartao arte__cartao">
            <h3 className="arte__passo">
              <span className="arte__passo-num">2</span>
              {arte.passos[1]}
            </h3>
            <Molduras
              formato={formato}
              indice={estado.moldura}
              aoEscolher={(indice) => despachar({ tipo: 'moldura', indice })}
              ajuda={arte.ajuda}
            />
          </article>

          <article className="cartao arte__cartao">
            <h3 className="arte__passo">
              <span className="arte__passo-num">3</span>
              {arte.passos[2]}
            </h3>
          </article>
        </div>

        <p className="arte__aviso" role="status" aria-live="polite" data-erro={!!estado.erro}>
          {estado.erro ? arte.avisos[estado.erro] : arte.avisos.semFoto}
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Escrever o CSS da grade**

Acrescente ao fim de `src/styles/arte.css`:

```css
/* ---------- Grade de molduras ---------- */

.molduras__grade {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 0.65rem;
}

.molduras__opcao {
  position: relative;
  aspect-ratio: 1;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: var(--color-papel-fundo);
  border: 0;
  border-radius: 0.7rem;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-mar) 12%, transparent);
  transition:
    box-shadow 0.18s,
    transform 0.18s var(--ease-saida);
}

.molduras__opcao:hover {
  transform: translateY(-2px);
}

.molduras__opcao img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.molduras__opcao[aria-checked='true'] {
  box-shadow: inset 0 0 0 2px var(--color-rosa);
}

/* O selo só aparece na escolhida. É redundante com o anel de propósito: cor
   sozinha não pode ser o único sinal de estado. */
.molduras__selo {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
  display: none;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  background: var(--color-rosa);
}

.molduras__selo::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 0.32rem;
  height: 0.6rem;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: translateY(-1px) rotate(45deg);
}

.molduras__opcao[aria-checked='true'] .molduras__selo {
  display: block;
}
```

- [ ] **Step 7: Rodar a prova até passar**

```bash
URL_ALVO=http://localhost:5181 node scripts/provar.mjs
```

Esperado: as oito provas novas em OK, e nenhuma regressão.

- [ ] **Step 8: Commit**

```bash
git add src/components/arte/Molduras.jsx src/components/arte/Arte.jsx src/lib/useArte.js src/styles/arte.css scripts/provar.mjs
git commit -m "feat: grade de molduras com semântica de escolha

Radiogroup com tabindex itinerante em vez da fileira de botões do site
antigo: escolher uma moldura é escolher uma entre várias, e o Tab passa
pela grade uma vez só. Setas circulam e levam a marcação junto.

A grade carrega miniatura de 320px; o overlay em tamanho cheio só é
buscado quando a moldura entra em uso.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Enquadramento

O cartão 1, e o coração da funcionalidade: envio da foto, canvas de trabalho, arraste, zoom, teclado.

**Files:**
- Modify: `src/lib/useArte.js`
- Create: `src/components/arte/Enquadrar.jsx`
- Modify: `src/components/arte/Arte.jsx`
- Modify: `src/styles/arte.css`
- Test: `scripts/provar.mjs`

**Interfaces:**
- Consumes: de `desenharArte.js` — `compor`, `ZOOM_MIN`, `ZOOM_MAX`. De `arteEstado.js` — `estadoInicial`, `reduzirArte`, `TETO_ARQUIVO`, `TETO_ARESTA`.
- Produces, de `useArte.js`:
  - `useArte(formatos: Formato[])` devolvendo
    `{ estado, despachar, formato, quadro, cena, molduraPronta: boolean, escolherFoto(arquivo: File): Promise<void>, exportar(): Promise<File> }`
  - `usePintura(ref: RefObject<HTMLCanvasElement>, cena: Cena, quadro: Medida, larguraMaxima: number): void`
  - `caminhoMoldura`, `caminhoMini` (já existentes)
- Produces, de `Enquadrar.jsx`: componente
  `<Enquadrar estado={Estado} despachar={fn} quadro={Medida} cena={Cena} aoEscolherArquivo={(a: File) => void} textos={CandidatoArte} />`,
  onde `textos` é o objeto `candidato.arte` inteiro — o componente lê `textos.acoes`, `textos.ajuda` e `textos.avisos`.
  Marcação: `.enquadrar__tela` (canvas), `.enquadrar__arquivo` (input file), `.enquadrar__zoom` (range), `.enquadrar__redefinir`.

- [ ] **Step 1: Escrever as provas que falham**

Em `scripts/provar.mjs`, no topo do arquivo, junto dos outros imports:

```js
import { mkdtemp, writeFile, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
```

E logo depois do helper `conferir`:

```js
/* Um PNG de teste, gerado na hora: nada binário entra no repositório. As
   dimensões são deitadas de propósito, para exercitar o cover num quadro
   quadrado. Cada quadrante tem uma cor, o que deixa dar para perceber que o
   desenho mudou depois de arrastar. */
const pngDeTeste = async (largura = 1200, altura = 600) => {
  const zlib = await import('node:zlib')
  const cru = Buffer.alloc((largura * 3 + 1) * altura)
  let p = 0
  for (let y = 0; y < altura; y++) {
    cru[p++] = 0
    for (let x = 0; x < largura; x++) {
      cru[p++] = x < largura / 2 ? 230 : 20
      cru[p++] = y < altura / 2 ? 200 : 40
      cru[p++] = 120
    }
  }
  const pedaco = (tipo, dados) => {
    const c = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
    const tam = Buffer.alloc(4)
    tam.writeUInt32BE(dados.length)
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(c) : 0)
    return Buffer.concat([tam, c, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largura, 0)
  ihdr.writeUInt32BE(altura, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', zlib.deflateSync(cru)),
    pedaco('IEND', Buffer.alloc(0)),
  ])
}

const dimensoesPng = (buf) => ({
  assinatura: buf.subarray(0, 8).toString('hex') === '89504e470d0a1a0a',
  largura: buf.readUInt32BE(16),
  altura: buf.readUInt32BE(20),
})
```

> Nota sobre `zlib.crc32`: existe a partir do Node 20.15 e do Node 22. Este repositório roda em Node 24. Se algum dia rodar em Node mais antigo, o CRC sai zerado e o Chrome recusa o PNG — nesse caso, escreva o CRC-32 à mão em vez de afrouxar a prova.

Depois do bloco da Task 5:

```js
/* ---------- Gerador de artes: enquadramento ---------- */
const pasta = await mkdtemp(join(tmpdir(), 'artes-'))
const caminhoFoto = join(pasta, 'foto.png')
await writeFile(caminhoFoto, await pngDeTeste())

/* Conta pixels opacos. Sem foto, o miolo da moldura é vazado e sobram
   transparentes; com a foto, o cover cobre tudo e não sobra nenhum. */
const opacidade = () =>
  pagina.evaluate(() => {
    const c = document.querySelector('.enquadrar__tela')
    if (!c) return null
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    let opacos = 0
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) opacos++
    return { opacos, total: d.length / 4, largura: c.width, altura: c.height }
  })

const semFoto = await opacidade()
conferir('Canvas de trabalho existe', semFoto !== null)
conferir(
  'Sem foto, o miolo da moldura fica vazado',
  semFoto && semFoto.opacos > 0 && semFoto.opacos < semFoto.total,
  `${semFoto?.opacos}/${semFoto?.total}`,
)

const entrada = await pagina.$('.enquadrar__arquivo')
await entrada.uploadFile(caminhoFoto)
await espera(900)

const comFoto = await opacidade()
conferir('A foto foi desenhada', comFoto.opacos === comFoto.total, `${comFoto.opacos}/${comFoto.total}`)
conferir('Canvas de trabalho é quadrado no perfil', comFoto.largura === comFoto.altura)
conferir(
  'Canvas de trabalho não é o tamanho nativo',
  comFoto.largura < 2048,
  `${comFoto.largura}px`,
)

/* Em zoom 1, uma foto 1200x600 num quadro quadrado sobra só na horizontal:
   arrastar na vertical não pode mexer em nada. */
/* Uma assinatura barata dos pixels. Comparar o tamanho do dataURL não serve:
   duas imagens diferentes cabem no mesmo número de bytes. */
const assinar = () =>
  pagina.evaluate(() => {
    const c = document.querySelector('.enquadrar__tela')
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
    let h = 0
    for (let i = 0; i < d.length; i += 997) h = (h * 31 + d[i]) >>> 0
    return h
  })

const antesDeArrastar = await assinar()
await pagina.focus('.enquadrar__tela')
await pagina.keyboard.press('ArrowUp')
await espera(200)
conferir('Sem sobra na vertical, a seta para cima não move nada', (await assinar()) === antesDeArrastar)

await pagina.keyboard.press('ArrowLeft')
await espera(200)
conferir('Com sobra na horizontal, a seta para a esquerda move', (await assinar()) !== antesDeArrastar)

await pagina.keyboard.press('Home')
await espera(200)
conferir('Home volta ao enquadramento inicial', (await assinar()) === antesDeArrastar)

const zoom = await pagina.$('.enquadrar__zoom')
conferir('Controle de zoom vai de 1 a 3', await pagina.evaluate((e) => e.min === '1' && e.max === '3', zoom))

// Trocar de moldura tem de mudar o que está desenhado, não só o aria-checked.
const antesDaMoldura = await assinar()
await pagina.click('.molduras__opcao[data-id="perfil-03"]')
await espera(700)
conferir('Trocar de moldura muda o desenho', (await assinar()) !== antesDaMoldura)

await pagina.click('.molduras__opcao[data-id="perfil-01"]')
await espera(500)

/* A foto sobrevive à troca de formato. */
await pagina.click('.arte__aba[data-formato="story"]')
await espera(700)
const noStory = await pagina.evaluate(() => {
  const c = document.querySelector('.enquadrar__tela')
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  let opacos = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) opacos++
  return { opacos, total: d.length / 4, proporcao: (c.width / c.height).toFixed(4) }
})
conferir('A foto sobrevive à troca de formato', noStory.opacos === noStory.total)
conferir('Canvas assume a proporção do story', noStory.proporcao === (1080 / 1920).toFixed(4), noStory.proporcao)

await pagina.click('.arte__aba[data-formato="perfil"]')
await espera(500)
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
URL_ALVO=http://localhost:5181 node scripts/provar.mjs
```

Esperado: FALHA em `Canvas de trabalho existe e começa vazio` e nas seguintes.

- [ ] **Step 3: Escrever o hook**

Substitua o conteúdo de `src/lib/useArte.js`:

```jsx
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'

import { compor } from './desenharArte.js'
import { estadoInicial, reduzirArte, TETO_ARQUIVO, TETO_ARESTA } from './arteEstado.js'

/* Onde moram os arquivos de moldura. Derivar aqui, e não guardar o caminho no
   dado, é o que permite renomear a pasta sem mexer em dezoito linhas. */
export const caminhoMoldura = (formato, id) => `/assets/molduras/${formato}/${id}.webp`
export const caminhoMini = (id) => `/assets/molduras/mini/${id}.webp`

/* Uma moldura baixada uma vez serve para o resto da visita. O cache é de módulo
   e não de componente porque a pessoa vai e volta entre perfil e story. */
const cache = new Map()

function carregarMoldura(src) {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((pronto, falhou) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => pronto(img)
        img.onerror = () => falhou(new Error(src))
        img.src = src
      }),
    )
  }
  return cache.get(src)
}

/* `createImageBitmap` com `imageOrientation` é o que conserta a foto de iPhone
   entrando deitada: o caminho antigo, FileReader mais new Image, ignora o campo
   de orientação do EXIF. */
async function lerFoto(arquivo) {
  if (!arquivo.type.startsWith('image/')) throw new Error('tipo')
  if (arquivo.size > TETO_ARQUIVO) throw new Error('tamanho')

  let bitmap
  try {
    bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('leitura')
  }

  /* Uma foto de 50 MP monta um bitmap de cerca de 200 MB e derruba a aba no
     celular. Reduzir aqui custa um fio de nitidez no zoom máximo sobre um
     recorte extremo, e é troca que vale. */
  const maior = Math.max(bitmap.width, bitmap.height)
  if (maior > TETO_ARESTA) {
    const fator = TETO_ARESTA / maior
    const menor = await createImageBitmap(bitmap, {
      resizeWidth: Math.round(bitmap.width * fator),
      resizeHeight: Math.round(bitmap.height * fator),
      resizeQuality: 'high',
    })
    bitmap.close()
    bitmap = menor
  }

  return { bitmap, largura: bitmap.width, altura: bitmap.height }
}

export function useArte(formatos) {
  const [estado, despachar] = useReducer(reduzirArte, formatos[0].id, estadoInicial)
  const [moldura, setMoldura] = useState(null)

  const formato = useMemo(
    () => formatos.find((f) => f.id === estado.formato),
    [formatos, estado.formato],
  )
  const quadro = useMemo(
    () => ({ largura: formato.largura, altura: formato.altura }),
    [formato],
  )

  const idMoldura = formato.molduras[estado.moldura].id

  useEffect(() => {
    let vivo = true
    setMoldura(null)

    carregarMoldura(caminhoMoldura(formato.id, idMoldura))
      .then((img) => vivo && setMoldura(img))
      .catch(() => vivo && despachar({ tipo: 'erro', mensagem: 'moldura' }))

    return () => {
      vivo = false
    }
  }, [formato.id, idMoldura])

  const cena = useMemo(
    () => ({ foto: estado.foto, moldura, zoom: estado.zoom, deslocamento: estado.deslocamento }),
    [estado.foto, moldura, estado.zoom, estado.deslocamento],
  )

  const escolherFoto = useCallback(async (arquivo) => {
    despachar({ tipo: 'carregando' })
    try {
      despachar({ tipo: 'foto', foto: await lerFoto(arquivo) })
    } catch (e) {
      despachar({ tipo: 'erro', mensagem: e.message })
    }
  }, [])

  /* O tamanho nativo só existe neste instante. Manter dois canvases de 2048 no
     ar, como o plugin antigo, é 33 MB de bitmap redesenhado a cada arraste. */
  const exportar = useCallback(async () => {
    const { largura, altura } = quadro
    const tela =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(largura, altura)
        : Object.assign(document.createElement('canvas'), { width: largura, height: altura })

    compor(tela.getContext('2d'), cena)

    const blob = tela.convertToBlob
      ? await tela.convertToBlob({ type: 'image/png' })
      : await new Promise((pronto) => tela.toBlob(pronto, 'image/png'))

    return new File([blob], formato.arquivo, { type: 'image/png' })
  }, [cena, quadro, formato.arquivo])

  return { estado, despachar, formato, quadro, cena, molduraPronta: !!moldura, escolherFoto, exportar }
}

/* Pinta a cena num canvas dimensionado pela tela, não pelo quadro. O redesenho
   é coalescido: vários eventos de arraste no mesmo quadro viram um desenho só. */
export function usePintura(ref, cena, quadro, larguraMaxima) {
  const pedido = useRef(0)

  useEffect(() => {
    const tela = ref.current
    if (!tela) return

    const medir = () => {
      const exibida = tela.getBoundingClientRect().width || larguraMaxima
      const largura = Math.round(
        Math.min(exibida * Math.min(window.devicePixelRatio || 1, 2), quadro.largura),
      )
      const altura = Math.round((largura * quadro.altura) / quadro.largura)
      if (tela.width !== largura || tela.height !== altura) {
        tela.width = largura
        tela.height = altura
      }
    }

    const pintar = () => {
      pedido.current = 0
      medir()
      compor(tela.getContext('2d'), cena)
    }

    const agendar = () => {
      if (!pedido.current) pedido.current = requestAnimationFrame(pintar)
    }

    agendar()
    const observador = new ResizeObserver(agendar)
    observador.observe(tela)

    return () => {
      observador.disconnect()
      if (pedido.current) cancelAnimationFrame(pedido.current)
      pedido.current = 0
    }
  }, [ref, cena, quadro, larguraMaxima])
}
```

- [ ] **Step 4: Escrever o componente do cartão 1**

Crie `src/components/arte/Enquadrar.jsx`:

```jsx
import { useId, useRef } from 'react'
import { usePintura } from '../../lib/useArte.js'
import { ZOOM_MAX, ZOOM_MIN } from '../../lib/desenharArte.js'

const PASSO_SETA = 0.02
const PASSO_SETA_RAPIDO = 0.1
const PASSO_ZOOM = 0.12

/* O cartão 1: a foto, o enquadramento e o zoom.

   O arraste converte pixels de tela em fração do quadro dividindo pela largura
   exibida do canvas. É o que mantém o gesto na mesma velocidade em qualquer
   tamanho de tela, e o que dispensa saber a resolução do canvas aqui dentro. */
export function Enquadrar({ estado, despachar, quadro, cena, aoEscolherArquivo, textos }) {
  const tela = useRef(null)
  const arrastando = useRef(null)
  const pincada = useRef(null)
  const idArquivo = useId()
  const idAjuda = useId()

  usePintura(tela, cena, quadro, 640)

  const temFoto = !!estado.foto

  const arrastarEm = (dxTela, dyTela) => {
    const caixa = tela.current.getBoundingClientRect()
    despachar({
      tipo: 'arrastar',
      dx: dxTela / caixa.width,
      dy: dyTela / caixa.height,
      quadro,
    })
  }

  const noPonteiroDesce = (e) => {
    if (!temFoto || e.pointerType === 'touch') return
    e.currentTarget.setPointerCapture(e.pointerId)
    arrastando.current = { x: e.clientX, y: e.clientY }
  }

  const noPonteiroMove = (e) => {
    if (!arrastando.current) return
    arrastarEm(e.clientX - arrastando.current.x, e.clientY - arrastando.current.y)
    arrastando.current = { x: e.clientX, y: e.clientY }
  }

  const soltar = () => {
    arrastando.current = null
  }

  const distancia = (t) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

  const noToqueComeca = (e) => {
    if (!temFoto) return
    if (e.touches.length === 1) {
      arrastando.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      pincada.current = null
    }
    if (e.touches.length === 2) {
      pincada.current = { base: distancia(e.touches), zoom: estado.zoom }
    }
  }

  const noToqueMove = (e) => {
    if (!temFoto) return
    e.preventDefault()
    if (e.touches.length === 1 && arrastando.current) {
      const t = e.touches[0]
      arrastarEm(t.clientX - arrastando.current.x, t.clientY - arrastando.current.y)
      arrastando.current = { x: t.clientX, y: t.clientY }
    }
    if (e.touches.length === 2 && pincada.current) {
      const razao = distancia(e.touches) / pincada.current.base
      despachar({ tipo: 'zoom', zoom: pincada.current.zoom * razao, quadro })
    }
  }

  const noToqueTermina = () => {
    arrastando.current = null
    pincada.current = null
  }

  const naRoda = (e) => {
    if (!temFoto) return
    e.preventDefault()
    despachar({ tipo: 'zoom', zoom: estado.zoom + (e.deltaY < 0 ? 0.08 : -0.08), quadro })
  }

  const noTeclado = (e) => {
    if (!temFoto) return
    const passo = e.shiftKey ? PASSO_SETA_RAPIDO : PASSO_SETA
    const setas = {
      ArrowLeft: [-passo, 0],
      ArrowRight: [passo, 0],
      ArrowUp: [0, -passo],
      ArrowDown: [0, passo],
    }

    if (e.key in setas) {
      e.preventDefault()
      const [dx, dy] = setas[e.key]
      despachar({ tipo: 'arrastar', dx, dy, quadro })
      return
    }
    if (e.key === '+' || e.key === '=') {
      e.preventDefault()
      despachar({ tipo: 'zoom', zoom: estado.zoom + PASSO_ZOOM, quadro })
    }
    if (e.key === '-' || e.key === '_') {
      e.preventDefault()
      despachar({ tipo: 'zoom', zoom: estado.zoom - PASSO_ZOOM, quadro })
    }
    if (e.key === 'Home') {
      e.preventDefault()
      despachar({ tipo: 'redefinir' })
    }
  }

  return (
    <>
      <div
        className="enquadrar__palco"
        data-tem-foto={temFoto}
        style={{ aspectRatio: `${quadro.largura} / ${quadro.altura}` }}
        onPointerDown={noPonteiroDesce}
        onPointerMove={noPonteiroMove}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onPointerLeave={soltar}
        onTouchStart={noToqueComeca}
        onTouchMove={noToqueMove}
        onTouchEnd={noToqueTermina}
        onWheel={naRoda}
      >
        <canvas
          ref={tela}
          className="enquadrar__tela"
          tabIndex={0}
          role="img"
          aria-label={temFoto ? textos.ajuda.arrastar : textos.avisos.semFoto}
          aria-describedby={idAjuda}
          onKeyDown={noTeclado}
        />
        {!temFoto && <p className="enquadrar__vazio">{textos.avisos.semFoto}</p>}
      </div>

      <p id={idAjuda} className="so-leitor">
        {textos.ajuda.teclado}
      </p>
      <p className="enquadrar__dica" aria-hidden="true">
        {textos.ajuda.arrastar}
      </p>

      <input
        id={idArquivo}
        className="enquadrar__arquivo so-leitor"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const arquivo = e.target.files?.[0]
          if (arquivo) aoEscolherArquivo(arquivo)
          e.target.value = ''
        }}
      />
      <label htmlFor={idArquivo} className="btn btn--secundario enquadrar__escolher">
        <span className="btn__texto">{temFoto ? textos.acoes.trocar : textos.acoes.escolher}</span>
      </label>

      <div className="enquadrar__zoom-linha">
        <label htmlFor={`${idArquivo}-zoom`}>{textos.ajuda.zoom}</label>
        <input
          id={`${idArquivo}-zoom`}
          className="enquadrar__zoom"
          type="range"
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step="0.01"
          value={estado.zoom}
          disabled={!temFoto}
          onChange={(e) => despachar({ tipo: 'zoom', zoom: Number(e.target.value), quadro })}
        />
        <button
          type="button"
          className="enquadrar__redefinir"
          disabled={!temFoto}
          onClick={() => despachar({ tipo: 'redefinir' })}
        >
          {textos.acoes.redefinir}
        </button>
      </div>
    </>
  )
}
```

- [ ] **Step 5: Trocar o `useReducer` de `Arte.jsx` pelo hook**

Em `src/components/arte/Arte.jsx`, troque os imports de `useMemo`/`useReducer`/`arteEstado` por:

```jsx
import { candidato } from '../../data/candidato.js'
import { useRevelar } from '../../lib/useRevelar.js'
import { useArte } from '../../lib/useArte.js'
import { Molduras } from './Molduras.jsx'
import { Enquadrar } from './Enquadrar.jsx'
```

Troque a linha do `useReducer` e o `useMemo` do formato por:

```jsx
  const { estado, despachar, formato, quadro, cena, escolherFoto } = useArte(arte.formatos)
```

E preencha o primeiro cartão, que hoje só tem o título:

```jsx
          <article className="cartao arte__cartao">
            <h3 className="arte__passo">
              <span className="arte__passo-num">1</span>
              {arte.passos[0]}
            </h3>
            <Enquadrar
              estado={estado}
              despachar={despachar}
              quadro={quadro}
              cena={cena}
              aoEscolherArquivo={escolherFoto}
              textos={arte}
            />
          </article>
```

O aviso no rodapé passa a mostrar também o estado de carregamento. `semPartilha`
viaja pelo mesmo canal dos erros por economia de mecanismo, mas não é erro e não
deve sair em vermelho:

```jsx
        <p
          className="arte__aviso"
          role="status"
          aria-live="polite"
          data-erro={!!estado.erro && estado.erro !== 'semPartilha'}
        >
          {estado.erro
            ? arte.avisos[estado.erro]
            : estado.carregando
              ? arte.avisos.carregando
              : estado.foto
                ? arte.avisos.pronta
                : arte.avisos.semFoto}
        </p>
```

- [ ] **Step 6: Escrever o CSS do enquadramento**

Acrescente ao fim de `src/styles/arte.css`:

```css
/* ---------- Enquadramento ---------- */

/* O xadrez diz "aqui é transparente" sem precisar de imagem. */
.enquadrar__palco {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 0.9rem;
  background-color: var(--color-papel-alto);
  background-image: repeating-conic-gradient(
    var(--color-papel-fundo) 0% 25%,
    var(--color-papel-alto) 0% 50%
  );
  background-size: 18px 18px;
  touch-action: none;
}

.enquadrar__palco[data-tem-foto='true'] {
  cursor: grab;
}

.enquadrar__palco[data-tem-foto='true']:active {
  cursor: grabbing;
}

.enquadrar__tela {
  display: block;
  width: 100%;
  height: 100%;
}

.enquadrar__tela:focus-visible {
  outline: 3px solid var(--color-rosa);
  outline-offset: -3px;
}

.enquadrar__vazio {
  position: absolute;
  margin: 0;
  padding-inline: 1.5rem;
  text-align: center;
  font-family: var(--font-campanha);
  font-size: 1.1rem;
  color: var(--color-tinta-fraca);
  pointer-events: none;
}

.enquadrar__dica {
  margin: 0;
  font-size: var(--text-mini);
  color: var(--color-tinta-fraca);
}

.enquadrar__escolher {
  width: 100%;
  cursor: pointer;
}

.enquadrar__zoom-linha {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: var(--text-mini);
  color: var(--color-tinta-fraca);
}

/* 2,75rem são os 44px de alvo de toque. Um range sem altura declarada nasce
   com uns 20px, o que reprova na prova de toque em 360px. */
.enquadrar__zoom {
  flex: 1;
  min-width: 0;
  min-height: 2.75rem;
  accent-color: var(--color-rosa);
}

.enquadrar__redefinir {
  min-height: 2.75rem;
  padding-inline: 0.9rem;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--color-papel-fundo);
  border-radius: 999px;
  font: inherit;
  color: var(--color-mar);
}

.enquadrar__redefinir:disabled,
.enquadrar__zoom:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
```

- [ ] **Step 7: Rodar as provas até passarem**

```bash
URL_ALVO=http://localhost:5181 node scripts/provar.mjs
```

Esperado: as dez provas novas em OK, sem regressão.

Se `A foto foi desenhada` falhar com o canvas ainda vazio, olhe primeiro o console da página: `createImageBitmap` recusa PNG malformado, e o CRC do gerador de teste é o suspeito mais provável.

- [ ] **Step 8: Commit**

```bash
git add src/lib/useArte.js src/components/arte/Enquadrar.jsx src/components/arte/Arte.jsx src/styles/arte.css scripts/provar.mjs
git commit -m "feat: enquadramento da foto no gerador de artes

Canvas de trabalho no tamanho da tela, não no do quadro: o plugin antigo
mantinha dois canvases de 2048 no ar e redesenhava os dois a cada arraste.
O tamanho nativo passa a existir só no instante da exportação.

A foto entra por createImageBitmap com imageOrientation, o que conserta
foto de iPhone entrando deitada, e é reduzida a 4096px antes de virar
bitmap para não derrubar a aba no celular.

Arraste, roda, pinça e teclado, com o deslocamento sempre preso na borda.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Resultado, download e compartilhamento

O cartão 3. Prévia viva, tamanho do arquivo anunciado, e os dois botões.

**Files:**
- Create: `src/components/arte/Resultado.jsx`
- Modify: `src/components/arte/Arte.jsx`
- Modify: `src/styles/arte.css`
- Modify: `src/data/candidato.js` (só o texto `medida`)
- Test: `scripts/provar.mjs`

**Interfaces:**
- Consumes: de `useArte.js` — `usePintura`, e as funções `exportar` e `molduraPronta` devolvidas por `useArte`.
- Produces: componente
  `<Resultado quadro={Medida} cena={Cena} formato={Formato} pronto={boolean} aoExportar={() => Promise<File>} aoAvisar={(chave: string) => void} textos={CandidatoArte} />`,
  onde `textos` é o mesmo `candidato.arte` que `Enquadrar` recebe — aqui só `textos.acoes` e `textos.medida` são lidos.
  Marcação: `.resultado__previa` (canvas), `.resultado__medida`, `.resultado__baixar`, `.resultado__compartilhar`.

- [ ] **Step 1: Escrever as provas que falham**

Depois do bloco da Task 6, em `scripts/provar.mjs`:

```js
/* ---------- Gerador de artes: resultado e download ---------- */
const previa = await pagina.evaluate(() => {
  const c = document.querySelector('.resultado__previa')
  if (!c) return null
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
  let opacos = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) opacos++
  return { opacos, total: d.length / 4, medida: document.querySelector('.resultado__medida')?.textContent }
})
conferir('Prévia desenha a mesma cena', previa?.opacos === previa?.total)
conferir('A medida do arquivo é anunciada', /2048/.test(previa?.medida ?? ''), previa?.medida)

const cdp = await pagina.createCDPSession()
await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: pasta })

await pagina.click('.resultado__baixar')
for (let i = 0; i < 40; i++) {
  const arquivos = await readdir(pasta)
  if (arquivos.some((a) => a.endsWith('.png') && a !== 'foto.png')) break
  await espera(250)
}

const baixados = (await readdir(pasta)).filter((a) => a.endsWith('.png') && a !== 'foto.png')
conferir(
  'O arquivo baixado tem o nome da campanha',
  baixados[0] === 'foto-perfil-dr-bruno-resende-4400.png',
  baixados.join(', '),
)

const png = await readFile(join(pasta, baixados[0]))
const dim = dimensoesPng(png)
conferir('O arquivo baixado é PNG de verdade', dim.assinatura === true)
conferir(
  'Perfil sai em 2048 x 2048',
  dim.largura === 2048 && dim.altura === 2048,
  `${dim.largura} x ${dim.altura}`,
)

await pagina.click('.arte__aba[data-formato="story"]')
await espera(800)
await pagina.click('.resultado__baixar')
for (let i = 0; i < 40; i++) {
  const arquivos = await readdir(pasta)
  if (arquivos.some((a) => a.startsWith('story-'))) break
  await espera(250)
}
const doStory = (await readdir(pasta)).find((a) => a.startsWith('story-'))
conferir('O story também baixa', doStory === 'story-dr-bruno-resende-4400.png', String(doStory))

const dimStory = dimensoesPng(await readFile(join(pasta, doStory)))
conferir(
  'Story sai em 1080 x 1920',
  dimStory.largura === 1080 && dimStory.altura === 1920,
  `${dimStory.largura} x ${dimStory.altura}`,
)

await pagina.click('.arte__aba[data-formato="perfil"]')
await espera(400)

/* Nenhum alvo de toque abaixo de 44px na largura mais apertada. */
await pagina.setViewport({ width: 360, height: 800 })
await espera(500)
const alvos = await pagina.evaluate(() => {
  const seletor = '#arte button, #arte label.btn, #arte input[type="range"]'
  return [...document.querySelectorAll(seletor)]
    .map((e) => ({ classe: e.className, altura: Math.round(e.getBoundingClientRect().height) }))
    .filter((e) => e.altura > 0 && e.altura < 44)
})
conferir(
  'Nenhum alvo de toque abaixo de 44px em 360px',
  alvos.length === 0,
  alvos.map((a) => `${a.classe}:${a.altura}`).join(' | '),
)
```

- [ ] **Step 2: Rodar para ver falhar**

```bash
URL_ALVO=http://localhost:5181 node scripts/provar.mjs
```

Esperado: FALHA em `Prévia desenha a mesma cena` e nas seguintes.

- [ ] **Step 3: Acrescentar o texto da medida a `candidato.js`**

Dentro de `arte`, ao lado de `acoes`:

```js
    medida: (formato, largura, altura) => `${formato} • PNG ${largura} × ${altura} px`,
```

- [ ] **Step 4: Escrever o componente**

Crie `src/components/arte/Resultado.jsx`:

```jsx
import { useRef, useState } from 'react'
import { usePintura } from '../../lib/useArte.js'

/* O cartão 3: prévia, medida do arquivo, e os dois botões. */
export function Resultado({ quadro, cena, formato, pronto, aoExportar, aoAvisar, textos }) {
  const previa = useRef(null)
  const [ocupado, setOcupado] = useState(false)

  usePintura(previa, cena, quadro, 320)

  const entregar = async (comoPartilha) => {
    setOcupado(true)
    try {
      const arquivo = await aoExportar()

      if (comoPartilha && navigator.canShare?.({ files: [arquivo] })) {
        try {
          await navigator.share({ files: [arquivo], title: formato.rotulo })
          return
        } catch {
          /* A pessoa cancelou a folha de compartilhamento. Não é erro, e não
             merece nem aviso nem download por baixo do pano. */
          return
        }
      }

      const url = URL.createObjectURL(arquivo)
      const a = document.createElement('a')
      a.href = url
      a.download = arquivo.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1500)

      if (comoPartilha) aoAvisar('semPartilha')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <>
      <div
        className="resultado__palco"
        style={{ aspectRatio: `${quadro.largura} / ${quadro.altura}` }}
      >
        <canvas ref={previa} className="resultado__previa" role="img" aria-label={formato.rotulo} />
      </div>

      <p className="resultado__medida">
        {textos.medida(formato.rotulo, quadro.largura, quadro.altura)}
      </p>

      <button
        type="button"
        className="btn btn--primario resultado__baixar"
        disabled={!pronto || ocupado}
        onClick={() => entregar(false)}
      >
        <span className="btn__texto">{textos.acoes.baixar}</span>
      </button>

      <button
        type="button"
        className="btn btn--secundario resultado__compartilhar"
        disabled={!pronto || ocupado}
        onClick={() => entregar(true)}
      >
        <span className="btn__texto">{textos.acoes.compartilhar}</span>
      </button>
    </>
  )
}
```

- [ ] **Step 5: Ligar no `Arte.jsx`**

Acrescente o import:

```jsx
import { Resultado } from './Resultado.jsx'
```

Pegue `molduraPronta` e `exportar` do hook:

```jsx
  const { estado, despachar, formato, quadro, cena, molduraPronta, escolherFoto, exportar } =
    useArte(arte.formatos)
```

E preencha o terceiro cartão:

```jsx
          <article className="cartao arte__cartao">
            <h3 className="arte__passo">
              <span className="arte__passo-num">3</span>
              {arte.passos[2]}
            </h3>
            <Resultado
              quadro={quadro}
              cena={cena}
              formato={formato}
              pronto={!!estado.foto && molduraPronta}
              aoExportar={exportar}
              aoAvisar={(mensagem) => despachar({ tipo: 'erro', mensagem })}
              textos={arte}
            />
          </article>
```

- [ ] **Step 6: Escrever o CSS do resultado**

Acrescente ao fim de `src/styles/arte.css`:

```css
/* ---------- Resultado ---------- */

.resultado__palco {
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 0.9rem;
  background-color: var(--color-papel-alto);
  background-image: repeating-conic-gradient(
    var(--color-papel-fundo) 0% 25%,
    var(--color-papel-alto) 0% 50%
  );
  background-size: 18px 18px;
}

.resultado__previa {
  display: block;
  width: 100%;
  height: 100%;
}

.resultado__medida {
  margin: 0;
  text-align: center;
  font-size: var(--text-mini);
  color: var(--color-tinta-fraca);
}

.resultado__baixar,
.resultado__compartilhar {
  width: 100%;
  cursor: pointer;
  border: 0;
}

.resultado__baixar:disabled,
.resultado__compartilhar:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}
```

- [ ] **Step 7: Rodar as provas até passarem**

```bash
URL_ALVO=http://localhost:5181 node scripts/provar.mjs
```

Esperado: as oito provas novas em OK, e nenhuma regressão em nada acima.

- [ ] **Step 8: Commit**

```bash
git add src/components/arte/Resultado.jsx src/components/arte/Arte.jsx src/styles/arte.css src/data/candidato.js scripts/provar.mjs
git commit -m "feat: prévia, download e compartilhamento da arte

O PNG é montado num canvas de tamanho nativo criado no instante da
exportação e conferido de ponta a ponta: a prova baixa o arquivo pelo
Chrome e lê o cabeçalho IHDR, 2048x2048 no perfil e 1080x1920 no story.

Cancelar a folha de compartilhamento não vira erro nem baixa por baixo do
pano; só a ausência de suporte cai para download, com aviso.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Fechamento — build, capturas e relato

**Files:**
- Modify: `README.md`
- Test: `scripts/provar.mjs`, `scripts/shots.mjs`, `npm run build`

**Interfaces:**
- Consumes: tudo das tasks anteriores.
- Produces: nada de código. Um relato com números medidos.

- [ ] **Step 1: Rodar a suíte inteira**

```bash
npm run provar:unidade
```

Esperado: `pass 22`, `fail 0`.

```bash
URL_ALVO=http://localhost:5181 node scripts/provar.mjs
```

Esperado: todas as provas em OK, incluindo `Nenhum erro no console`, as seis de rolagem lateral e `Blocos revelam ao entrar na tela`.

- [ ] **Step 2: Conferir que o build passa e medir o peso**

```bash
npm run build
```

```bash
node -e "
const fs=require('fs'),p=require('path');
const anda=(d)=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?anda(p.join(d,e.name)):[p.join(d,e.name)]);
const m=anda('dist/assets/molduras');
const t=m.reduce((s,f)=>s+fs.statSync(f).size,0);
console.log(m.length,'arquivos,',(t/1048576).toFixed(2),'MB');
"
```

Esperado: `36 arquivos` e um total abaixo de 4,00 MB. Registre o número real.

- [ ] **Step 3: Capturar a seção**

```bash
node scripts/shots.mjs
```

Confira o PNG da seção `arte` em `shots/`, no desktop e no celular. Olhe três coisas: os três cartões alinhados no topo, a grade sem miniatura esticada, e a moldura escolhida com anel e selo visíveis.

- [ ] **Step 4: Passar os olhos no celular de verdade**

Com o painel Browser em 390 × 844, envie uma foto, arraste, aproxime com a pinça e baixe. É o gesto que nenhuma prova automática cobre bem.

- [ ] **Step 5: Anotar a funcionalidade no README**

Acrescente à seção que descreve as seções da página uma linha para `Sua arte`, dizendo o que ela faz, onde ficam as molduras e como refazê-las (`npm run molduras`).

- [ ] **Step 6: Commit e relato**

```bash
git add README.md
git commit -m "docs: anota a seção Sua arte e o script de molduras no README

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

No relato final, dê os números medidos, não adjetivos: o peso total dos assets antes e depois, quantas provas de unidade e de comportamento passaram, e qualquer teto que tenha sido estourado.

---

## Notas para quem executa

**O servidor de desenvolvimento sobe pelo painel Browser**, com a configuração `lp-bruno-resende` de `.claude/launch.json` (porta 5181). Não use `npm run dev` pelo shell.

**Duas suítes, dois propósitos.** `npm run provar:unidade` cobre a geometria e o redutor, roda em menos de um segundo e é o que você usa enquanto escreve as Tasks 2 e 3. `scripts/provar.mjs` cobre o que só existe no navegador, precisa do servidor no ar e é o que fecha as Tasks 4 a 7.

**Ordem das provas em `provar.mjs` importa.** Os blocos das Tasks 5, 6 e 7 assumem o estado que o bloco anterior deixou (formato em perfil, foto carregada). Cada bloco termina voltando o formato para `perfil` justamente por isso. Se inserir uma prova nova no meio, devolva o estado como encontrou.

**Não afrouxe um teto para fazer a prova passar.** Orçamento de 4 MB, zoom de 1 a 3, 44px de alvo de toque e os dois tamanhos de saída vieram do projeto aprovado. Se algum não couber, pare e reporte o número real.
