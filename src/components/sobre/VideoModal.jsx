import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icone, Marca } from '../icons/Icone.jsx'

/* O player é o embed oficial do Instagram dentro de um iframe. Não baixamos o
   vídeo: a exibição continua contando para o alcance do perfil e a campanha não
   passa a hospedar peça eleitoral em servidor próprio.

   O embed não tem altura fixa. Ele se mede sozinho e avisa a página que o
   contém por `postMessage`, com `{"type":"MEASURE","details":{"height":N}}`,
   que é o mesmo protocolo que o embed.js do Instagram consome. Ouvimos direto
   essa mensagem em vez de carregar o script deles: evita um terceiro script de
   rastreio na página e não muda o resultado. Enquanto a medida não chega, o
   CSS segura uma altura de reel (9:16 mais o cabeçalho do embed). */
function useAlturaDoEmbed(codigo) {
  const [altura, setAltura] = useState(null)

  useEffect(() => {
    setAltura(null)

    const aoReceber = (evento) => {
      try {
        if (!/(^|\.)instagram\.com$/.test(new URL(evento.origin).hostname)) return

        const dados = typeof evento.data === 'string' ? JSON.parse(evento.data) : evento.data

        /* O embed manda MEASURE com altura 0 antes de montar; só a segunda
           medida serve. Sem o teste de valor, o player colapsaria. */
        if (dados?.type === 'MEASURE' && dados.details?.height > 0) setAltura(dados.details.height)
      } catch {
        /* Origem sem host (`null`) ou mensagem que não é JSON: não é nossa. */
      }
    }

    window.addEventListener('message', aoReceber)
    return () => window.removeEventListener('message', aoReceber)
  }, [codigo])

  return altura
}

/* Modal do vídeo: player à esquerda, o que ele diz à direita. As setas trocam
   de vídeo sem fechar, o Esc fecha, o foco entra no botão de fechar e volta
   para o cartão que abriu, senão quem navega por teclado cai no fim da página. */
export function VideoModal({ videos, indice, perfil, aoFechar, aoTrocar }) {
  const fecharRef = useRef(null)
  const anteriorRef = useRef(null)
  const video = videos[indice]
  const altura = useAlturaDoEmbed(video?.codigo)

  useEffect(() => {
    anteriorRef.current = document.activeElement
    fecharRef.current?.focus()

    const anterior = document.body.style.overflow
    const anteriorHtml = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    /* `html` tem `overflow-x: clip` (base.css) e isso é um valor explícito, não
       o `visible` inicial: trava a propagação do `overflow: hidden` do `body`
       para o elemento raiz, que é quem de fato rola. Sem esta linha o `html`
       segue com `overflow-y: visible` e a barra de rolagem nativa da página
       continua desenhada atrás do modal — e, por ocupar espaço de layout,
       descentraliza a caixa `position: fixed` em relação à janela. */
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = anterior
      document.documentElement.style.overflow = anteriorHtml
      anteriorRef.current?.focus?.()
    }
  }, [])

  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === 'Escape') aoFechar()
      if (e.key === 'ArrowRight') passar(1)
      if (e.key === 'ArrowLeft') passar(-1)
    }

    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  })

  /* Só circula entre os que têm vídeo publicado. */
  const passar = (passo) => {
    const comVideo = videos.map((v, i) => (v.codigo ? i : null)).filter((i) => i !== null)
    if (comVideo.length < 2) return
    const atual = comVideo.indexOf(indice)
    aoTrocar(comVideo[(atual + passo + comVideo.length) % comVideo.length])
  }

  if (!video?.codigo) return null

  const link = `https://www.instagram.com/p/${video.codigo}/`
  const total = videos.filter((v) => v.codigo).length
  const posicao = videos.filter((v) => v.codigo).findIndex((v) => v.codigo === video.codigo) + 1

  /* O modal sai do lugar por `createPortal`. O bloco de vídeos carrega
     `.revelar`, que é um `transform`, e enquanto essa transição roda o
     `transform` vira bloco de contenção: um filho `position: fixed` passa a se
     medir pelo bloco em vez da tela e o modal abre no meio da página. Pendurado
     no `body` isso não acontece. */
  return createPortal(
    /* `data-lenis-prevent`: a página roda com rolagem suave do Lenis, que
       intercepta roda e toque na janela inteira e move o documento. Sem esta
       marca o gesto feito dentro do modal ia para o Lenis e a caixa não rolava
       um pixel, que é o travamento relatado no celular. O Lenis procura o
       atributo em todo o caminho do evento, então marcar a raiz cobre a
       legenda, o véu e as setas de uma vez. */
    <div
      className="videomodal"
      role="dialog"
      aria-modal="true"
      aria-label={`Vídeo: ${video.titulo}`}
      data-lenis-prevent
    >
      <button type="button" className="videomodal__veu" onClick={aoFechar} aria-label="Fechar vídeo" />

      {/* A moldura não rola nunca. É ela que ancora o botão de fechar no canto
          da caixa: no celular a caixa vira um rolo só e um botão absoluto lá
          dentro subiria com o texto, deixando a pessoa sem saída visível. */}
      <div className="videomodal__moldura">
        <div className="videomodal__caixa">
          <div className="videomodal__player" style={altura ? { '--altura-embed': `${altura}px` } : undefined}>
            <iframe
              key={video.codigo}
              src={`https://www.instagram.com/p/${video.codigo}/embed/`}
              title={`Vídeo no Instagram: ${video.titulo}`}
              loading="lazy"
              scrolling="no"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="videomodal__lado">
            <p className="videomodal__conta">
              <Marca nome="Instagram" tamanho={18} />
              @drbrunoresende_
            </p>

            <h4 className="videomodal__titulo">{video.titulo}</h4>
            <p className="videomodal__descricao">{video.descricao}</p>

            {video.local && (
              <p className="videomodal__local">
                <Icone nome="local" tamanho={16} />
                {video.local}
              </p>
            )}

            <div className="videomodal__legenda">
              {video.legenda?.map((paragrafo, i) => (
                <p key={i}>{paragrafo}</p>
              ))}
            </div>

            <div className="videomodal__pe">
              <a className="btn btn--primario videomodal__ir" href={link} target="_blank" rel="noopener noreferrer">
                Ver no Instagram
                <Icone nome="seta" tamanho={18} />
              </a>
              {perfil && (
                <a className="videomodal__perfil" href={perfil} target="_blank" rel="noopener noreferrer">
                  Todos os vídeos no perfil
                </a>
              )}
            </div>
          </div>
        </div>

        <button type="button" ref={fecharRef} className="videomodal__fechar" onClick={aoFechar}>
          <Icone nome="fechar" tamanho={24} />
          <span className="so-leitor">Fechar vídeo</span>
        </button>
      </div>

      {total > 1 && (
        <>
          <button type="button" className="videomodal__seta videomodal__seta--antes" onClick={() => passar(-1)}>
            <Icone nome="seta" tamanho={24} />
            <span className="so-leitor">Vídeo anterior</span>
          </button>
          <button type="button" className="videomodal__seta videomodal__seta--depois" onClick={() => passar(1)}>
            <Icone nome="seta" tamanho={24} />
            <span className="so-leitor">Próximo vídeo</span>
          </button>
          <p className="videomodal__contagem" aria-live="polite">
            {posicao} de {total}
          </p>
        </>
      )}
    </div>,
    document.body,
  )
}
