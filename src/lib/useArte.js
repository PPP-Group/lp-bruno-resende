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

  return {
    estado,
    despachar,
    formato,
    quadro,
    cena,
    molduraPronta: !!moldura,
    escolherFoto,
    exportar,
  }
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
