import { useId } from 'react'
import { Icone } from '../icons/Icone.jsx'

/* Um eixo temático. Abre e fecha como sanfona porque cinco eixos abertos de
   uma vez dão quatro telas de texto corrido, e ninguém lê proposta assim.

   A numeração 01–05 aqui não é enfeite: os eixos têm ordem de prioridade
   declarada no briefing, e a saúde vem primeiro por decisão de campanha. */
export function EixoCard({ eixo, aberto, aoAlternar }) {
  const id = useId()

  return (
    <li className="eixo" data-aberto={aberto}>
      <h3 className="eixo__cabeca">
        <button type="button" className="eixo__botao" onClick={aoAlternar} aria-expanded={aberto} aria-controls={id}>
          <span className="eixo__numero">{eixo.numero}</span>

          <span className="eixo__icone" aria-hidden="true">
            <Icone nome={eixo.icone} tamanho={26} />
          </span>

          <span className="eixo__dizer">
            <span className="eixo__titulo">{eixo.titulo}</span>
            <span className="eixo__resumo">{eixo.resumo}</span>
          </span>

          <span className="eixo__sinal" aria-hidden="true">
            <Icone nome={aberto ? 'menos' : 'mais'} tamanho={22} />
          </span>
        </button>
      </h3>

      <div id={id} className="eixo__gaveta" hidden={!aberto}>
        <ul className="eixo__itens">
          {eixo.itens.map((item, i) => (
            <li key={i}>
              <Icone nome="checar" tamanho={19} className="eixo__marca" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  )
}
