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

        <div
          className="arte__abas"
          role="tablist"
          aria-label={arte.titulo}
          onKeyDown={abasNoTeclado}
        >
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
