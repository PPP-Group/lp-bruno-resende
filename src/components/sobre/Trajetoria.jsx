import { useRevelar } from '../../lib/useRevelar.js'

/* A trajetória é uma rota, não uma lista: sai da roça em Mimoso do Sul e chega
   a Brasília. Por isso os marcos ficam enfiados numa linha só, contínua, e não
   em cartões soltos, e por isso a ordem importa e não pode ser embaralhada.

   Os marcos não são datados no briefing (só dois anos aparecem, dentro do
   texto). Numerar com "01 / 02" fingiria uma precisão que a fonte não tem, e é
   por isso que o rótulo de cada parada é a palavra do briefing (Origem,
   Chamado, Vocação), e não um número. */
export function Trajetoria({ titulo, marcos }) {
  const [ref, visivel] = useRevelar()

  return (
    <div ref={ref} className="faixa-conteudo trajetoria revelar" data-visivel={visivel}>
      <h3 className="trajetoria__titulo">{titulo}</h3>

      <ol className="trajetoria__rota">
        {marcos.map((m, i) => (
          <li key={m.marco} className="parada" style={{ '--atraso': `${i * 70}ms` }}>
            <span className="parada__marco">{m.marco}</span>
            <div className="parada__corpo">
              <h4 className="parada__titulo">{m.titulo}</h4>
              <p className="parada__texto">{m.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
