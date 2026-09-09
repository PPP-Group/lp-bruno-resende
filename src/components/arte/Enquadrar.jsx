import { useEffect, useId, useRef } from 'react'
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
  const palco = useRef(null)
  const tela = useRef(null)
  const arrastando = useRef(null)
  const pincada = useRef(null)
  const idArquivo = useId()
  const idAjuda = useId()

  usePintura(tela, cena, quadro, 640)

  const temFoto = !!estado.foto

  /* Os ouvintes nativos lá embaixo são montados uma vez só e sobrevivem a todos
     os quadros. Sem esta gaveta eles enxergariam para sempre o zoom e o formato
     do primeiro render. */
  const atual = useRef(null)
  atual.current = { temFoto, zoom: estado.zoom, quadro }

  const arrastarEm = (dxTela, dyTela) => {
    const caixa = tela.current.getBoundingClientRect()
    despachar({
      tipo: 'arrastar',
      dx: dxTela / caixa.width,
      dy: dyTela / caixa.height,
      quadro: atual.current.quadro,
    })
  }

  /* Roda e pinça precisam de ouvinte nativo com `passive: false`.
     ----------------------------------------------------------------------
     O React registra `wheel`, `touchstart` e `touchmove` como PASSIVOS no
     contêiner raiz. Num ouvinte passivo o navegador ignora `preventDefault()`,
     então um `onWheel` que chama `preventDefault` não segura nada: a roda
     aproximava a foto e rolava a página junto. Só o caminho nativo funciona.

     A saída antecipada sem foto é de propósito: com o cartão vazio, a roda tem
     de rolar a página como em qualquer outro lugar. */
  useEffect(() => {
    const el = palco.current
    if (!el) return

    const naRoda = (e) => {
      const { temFoto: tem, zoom, quadro: q } = atual.current
      if (!tem) return
      e.preventDefault()
      despachar({ tipo: 'zoom', zoom: zoom + (e.deltaY < 0 ? 0.08 : -0.08), quadro: q })
    }

    const distancia = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

    const noToqueMove = (e) => {
      const { temFoto: tem, quadro: q } = atual.current
      if (!tem) return
      e.preventDefault()

      if (e.touches.length === 1 && arrastando.current) {
        const t = e.touches[0]
        arrastarEm(t.clientX - arrastando.current.x, t.clientY - arrastando.current.y)
        arrastando.current = { x: t.clientX, y: t.clientY }
      }
      if (e.touches.length === 2 && pincada.current) {
        const razao = distancia(e.touches) / pincada.current.base
        despachar({ tipo: 'zoom', zoom: pincada.current.zoom * razao, quadro: q })
      }
    }

    el.addEventListener('wheel', naRoda, { passive: false })
    el.addEventListener('touchmove', noToqueMove, { passive: false })

    return () => {
      el.removeEventListener('wheel', naRoda)
      el.removeEventListener('touchmove', noToqueMove)
    }
    /* `despachar` do useReducer é estável, e todo o resto entra pela gaveta
       `atual`: por isso a lista de dependências é vazia e os ouvintes são
       montados uma vez só, em vez de trocados a cada tique da roda. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  /* Só marca o ponto de partida do gesto; quem move é o ouvinte nativo. */
  const noToqueComeca = (e) => {
    if (!temFoto) return
    if (e.touches.length === 1) {
      arrastando.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      pincada.current = null
    }
    if (e.touches.length === 2) {
      const [a, b] = e.touches
      pincada.current = {
        base: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        zoom: estado.zoom,
      }
    }
  }

  const noToqueTermina = () => {
    arrastando.current = null
    pincada.current = null
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
      {/* `wheel` e `touchmove` não aparecem aqui de propósito: são montados como
          ouvintes nativos no efeito acima, porque os do React são passivos. */}
      <div
        ref={palco}
        className="enquadrar__palco"
        data-tem-foto={temFoto}
        style={{ aspectRatio: `${quadro.largura} / ${quadro.altura}` }}
        onPointerDown={noPonteiroDesce}
        onPointerMove={noPonteiroMove}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onPointerLeave={soltar}
        onTouchStart={noToqueComeca}
        onTouchEnd={noToqueTermina}
        onTouchCancel={noToqueTermina}
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
