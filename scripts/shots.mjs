/* Capturas de tela para revisão de design.
   Usa o Chrome já instalado, nada é baixado.

   Captura seção a seção, no tamanho real da viewport: página inteira não serve,
   porque o Chrome redimensiona a janela para capturar tudo de uma vez e as
   unidades de viewport passam a valer a altura do documento inteiro.

   Uso: node scripts/shots.mjs [pasta-de-saida]
   Variáveis: URL_ALVO, CHROME_PATH, SO=desktop|mobile|verificar|medir */

import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SAIDA = process.argv[2] ?? 'shots'
const URL = process.env.URL_ALVO ?? 'http://localhost:5181'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const ALVO = process.env.SO ?? 'todos'

mkdirSync(SAIDA, { recursive: true })

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-gpu', '--force-color-profile=srgb'],
})

const espera = (ms) => new Promise((r) => setTimeout(r, ms))

async function abrir(largura, altura, reduzido = true) {
  const pagina = await navegador.newPage()
  await pagina.setViewport({ width: largura, height: altura, deviceScaleFactor: 1 })

  /* Sem isto a rolagem com inércia do Lenis briga com o scroll programático: a
     página não sai do topo e nada abaixo da dobra aparece. Emular movimento
     reduzido desliga o Lenis, e de quebra confere o caminho de acessibilidade. */
  if (reduzido) await pagina.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])

  const erros = []
  pagina.on('pageerror', (e) => erros.push(String(e)))
  pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()))

  await pagina.goto(URL, { waitUntil: 'networkidle0' })
  await pagina.evaluate(() => document.fonts.ready)
  await espera(1200)

  if (erros.length) console.log('ERROS NO CONSOLE:', erros.slice(0, 8))
  return pagina
}

async function capturarPercurso(prefixo, largura, altura) {
  const pagina = await abrir(largura, altura)
  const alturaTotal = await pagina.evaluate(() => document.documentElement.scrollHeight)
  const passos = Math.ceil(alturaTotal / altura)

  for (let i = 0; i < passos; i += 1) {
    await pagina.evaluate((topo) => window.scrollTo(0, topo), i * altura)
    await espera(420)
    const arquivo = join(SAIDA, `${prefixo}-${String(i).padStart(2, '0')}.png`)
    await pagina.screenshot({ path: arquivo })
    console.log(arquivo)
  }

  await pagina.close()
}

if (ALVO === 'todos' || ALVO === 'desktop') await capturarPercurso('desktop', 1440, 900)
if (ALVO === 'todos' || ALVO === 'mobile') await capturarPercurso('mobile', 390, 844)
if (ALVO === 'tablet') await capturarPercurso('tablet', 820, 1024)

/* Confere que as revelações por IntersectionObserver disparam com movimento
   normal, o que as capturas, feitas em movimento reduzido, não provam. */
if (ALVO === 'verificar') {
  const pagina = await abrir(1440, 4600, false)
  await espera(3000)
  console.log(
    JSON.stringify(
      await pagina.evaluate(() => ({
        revelaveis: document.querySelectorAll('.revelar').length,
        revelados: document.querySelectorAll('.revelar[data-visivel="true"]').length,
        contadores: [...document.querySelectorAll('[data-contador]')].map((e) => e.textContent),
      })),
      null,
      2,
    ),
  )
  await pagina.close()
}

if (ALVO === 'medir') {
  const seletores = (process.env.SELETORES ?? '.hero__figura,.hero__foto').split(',')
  const pagina = await abrir(Number(process.env.L ?? 1440), Number(process.env.A ?? 900))
  console.log(
    JSON.stringify(
      await pagina.evaluate((lista) => {
        const saida = {}
        for (const sel of lista) {
          saida[sel] = [...document.querySelectorAll(sel)].slice(0, 4).map((el) => {
            const r = el.getBoundingClientRect()
            return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
          })
        }
        saida.rolagemHorizontal = document.documentElement.scrollWidth > document.documentElement.clientWidth
        saida.larguraDoc = document.documentElement.scrollWidth
        return saida
      }, seletores),
      null,
      2,
    ),
  )
  await pagina.close()
}

await navegador.close()
