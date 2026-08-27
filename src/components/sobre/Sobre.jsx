import { candidato } from '../../data/candidato.js'
import { useRevelar } from '../../lib/useRevelar.js'
import { Trajetoria } from './Trajetoria.jsx'
import { Galeria } from './Galeria.jsx'
import { Videos } from './Videos.jsx'

export function Sobre() {
  const { sobre } = candidato
  const [ref, visivel] = useRevelar()

  return (
    <section id="sobre" className="secao sobre">
      <div className="faixa-conteudo">
        <div ref={ref} className="sobre__abertura revelar" data-visivel={visivel}>
          <div className="sobre__dizer">
            <p className="rotulo">{sobre.rotulo}</p>
            <h2 className="titulo-secao sobre__titulo">{sobre.titulo}</h2>

            <div className="sobre__texto">
              {sobre.biografia.map((paragrafo, i) => (
                <p key={i}>{paragrafo}</p>
              ))}
            </div>
          </div>

          <figure className="sobre__figura">
            <img
              src="/assets/bruno-sobre.jpg"
              alt="Dr. Bruno Resende de jaleco branco, em material de campanha"
              width="941"
              height="1200"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="sobre__citacao">
              <blockquote>{sobre.citacao}</blockquote>
              <cite>{candidato.identidade.nome}</cite>
            </figcaption>
          </figure>
        </div>
      </div>

      <Trajetoria titulo={sobre.trajetoriaTitulo} marcos={sobre.trajetoria} />
      <Galeria titulo={sobre.galeriaTitulo} itens={sobre.galeria} />
      <Videos titulo={sobre.videosTitulo} videos={sobre.videos} perfil={sobre.videosPerfil} />
    </section>
  )
}
