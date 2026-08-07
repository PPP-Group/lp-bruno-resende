import { useState } from 'react'
import { candidato } from '../../data/candidato.js'
import { useRevelar } from '../../lib/useRevelar.js'
import { EixoCard } from './EixoCard.jsx'

export function Propostas() {
  const { propostas } = candidato
  const [ref, visivel] = useRevelar()

  /* O primeiro eixo já abre. Uma seção de propostas que começa toda fechada
     parece vazia, e o eleitor que não toca em nada sai sem ler proposta
     nenhuma, que é justamente o que esta seção existe para evitar. */
  const [aberto, setAberto] = useState(0)

  return (
    <section id="propostas" className="secao propostas">
      <div ref={ref} className="faixa-conteudo revelar" data-visivel={visivel}>
        <div className="propostas__cabeca">
          <p className="rotulo">{propostas.rotulo}</p>
          <h2 className="titulo-secao">{propostas.titulo}</h2>
          <p className="chamada-secao">{propostas.chamada}</p>
        </div>

        <ul className="propostas__lista">
          {propostas.eixos.map((eixo, i) => (
            <EixoCard
              key={eixo.titulo}
              eixo={eixo}
              aberto={aberto === i}
              aoAlternar={() => setAberto(aberto === i ? null : i)}
            />
          ))}
        </ul>

        <div className="propostas__pe">
          <p className="propostas__chamada-final">{propostas.chamadaFinal}</p>
          <a className="btn btn--primario" href={propostas.ctaFinal.href}>
            {propostas.ctaFinal.texto}
          </a>
        </div>
      </div>
    </section>
  )
}
