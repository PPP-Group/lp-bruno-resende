/* Provas de comportamento, o que captura de tela não mostra.
   Uso: URL_ALVO=http://localhost:PORTA node scripts/provar.mjs */

import puppeteer from 'puppeteer-core'

const URL = process.env.URL_ALVO ?? 'http://localhost:5181'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const navegador = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--disable-gpu', '--force-color-profile=srgb'],
})

const espera = (ms) => new Promise((r) => setTimeout(r, ms))
const resultados = []
const conferir = (nome, ok, detalhe = '') => {
  resultados.push({ nome, ok, detalhe })
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${nome}${detalhe ? `, ${detalhe}` : ''}`)
}

const pagina = await navegador.newPage()
await pagina.setViewport({ width: 1440, height: 900 })
await pagina.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])

const erros = []
pagina.on('pageerror', (e) => erros.push(String(e)))
pagina.on('console', (m) => m.type() === 'error' && erros.push(m.text()))

await pagina.goto(URL, { waitUntil: 'networkidle0' })
await pagina.evaluate(() => document.fonts.ready)
await espera(800)

/* ---------- 1. A fonte da campanha carregou de verdade ---------- */
const fonte = await pagina.evaluate(async () => {
  await document.fonts.ready
  return {
    carregada: document.fonts.check('600 2rem "Clash Display"'),
    titulo: getComputedStyle(document.querySelector('.hero__titulo')).fontFamily,
  }
})
conferir('Clash Display carregada', fonte.carregada, fonte.titulo)

/* ---------- 2. Sem rolagem horizontal ---------- */
for (const largura of [360, 390, 768, 1024, 1440, 1920]) {
  await pagina.setViewport({ width: largura, height: 900 })
  await espera(350)
  const r = await pagina.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    tela: document.documentElement.clientWidth,
  }))
  conferir(`Sem rolagem lateral em ${largura}px`, r.doc <= r.tela + 1, `doc ${r.doc} / tela ${r.tela}`)
}

/* ---------- 3. A urna só reconhece o número certo ---------- */
await pagina.setViewport({ width: 1440, height: 900 })
await espera(300)
await pagina.evaluate(() => document.getElementById('urna').scrollIntoView())
await espera(600)

const teclar = async (numero) => {
  const teclas = await pagina.$$('.urna__tecla')
  for (const d of numero) {
    for (const t of teclas) {
      const texto = await pagina.evaluate((e) => e.textContent.trim(), t)
      if (texto === d) {
        await t.click()
        break
      }
    }
  }
  await espera(250)
}

const limpar = async () => {
  const botoes = await pagina.$$('.urna__tecla--corrige')
  await botoes[0].click()
  await espera(200)
}

await teclar('4400')
let estado = await pagina.evaluate(() => ({
  cartao: Boolean(document.querySelector('.urna__cartao')),
  nulo: Boolean(document.querySelector('.urna__nulo')),
  nome: document.querySelector('.urna__cartao strong')?.textContent,
}))
conferir('4400 mostra o candidato', estado.cartao &&!estado.nulo, estado.nome ?? '')

await limpar()
await teclar('1234')
estado = await pagina.evaluate(() => ({
  cartao: Boolean(document.querySelector('.urna__cartao')),
  nulo: Boolean(document.querySelector('.urna__nulo')),
}))
conferir('1234 dá voto nulo', estado.nulo &&!estado.cartao)

await limpar()
await teclar('4040')
estado = await pagina.evaluate(() => ({
  cartao: Boolean(document.querySelector('.urna__cartao')),
  nulo: Boolean(document.querySelector('.urna__nulo')),
}))
conferir('4040 (dígitos certos, ordem errada) dá voto nulo', estado.nulo &&!estado.cartao)
await limpar()

/* ---------- 4. Sanfona das propostas ---------- */
const eixos = await pagina.evaluate(() => {
  const abertos = [...document.querySelectorAll('.eixo')].filter((e) => e.dataset.aberto === 'true')
  return { total: document.querySelectorAll('.eixo').length, abertos: abertos.length }
})
conferir('Um eixo começa aberto', eixos.abertos === 1, `${eixos.abertos} de ${eixos.total}`)

await pagina.evaluate(() => document.querySelectorAll('.eixo__botao')[2].click())
await espera(300)
const depois = await pagina.evaluate(() => ({
  aberto: [...document.querySelectorAll('.eixo')].findIndex((e) => e.dataset.aberto === 'true'),
  aria: document.querySelectorAll('.eixo__botao')[2].getAttribute('aria-expanded'),
}))
conferir('Abrir o terceiro fecha o primeiro', depois.aberto === 2 && depois.aria === 'true')

/* ---------- 5. Mapa: pontos dentro do contorno ---------- */
const mapa = await pagina.evaluate(() => {
  const svg = document.querySelector('.mapa__desenho')
  const contorno = svg.querySelector('.mapa__contorno')
  const pontos = [...svg.querySelectorAll('.ponto__miolo')]
  return pontos.map((p) => {
    const x = Number(p.getAttribute('cx'))
    const y = Number(p.getAttribute('cy'))
    return { x: Math.round(x), y: Math.round(y), dentro: contorno.isPointInFill(new DOMPoint(x, y)) }
  })
})
conferir(
  'Todos os municípios caem dentro do Estado',
  mapa.every((p) => p.dentro),
  `${mapa.filter((p) => p.dentro).length}/${mapa.length}`,
)

/* ---------- 6. Selecionar no mapa muda a leitura ---------- */
await pagina.evaluate(() => document.querySelectorAll('.cidade')[3].click())
await espera(250)
const leitura = await pagina.evaluate(() => ({
  cidade: document.querySelector('.mapa__cidade').textContent,
  valor: document.querySelector('.mapa__valor').textContent,
  ativos: document.querySelectorAll('.ponto[data-ativo="true"]').length,
}))
conferir('Clicar na lista acende um ponto só', leitura.ativos === 1, `${leitura.cidade} ${leitura.valor}`)

/* ---------- 7. Navegação por teclado alcança tudo ----------
   `button:not([disabled])` sozinho pega até um botão com `tabindex="-1"`, que
   o teclado pula de propósito (é o caso do véu atrás da gaveta do menu: um
   alvo só de clique/toque para fechar, tirado da leitura de tela com
   `aria-hidden`). Sem excluir esses dois casos aqui, o teste cobra rótulo de
   um elemento que nenhuma tecnologia assistiva chega a anunciar. */
const foco = await pagina.evaluate(() => {
  const focaveis = [
    ...document.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]'),
  ].filter((el) => el.getAttribute('tabindex') !== '-1' && el.getAttribute('aria-hidden') !== 'true')

  const semRotulo = focaveis.filter((el) => {
    const texto = (el.textContent || '').trim()
    const rotulo = el.getAttribute('aria-label') || el.getAttribute('title')
    return !texto && !rotulo && el.tagName !== 'INPUT' && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA'
  })
  return { total: focaveis.length, semRotulo: semRotulo.map((e) => e.className) }
})
conferir('Todo alvo focável tem rótulo', foco.semRotulo.length === 0, `${foco.total} focáveis`)

/* ---------- 8. Campos do formulário têm label ligado ---------- */
const campos = await pagina.evaluate(() => {
  const soltos = []
  for (const c of document.querySelectorAll('.formulario input,.formulario select,.formulario textarea')) {
    const porId = c.id && document.querySelector(`label[for="${c.id}"]`)
    const porDentro = c.closest('label')
    if (!porId &&!porDentro) soltos.push(c.name || c.type)
  }
  return soltos
})
conferir('Todo campo tem rótulo', campos.length === 0, campos.join(', '))

/* ---------- 9. Contadores e revelações ao percorrer a página ----------
   Com movimento reduzido o Lenis fica desligado, então window.scrollTo
   funciona, e os IntersectionObserver continuam disparando normalmente, que é
   o que precisa ser provado aqui. */
await pagina.setViewport({ width: 1440, height: 900 })
await pagina.reload({ waitUntil: 'networkidle0' })
await espera(900)

const altura = await pagina.evaluate(() => document.documentElement.scrollHeight)
for (let y = 0; y < altura; y += 700) {
  await pagina.evaluate((t) => window.scrollTo(0, t), y)
  await espera(160)
}
await espera(2200)

const contadores = await pagina.evaluate(() => ({
  valores: [...document.querySelectorAll('[data-contador]')].map((e) => e.textContent),
  revelados: document.querySelectorAll('.revelar[data-visivel="true"]').length,
  revelaveis: document.querySelectorAll('.revelar').length,
}))
conferir('Contadores terminam', contadores.valores.join(',') === '3,42,90,45', contadores.valores.join(','))
conferir(
  'Blocos revelam ao entrar na tela',
  contadores.revelados === contadores.revelaveis,
  `${contadores.revelados}/${contadores.revelaveis}`,
)

conferir('Nenhum erro no console', erros.length === 0, erros.slice(0, 3).join(' | '))

await navegador.close()

const falhas = resultados.filter((r) =>!r.ok)
console.log(`\n${resultados.length - falhas.length}/${resultados.length} provas passaram`)
process.exit(falhas.length ? 1 : 0)
