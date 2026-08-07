import { candidato } from '../../data/candidato.js'
import { useRevelar } from '../../lib/useRevelar.js'
import { useContador } from '../../lib/useContador.js'
import { Icone } from '../icons/Icone.jsx'
import { MapaCuidado } from './MapaCuidado.jsx'

function Numero({ prefixo, valor, sufixo, descricao }) {
  const [ref, atual] = useContador(valor)

  return (
    <li className="numero" ref={ref}>
      <strong className="numero__valor">
        {prefixo}
        <span data-contador>{atual}</span>
        {sufixo}
      </strong>
      <span className="numero__descricao">{descricao}</span>
    </li>
  )
}

export function Conquistas() {
  const { conquistas } = candidato
  const [ref, visivel] = useRevelar()
  const { destaque, entregaExtra } = conquistas

  return (
    <section id="conquistas" className="secao secao--noite conquistas">
      <div className="faixa-conteudo">
        <div ref={ref} className="conquistas__cabeca revelar" data-visivel={visivel}>
          <p className="rotulo rotulo--claro">{conquistas.rotulo}</p>
          <h2 className="titulo-secao">{conquistas.titulo}</h2>
          <p className="chamada-secao">{conquistas.chamada}</p>
        </div>

        {/* ---------- O destaque: a obra que sustenta a candidatura ---------- */}
        <article className="destaque">
          <div className="destaque__dizer">
            <span className="destaque__etiqueta">{destaque.etiqueta}</span>
            <h3 className="destaque__titulo">{destaque.titulo}</h3>
            <p className="destaque__texto">{destaque.texto}</p>
            <p className="destaque__fonte">{destaque.fonte}</p>
          </div>

          <ul className="destaque__dados">
            {destaque.dados.map((d) => (
              <li key={d.rotulo}>
                <strong>{d.valor}</strong>
                <span>{d.rotulo}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* ---------- As leis ---------- */}
        <div className="leis">
          <div className="leis__cabeca">
            <h3 className="leis__titulo">{conquistas.leisTitulo}</h3>
            <p className="leis__chamada">{conquistas.leisChamada}</p>
          </div>

          <ul className="leis__lista">
            {conquistas.leis.map((l) => (
              <li key={l.lei} className="lei" data-autoria={l.autoria}>
                <div className="lei__selo">
                  <Icone nome="lei" tamanho={22} />
                </div>

                <div className="lei__corpo">
                  <p className="lei__referencia">
                    {l.lei} <span aria-hidden="true">·</span> {l.ano}
                    {l.autoria && <em className="lei__autoria">de autoria dele</em>}
                  </p>
                  <h4 className="lei__titulo">{l.titulo}</h4>
                  <p className="lei__texto">{l.texto}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* A unidade de AVC é obra, não lei, fica fora da lista para as duas
              naturezas de entrega não se misturarem. */}
          <div className="entrega-extra">
            <Icone nome="saude" tamanho={26} />
            <div>
              <h4>{entregaExtra.titulo}</h4>
              <p>{entregaExtra.texto}</p>
            </div>
          </div>
        </div>

        {/* ---------- O mapa ---------- */}
        <MapaCuidado
          titulo={conquistas.mapaTitulo}
          chamada={conquistas.mapaChamada}
          nota={conquistas.mapaNota}
          municipios={conquistas.municipios}
        />

        {/* ---------- Os números ---------- */}
        <ul className="numeros">
          {conquistas.numeros.map((n) => (
            <Numero key={n.descricao} {...n} />
          ))}
        </ul>
      </div>
    </section>
  )
}
