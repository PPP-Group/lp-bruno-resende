import { candidato } from '../../data/candidato.js'
import { FaixaCorrida } from '../FaixaCorrida.jsx'
import { Icone } from '../icons/Icone.jsx'

/* O herói é o cartaz oficial da campanha, e não uma remontagem dele.
   A arte já traz nome, cargo, número, slogan, selo, o mapa do Estado com fotos
   de agenda dentro e a fita rosa. Redesenhar isso em HTML só produziria uma
   versão pior de uma peça que já existe aprovada.

   O que a página acrescenta é o que papel não faz: o selo gira, a faixa corre
   na diagonal por cima da borda de baixo, e os botões ficam logo embaixo.

   O CNPJ que aparecia no canto superior direito da arte era o número de
   exemplo do manual, sem relação com a peça em si. Foi apagado na geração do
   JPG. O CNPJ da campanha entra por texto, no rodapé, via `identidade.cnpj`. */
export function Hero() {
  const { identidade, hero } = candidato

  return (
    <section id="inicio" className="hero">
      <div className="hero__cartaz">
        <img
          className="hero__arte"
          src="/assets/hero-pg10.jpg"
          alt={`${identidade.nome}, ${identidade.cargo} pelo ${identidade.estado}, número ${identidade.numero}. Cuida e salva vidas.`}
          width="4500"
          height="2292"
          decoding="async"
          fetchpriority="high"
        />

        {/* Pousado exatamente sobre o selo impresso na arte (coordenadas em
            hero.css). É o único movimento que o papel não tem. */}
        <img className="hero__selo" src="/assets/selo.svg" alt="" width="514" height="514" />

        <FaixaCorrida className="hero__faixa" />
      </div>

      <div className="hero__abaixo faixa-conteudo">
        <div className="hero__dizer">
          <h1 className="hero__titulo">{hero.headline}</h1>
          <p className="hero__apoio">{hero.subheadline}</p>
        </div>

        <div className="hero__acao">
          <a className="urna-chip" href="#urna">
            <span className="urna-chip__rotulo">Seu voto para deputado federal</span>
            <strong className="urna-chip__numero">
              {identidade.numero.split('').map((d, i) => (
                <span key={i} className="urna-chip__digito" style={{ '--atraso': `${400 + i * 110}ms` }}>
                  {d}
                </span>
              ))}
            </strong>
            <span className="urna-chip__treino">
              <Icone nome="tocar" tamanho={18} />
              Ensaiar o voto
            </span>
          </a>

          <div className="hero__botoes">
            <a
              className="btn btn--secundario"
              href={hero.ctaSecundario.href}
              style={{ '--btn-vazado-inverso': 'var(--color-mar)' }}
            >
              <span className="btn__texto">{hero.ctaSecundario.texto}</span>
            </a>
            <a className="btn btn--primario" href={hero.ctaPrimario.href}>
              {hero.ctaPrimario.texto}
            </a>
          </div>
        </div>
      </div>

      <div className="hero__provas">
        <div className="hero__provas-interior faixa-conteudo">
          {hero.provas.map((p) => (
            <div key={p.rotulo} className="prova">
              <strong className="prova__valor">{p.valor}</strong>
              <span className="prova__rotulo">{p.rotulo}</span>
              <span className="prova__detalhe">{p.detalhe}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
