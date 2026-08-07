import { candidato, secoes, redesAtivas } from '../data/candidato.js'
import { Logo } from './Logo.jsx'
import { Marca } from './icons/Icone.jsx'

export function Footer() {
  const { identidade, rodape } = candidato
  const redes = redesAtivas()

  return (
    <footer className="rodape">
      <div className="faixa-conteudo">
        <div className="rodape__topo">
          <div className="rodape__marca">
            <Logo claro altura={92} />
            <p className="slogan rodape__slogan" style={{ '--slogan-tamanho': 'clamp(1.5rem, 3.2vw, 2.25rem)' }}>
              <span>Cuida</span>
              <span>e salva vidas.</span>
            </p>
          </div>

          <nav className="rodape__mapa" aria-label="Seções da página">
            <h2 className="rodape__legenda">Navegar</h2>
            <ul>
              {secoes.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.rotulo}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="rodape__ficha">
            <h2 className="rodape__legenda">A candidatura</h2>
            <dl>
              <div>
                <dt>Cargo</dt>
                <dd>
                  {identidade.cargo} · {identidade.estado}
                </dd>
              </div>
              <div>
                <dt>Número na urna</dt>
                <dd className="rodape__numero">{identidade.numero}</dd>
              </div>
              <div>
                <dt>Partido</dt>
                <dd>{identidade.partido}</dd>
              </div>
              <div>
                <dt>Federação</dt>
                <dd>{identidade.federacao}</dd>
              </div>
              <div>
                <dt>CNPJ da campanha</dt>
                <dd>{identidade.cnpj ?? <span className="rodape__pendente">a informar</span>}</dd>
              </div>
            </dl>

            {redes.length > 0 && (
              <ul className="rodape__redes">
                {redes.map((r) => (
                  <li key={r.nome}>
                    <a href={r.href} target="_blank" rel="noopener noreferrer" aria-label={r.nome}>
                      <Marca nome={r.nome} tamanho={22} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rodape__legal">
          <p>{rodape.disclaimer}</p>
          <p className="rodape__creditos">{rodape.creditos}</p>
        </div>
      </div>
    </footer>
  )
}
