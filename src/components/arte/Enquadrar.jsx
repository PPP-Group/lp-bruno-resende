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

  const distancia = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)

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
