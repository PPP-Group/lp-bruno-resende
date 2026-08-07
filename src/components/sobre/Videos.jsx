import { useRevelar } from '../../lib/useRevelar.js'

/* Três vídeos: trajetória, Hospital do Câncer e prestação de contas.
   Enquanto os links não chegam, o cartão continua na página com o assunto
   escrito e o estado "em breve", é informação para o eleitor e é a lista de
   produção para a equipe. */
export function Videos({ titulo, videos }) {
  const [ref, visivel] = useRevelar()

  return (
    <div ref={ref} className="faixa-conteudo videos revelar" data-visivel={visivel}>
      <h3 className="videos__titulo">{titulo}</h3>

      <ul className="videos__grade">
        {videos.map((v, i) => {
          const Marcacao = v.href ? 'a' : 'div'
          const extras = v.href ? { href: v.href, target: '_blank', rel: 'noopener noreferrer' } : {}

          return (
            <li key={v.titulo}>
              <Marcacao className="video" data-disponivel={Boolean(v.href)} {...extras}>
                <span className="video__play" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M8 5.2 19 12 8 18.8z" />
                  </svg>
                </span>

                <span className="video__corpo">
                  <span className="video__titulo">{v.titulo}</span>
                  <span className="video__descricao">{v.descricao}</span>
                </span>

                {!v.href && <span className="video__estado">Em breve</span>}
              </Marcacao>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
