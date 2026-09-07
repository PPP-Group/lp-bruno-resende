import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useRevelar } from '../../lib/useRevelar.js'
import { Icone, Marca } from '../icons/Icone.jsx'
import { VideoModal } from './VideoModal.jsx'

/* As publicações do perfil oficial. O cartão é a capa em 9:16, o formato em que
   a peça foi gravada: cortar para paisagem decapitaria a legenda que a equipe
   queimou no vídeo. Clicar abre o modal com o player do Instagram e o texto do
   post ao lado.

   A lista é um carrossel, não uma grade. São onze peças e crescendo: em grade
   isso vira seis linhas de capa vertical e engole a página inteira entre a
   trajetória e as propostas. Deitado, ocupa uma faixa só e a pessoa decide
   quanto quer ver.

   Entrada de dados sem `codigo` continua desenhada na página no estado "em
   breve": é informação para o eleitor e é a lista de produção para a equipe. */

/* Arrastar com o mouse, roda horizontal do trackpad, setas e a barra de
   rolagem debaixo dos cartões. O arrasto do dedo sobre os cartões não passa
   por aqui: no celular a rolagem nativa do `overflow-x` já é melhor do que
   qualquer coisa que a gente escreva, com inércia e snap do próprio sistema.
   A barra, essa sim, responde ao dedo — é o único controle da faixa por lá. */
