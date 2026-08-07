import { useState } from 'react'
import { CAMINHO_ES, LARGURA_ES, ALTURA_ES } from '../MapaES.jsx'
import { useRevelar } from '../../lib/useRevelar.js'
import { Icone } from '../icons/Icone.jsx'

/* ============================================================================
   MAPA DO CUIDADO
   ----------------------------------------------------------------------------
   A silhueta do Estado que está no manual de identidade, virada instrumento:
   cada ponto é um município que recebeu destinação do mandato.

   Os pontos ficam onde o município fica de verdade. A silhueta do manual é
   cartograficamente fiel, então dá para converter latitude e longitude em
   posição dentro do viewBox, e é isso que as coordenadas em candidato.js são.
   Se alguém trocar a silhueta por outra, as coordenadas param de valer.

   O mapa e a lista ao lado são a mesma informação em duas formas. A lista não é
   um resumo do mapa: é o caminho de quem usa leitor de tela, de quem está num
   celular estreito e de quem simplesmente prefere ler a caçar pontinho. Os dois
   compartilham a seleção, então tocar num lado acende o outro.
   ========================================================================== */

export function MapaCuidado({ titulo, chamada, nota, municipios }) {
  const [ref, visivel] = useRevelar()
  const [ativo, setAtivo] = useState(0)
  const escolhido = municipios[ativo]

  return (
    <div ref={ref} className="mapa revelar" data-visivel={visivel}>
      <div className="mapa__dizer">
        <h3 className="mapa__titulo">{titulo}</h3>
        <p className="mapa__chamada">{chamada}</p>
      </div>

      <div className="mapa__corpo">
        <div className="mapa__palco">
          <svg
            className="mapa__desenho"
            viewBox={`0 0 ${LARGURA_ES} ${ALTURA_ES}`}
            role="img"
            aria-label="Mapa do Espírito Santo com os municípios alcançados pelo mandato"
          >
            <path className="mapa__contorno" d={CAMINHO_ES} />

            {municipios.map((m, i) => {
              const cx = m.x * LARGURA_ES
              const cy = m.y * ALTURA_ES
              const selecionado = i === ativo

              return (
                <g key={m.nome} className="ponto" data-ativo={selecionado}>
                  {/* A onda: o cuidado chegando. Só pulsa no ponto aceso, para
                      cinco pulsos simultâneos não virarem ruído. */}
                  {selecionado && <circle className="ponto__onda" cx={cx} cy={cy} r="8" />}
                  <circle className="ponto__miolo" cx={cx} cy={cy} r={m.destaque ? 9 : 7} />
                  {/* Alvo de toque generoso, invisível: 7px de raio no viewBox
                      são poucos pixels de alvo real no celular. */}
                  <circle
                    className="ponto__alvo"
                    cx={cx}
                    cy={cy}
                    r="22"
                    onClick={() => setAtivo(i)}
                    onMouseEnter={() => setAtivo(i)}
                  />
                </g>
              )
            })}
          </svg>

        </div>

        <div className="mapa__painel">
          {/* A leitura do ponto aceso vive aqui, e não num balão sobre o mapa:
              um balão preso à coordenada vaza para fora do cartão quando o
              município fica na borda (Guaçuí está a 9% da largura) e no
              celular ele cobriria justamente o mapa que a pessoa está olhando.
              Aqui o valor sempre cabe, sempre no mesmo lugar, e em corpo que se
              lê de longe. */}
          <div className="mapa__leitura" aria-live="polite">
            <strong className="mapa__cidade">{escolhido.nome}</strong>
            <span className="mapa__valor">{escolhido.valor}</span>
            {escolhido.detalhe && <span className="mapa__detalhe">{escolhido.detalhe}</span>}
          </div>

          <ul className="mapa__lista">
            {municipios.map((m, i) => (
              <li key={m.nome}>
                <button
                  type="button"
                  className="cidade"
                  data-ativo={i === ativo}
                  onClick={() => setAtivo(i)}
                  onFocus={() => setAtivo(i)}
                >
                  <Icone nome="local" tamanho={20} className="cidade__pino" />
                  <span className="cidade__nome">
                    {m.nome}
                    {m.detalhe && <span className="cidade__detalhe">{m.detalhe}</span>}
                  </span>
                  <span className="cidade__valor">{m.valor}</span>
                </button>
              </li>
            ))}
          </ul>

          <p className="mapa__nota">{nota}</p>
        </div>
      </div>
    </div>
  )
}
