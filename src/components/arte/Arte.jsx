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