function useCarrossel() {
  const trilhoRef = useRef(null)
  const arrasto = useRef(null)
  const bloquearClique = useRef(false)
  const [estado, setEstado] = useState({ antes: false, depois: false, fracao: 1, progresso: 0 })

  const medir = useCallback(() => {
    const el = trilhoRef.current
    if (!el) return
    const sobra = el.scrollWidth - el.clientWidth
    setEstado({
      antes: el.scrollLeft > 4,
      depois: el.scrollLeft < sobra - 4,
      fracao: el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1,
      progresso: sobra > 0 ? el.scrollLeft / sobra : 0,
    })
  }, [])

  useEffect(() => {
    const el = trilhoRef.current
    if (!el) return

    medir()

    /* A roda precisa de `passive: false` para o `preventDefault` valer, e o
       React 18 registra `wheel` como passivo na raiz. Daí o listener na mão.
       O `stopPropagation` é o que impede o gesto horizontal de chegar ao
       listener de janela do Lenis, que consumiria o evento e travaria o
       trilho. Gesto vertical passa reto: rolar a página por cima do carrossel
       tem de continuar rolando a página. */
    const aoRodar = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      e.stopPropagation()
      el.scrollLeft += e.deltaX
    }

    el.addEventListener('wheel', aoRodar, { passive: false })
    el.addEventListener('scroll', medir, { passive: true })
    window.addEventListener('resize', medir)

    return () => {
      el.removeEventListener('wheel', aoRodar)
      el.removeEventListener('scroll', medir)
      window.removeEventListener('resize', medir)
    }
  }, [medir])

  /* Um passo é um cartão mais o vão, lido do próprio layout: assim as setas
     continuam certas quando o CSS muda quantos cartões cabem na tela. */
  const passo = () => {
    const el = trilhoRef.current
    const cartao = el?.firstElementChild
    if (!el || !cartao) return 0
    const vao = parseFloat(getComputedStyle(el).columnGap) || 0
    return cartao.getBoundingClientRect().width + vao
  }

  const andar = (sentido) => {
    trilhoRef.current?.scrollBy({ left: sentido * passo(), behavior: 'smooth' })
  }

  const aoApertar = (e) => {
    /* Dedo não: o `touch-action` do CSS entrega o gesto para a rolagem nativa e
       duplicar isso em JS deixa o movimento com o dobro da velocidade. */
    if (e.pointerType === 'touch') return
    const el = trilhoRef.current
    arrasto.current = { x: e.clientX, inicio: el.scrollLeft, moveu: false }
  }

  const aoMover = (e) => {
    const el = trilhoRef.current
    if (!arrasto.current || !el) return
    const distancia = e.clientX - arrasto.current.x
    if (Math.abs(distancia) <= 5) return

    /* A captura só entra quando o gesto vira arrasto de fato. Com o ponteiro
       capturado o navegador despacha o `click` no elemento que capturou, e não
       no cartão sob o cursor: capturar já no `pointerdown` mataria a abertura
       do modal em todo clique parado. */
    if (!arrasto.current.moveu) {
      arrasto.current.moveu = true
      el.setPointerCapture?.(e.pointerId)
    }

    el.scrollLeft = arrasto.current.inicio - distancia
  }

  const aoSoltar = (e) => {
    const el = trilhoRef.current
    if (!arrasto.current) return
    const moveu = arrasto.current.moveu
    arrasto.current = null
    if (moveu) el?.releasePointerCapture?.(e.pointerId)

    /* Terminar um arrasto em cima de um cartão dispara `click`. Sem esta trava
       o modal abriria toda vez que a pessoa parasse de arrastar. O `click` é
       despachado logo após o `pointerup`, antes de qualquer macrotarefa, então
       um `setTimeout` de zero solta a trava no momento certo. */
    if (moveu) {
      bloquearClique.current = true
      setTimeout(() => {
        bloquearClique.current = false
      }, 0)
    }
  }

  /* ---------- A barra ---------- */

  /* A barra debaixo dos cartões é a rolagem de verdade, não um enfeite de
     posição: clicar leva a pega para onde o dedo caiu e arrastar puxa a faixa
     junto. As contas saem das medidas reais do trilho e da pega, e não das
     porcentagens do CSS, para continuarem certas quando a pega bate no
     tamanho mínimo em telas estreitas. */
  const trilhoDaBarra = useRef(null)
  const pegaRef = useRef(null)
  const arrastoBarra = useRef(false)

  const levarPara = (clientX) => {
    const el = trilhoRef.current
    const barra = trilhoDaBarra.current
    const pega = pegaRef.current
    if (!el || !barra || !pega) return

    const caixa = barra.getBoundingClientRect()
    const larguraPega = pega.getBoundingClientRect().width
    const curso = caixa.width - larguraPega
    if (curso <= 0) return

    const posicao = (clientX - caixa.left - larguraPega / 2) / curso
    el.scrollLeft = Math.min(Math.max(posicao, 0), 1) * (el.scrollWidth - el.clientWidth)
  }

  const aoApertarBarra = (e) => {
    arrastoBarra.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    levarPara(e.clientX)
  }

  const aoMoverBarra = (e) => {
    if (!arrastoBarra.current) return
    levarPara(e.clientX)
  }

  const aoSoltarBarra = (e) => {
    if (!arrastoBarra.current) return
    arrastoBarra.current = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  /* A barra é o único controle da faixa no celular, então também responde ao
     teclado: quem chega nela por Tab precisa poder andar. */
  const aoTeclarBarra = (e) => {
    const el = trilhoRef.current
    if (!el) return
    const teclas = {
      ArrowRight: () => andar(1),
      ArrowLeft: () => andar(-1),
      Home: () => el.scrollTo({ left: 0, behavior: 'smooth' }),
      End: () => el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' }),
    }
    if (!teclas[e.key]) return
    e.preventDefault()
    teclas[e.key]()
  }

  return {
    trilhoRef,
    estado,
    andar,
    bloquearClique,
    gestos: {
      onPointerDown: aoApertar,
      onPointerMove: aoMover,
      onPointerUp: aoSoltar,
      onPointerCancel: aoSoltar,
    },
    barra: {
      trilhoDaBarra,
      pegaRef,
      gestos: {
        onPointerDown: aoApertarBarra,
        onPointerMove: aoMoverBarra,
        onPointerUp: aoSoltarBarra,
        onPointerCancel: aoSoltarBarra,
        onKeyDown: aoTeclarBarra,
      },
    },
  }
}

/* Reel abre com play. Carrossel de artes abre com folhas empilhadas: prometer
   play numa sequência de imagens estáticas é quebrar a expectativa do clique. */
function Glifo({ tipo }) {
  if (tipo === 'carrossel') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="7.5" y="3.5" width="13" height="13" rx="2.5" />
        <path d="M16.5 20.5h-11a2 2 0 0 1-2-2v-11" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M8 5.2 19 12 8 18.8z" />
    </svg>
  )
}

