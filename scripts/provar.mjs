/* Provas de comportamento, o que captura de tela não mostra.
   Uso: URL_ALVO=http://localhost:PORTA node scripts/provar.mjs */

import { mkdtemp, writeFile, readdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import zlib from 'node:zlib'

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
const pulados = []
const conferir = (nome, ok, detalhe = '') => {
  resultados.push({ nome, ok, detalhe })
  console.log(`${ok ? 'OK  ' : 'FALHA'} ${nome}${detalhe ? `, ${detalhe}` : ''}`)
}

/* Prova de uma parte da página que não existe mais. Não vira OK e não vira
   FALHA: fica visível no rodapé até alguém decidir se o recurso volta ou se a
   prova sai junto com ele. */
const pular = (nome, motivo) => {
  pulados.push({ nome, motivo })
  console.log(`PULADO ${nome}, ${motivo}`)
}

/* Um PNG de teste, gerado na hora: nada binário entra no repositório. As
   dimensões são deitadas de propósito, para exercitar o cover num quadro
   quadrado. Cada quadrante tem uma cor, o que faz dar para perceber que o
   desenho mudou depois de arrastar. */
const pngDeTeste = (largura = 1200, altura = 600) => {
  const cru = Buffer.alloc((largura * 3 + 1) * altura)
  let p = 0
  for (let y = 0; y < altura; y++) {
    cru[p++] = 0 // filtro da linha: nenhum
    for (let x = 0; x < largura; x++) {
      cru[p++] = x < largura / 2 ? 230 : 20
      cru[p++] = y < altura / 2 ? 200 : 40
      cru[p++] = 120
    }
  }

  const pedaco = (tipo, dados) => {
    const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
    const tam = Buffer.alloc(4)
    tam.writeUInt32BE(dados.length)
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(zlib.crc32(corpo))
    return Buffer.concat([tam, corpo, crc])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largura, 0)
  ihdr.writeUInt32BE(altura, 4)
  ihdr[8] = 8 // 8 bits por canal
  ihdr[9] = 2 // truecolor, sem alfa

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

/* ---------- 3. A urna só reconhece o número certo ----------
   O simulador de urna saiu da página em algum momento e esta prova ficou para
   trás, quebrando a suíte inteira num TypeError antes de chegar às de baixo.
   Enquanto ninguém decide se ele volta, a prova se anuncia como pulada. */
await pagina.setViewport({ width: 1440, height: 900 })
await espera(300)

const temUrna = await pagina.evaluate(() => !!document.getElementById('urna'))
if (!temUrna) {
  pular('Simulador de urna', 'a seção #urna não existe mais na página')
}

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

if (temUrna) {
  await pagina.evaluate(() => document.getElementById('urna').scrollIntoView())
  await espera(600)

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
}

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

/* ---------- 9. Gerador de artes: a seção existe e está no lugar ---------- */
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

/* ---------- 10. Gerador de artes: a grade de molduras ---------- */
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

/* ---------- 11. Gerador de artes: enquadramento ---------- */
const pasta = await mkdtemp(join(tmpdir(), 'artes-'))
const caminhoFoto = join(pasta, 'foto.png')
await writeFile(caminhoFoto, pngDeTeste())

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
conferir('Canvas de trabalho não é o tamanho nativo', comFoto.largura < 2048, `${comFoto.largura}px`)

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

/* Em zoom 1, uma foto 1200x600 num quadro quadrado sobra só na horizontal:
   arrastar na vertical não pode mexer em nada. */
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
conferir(
  'Controle de zoom vai de 1 a 3',
  await pagina.evaluate((e) => e.min === '1' && e.max === '3', zoom),
)

// Trocar de moldura tem de mudar o que está desenhado, não só o aria-checked.
const antesDaMoldura = await assinar()
await pagina.click('.molduras__opcao[data-id="perfil-03"]')
await espera(900)
conferir('Trocar de moldura muda o desenho', (await assinar()) !== antesDaMoldura)

await pagina.click('.molduras__opcao[data-id="perfil-01"]')
await espera(600)

/* A foto sobrevive à troca de formato. */
await pagina.click('.arte__aba[data-formato="story"]')
await espera(900)
const noStoryComFoto = await opacidade()
conferir('A foto sobrevive à troca de formato', noStoryComFoto.opacos === noStoryComFoto.total)
conferir(
  'Canvas assume a proporção do story',
  (noStoryComFoto.largura / noStoryComFoto.altura).toFixed(4) === (1080 / 1920).toFixed(4),
  `${noStoryComFoto.largura}x${noStoryComFoto.altura}`,
)

await pagina.click('.arte__aba[data-formato="perfil"]')
await espera(600)

/* ---------- 12. Contadores e revelações ao percorrer a página ----------
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
for (const p of pulados) console.log(`PULADA: ${p.nome}, ${p.motivo}`)
process.exit(falhas.length ? 1 : 0)
