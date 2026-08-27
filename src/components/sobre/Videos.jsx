import { useState } from 'react'
import { useRevelar } from '../../lib/useRevelar.js'
import { Icone, Marca } from '../icons/Icone.jsx'
import { VideoModal } from './VideoModal.jsx'

/* Os reels do perfil oficial. O cartão é a capa em 9:16, o formato em que a
   peça foi gravada: cortar para paisagem decapitaria a legenda que a equipe
   queimou no vídeo. Clicar abre o modal com o player do Instagram e o texto
   do post ao lado.

   Entrada de dados sem `codigo` continua desenhada na página no estado "em
   breve": é informação para o eleitor e é a lista de produção para a equipe. */
export function Videos({ titulo, videos, perfil }) {
  const [ref, visivel] = useRevelar()
  const [aberto, setAberto] = useState(null)

  return (
    <div ref={ref} className="faixa-conteudo videos revelar" data-visivel={visivel}>
      <div className="videos__cabeca">
        <h3 className="videos__titulo">{titulo}</h3>
        {perfil && (
          <a className="videos__perfil" href={perfil} target="_blank" rel="noopener noreferrer">
            <Marca nome="Instagram" tamanho={18} />
            @drbrunoresende_
          </a>
        )}
      </div>

      <ul className="videos__grade">
        {videos.map((v, i) => (
          <li key={v.titulo}>
            {v.codigo ? (
              <button
                type="button"
                className="video"
                style={{ '--atraso': `${i * 90}ms` }}
                onClick={() => setAberto(i)}
              >
                <span className="video__capa">
                  <img src={v.capa} alt={`Capa do vídeo: ${v.titulo}`} loading="lazy" decoding="async" />
                  <span className="video__brilho" aria-hidden="true" />
                  <span className="video__play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M8 5.2 19 12 8 18.8z" />
                    </svg>
                  </span>
                  <span className="video__marca" aria-hidden="true">
                    <Marca nome="Instagram" tamanho={16} />
                    Reel
                  </span>
                </span>

                <span className="video__corpo">
                  <span className="video__titulo">{v.titulo}</span>
                  <span className="video__descricao">{v.descricao}</span>
                  <span className="video__acao">
                    Assistir
                    <Icone nome="seta" tamanho={16} />
                  </span>
                </span>
              </button>
            ) : (
              <div className="video video--vazio">
                <span className="video__capa video__capa--vazia" aria-hidden="true">
                  <span className="video__play">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M8 5.2 19 12 8 18.8z" />
                    </svg>
                  </span>
                </span>

                <span className="video__corpo">
                  <span className="video__titulo">{v.titulo}</span>
                  <span className="video__descricao">{v.descricao}</span>
                  <span className="video__estado">Em breve</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {aberto !== null && (
        <VideoModal
          videos={videos}
          indice={aberto}
          perfil={perfil}
          aoFechar={() => setAberto(null)}
          aoTrocar={setAberto}
        />
      )}
    </div>
  )
}
