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
            aria-label={moldura.rotulo}
            tabIndex={marcada ? 0 : -1}
            data-id={moldura.id}
            className="molduras__opcao"
            onClick={() => aoEscolher(i)}
          >
            {/* O rótulo já vem do aria-label do botão. Repeti-lo no alt faria o
                leitor de tela anunciar a mesma moldura duas vezes. */}
            <img src={caminhoMini(moldura.id)} alt="" loading="lazy" />
            <span className="molduras__selo" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