export function Videos({ titulo, videos, perfil }) {
  const [ref, visivel] = useRevelar()
  const [aberto, setAberto] = useState(null)
  const { trilhoRef, estado, andar, bloquearClique, gestos, barra } = useCarrossel()
  /* O `aria-controls` da barra precisa de um id estável entre servidor e
     cliente; `useId` é exatamente isso. */
  const idDoTrilho = useId()

  return (
    <div ref={ref} className="faixa-conteudo videos revelar" data-visivel={visivel}>
      <div className="videos__cabeca">
        <h3 className="videos__titulo">{titulo}</h3>

        <div className="videos__controles">
          {perfil && (
            <a className="videos__perfil" href={perfil} target="_blank" rel="noopener noreferrer">
              <Marca nome="Instagram" tamanho={18} />
              @drbrunoresende_
            </a>
          )}

          <div className="videos__setas">
            <button
              type="button"
              className="videos__seta videos__seta--antes"
              onClick={() => andar(-1)}
              disabled={!estado.antes}
            >
              <Icone nome="seta" tamanho={20} />
              <span className="so-leitor">Ver as publicações anteriores</span>
            </button>
            <button
              type="button"
              className="videos__seta"
              onClick={() => andar(1)}
              disabled={!estado.depois}
            >
              <Icone nome="seta" tamanho={20} />
              <span className="so-leitor">Ver as próximas publicações</span>
            </button>
          </div>
        </div>
      </div>

      {/* `data-antes`/`data-depois` acendem o esmaecido na borda por onde ainda
          há conteúdo: é o que diz, sem texto, que a faixa continua. */}
      <div className="videos__pista" data-antes={estado.antes} data-depois={estado.depois}>
        <ul className="videos__trilho" id={idDoTrilho} ref={trilhoRef} {...gestos}>
          {videos.map((v, i) => (
            <li key={v.codigo ?? v.titulo}>
              {v.codigo ? (
                <button
                  type="button"
                  className="video"
                  onClick={() => {
                    if (bloquearClique.current) return
                    setAberto(i)
                  }}
                >
                  <span className="video__capa">
                    <img
                      src={v.capa}
                      alt={`Capa da publicação: ${v.titulo}`}
                      loading={i < 4 ? 'eager' : 'lazy'}
                      decoding="async"
                      draggable="false"
                    />
                    <span className="video__brilho" aria-hidden="true" />
                    <span className="video__play" aria-hidden="true">
                      <Glifo tipo={v.tipo} />
                    </span>
                    <span className="video__marca" aria-hidden="true">
                      <Marca nome="Instagram" tamanho={16} />
                      {v.tipo === 'carrossel' ? 'Carrossel' : 'Reel'}
                    </span>
                  </span>

                  <span className="video__corpo">
                    <span className="video__titulo">{v.titulo}</span>
                    <span className="video__descricao">{v.descricao}</span>
                    <span className="video__acao">
                      {v.tipo === 'carrossel' ? 'Ver' : 'Assistir'}
                      <Icone nome="seta" tamanho={16} />
                    </span>
                  </span>
                </button>
              ) : (
                <div className="video video--vazio">
                  <span className="video__capa video__capa--vazia" aria-hidden="true">
                    <span className="video__play">
                      <Glifo tipo={v.tipo} />
                    </span>
                  </span>

                  <span className="video__corpo">
                    <span className="video__titulo">{v.titulo}</span>
                    <span className="video__descricao">{v.descricao}</span>
                    <span className="video__estado">Em breve</span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* A barra de rolagem da faixa. Diz onde a pessoa está e leva para onde
          ela quiser ir: no celular não há setas, e a barra do sistema está
          escondida. A área de toque é bem mais alta que o traço desenhado —
          três pixels não se pega com o dedo. */}
      <div
        className="videos__barra"
        role="scrollbar"
        aria-orientation="horizontal"
        aria-controls={idDoTrilho}
        aria-label="Rolar as publicações"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(estado.progresso * 100)}
        tabIndex={0}
        {...barra.gestos}
      >
        <span className="videos__barra-trilho" ref={barra.trilhoDaBarra}>
          <span
            className="videos__barra-pega"
            ref={barra.pegaRef}
            style={{
              '--tamanho': `${Math.max(estado.fracao, 0.12) * 100}%`,
              '--posicao': estado.progresso,
            }}
          />
        </span>
      </div>

      {aberto !== null && (
        <VideoModal
          videos={videos}
          indice={aberto}
          perfil={perfil}
          aoFechar={() => setAberto(null)}
          aoTrocar={setAberto}
        />
      )}
    </div>
  )
}
