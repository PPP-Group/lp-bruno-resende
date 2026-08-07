import { candidato, redesAtivas } from '../../data/candidato.js'
import { useRevelar } from '../../lib/useRevelar.js'
import { Marca } from '../icons/Icone.jsx'
import { Formulario } from './Formulario.jsx'

export function Contato() {
  const { contato } = candidato
  const [ref, visivel] = useRevelar()
  const redes = redesAtivas()

  return (
    <section id="contato" className="secao contato">
      <div ref={ref} className="faixa-conteudo contato__interior revelar" data-visivel={visivel}>
        <div className="contato__dizer">
          <p className="rotulo">{contato.rotulo}</p>
          <h2 className="titulo-secao">{contato.titulo}</h2>
          <p className="chamada-secao">{contato.chamada}</p>

          {redes.length > 0 && (
            <div className="contato__redes">
              <p className="contato__redes-titulo">Acompanhe a campanha</p>
              <ul>
                {redes.map((r) => (
                  <li key={r.nome}>
                    <a href={r.href} target="_blank" rel="noopener noreferrer" className="rede">
                      <Marca nome={r.nome} tamanho={22} />
                      <span className="rede__nome">{r.arroba ?? r.nome}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Formulario />
      </div>
    </section>
  )
}
