import { useEffect, useRef } from 'react'
import { Icone } from '../icons/Icone.jsx'

/* Ampliação de foto da galeria. Fecha no Esc e no clique fora; setas navegam.
   O foco vai para o botão de fechar ao abrir e volta para o disparador ao
   sair, sem isso, quem navega por teclado cai no fim da página. */
export function Lightbox({ itens, indice, aoFechar, aoTrocar }) {
  const fecharRef = useRef(null)
  const anteriorRef = useRef(null)
  const item = itens[indice]
  const comFoto = itens.filter((i) => i.src)

  useEffect(() => {
    anteriorRef.current = document.activeElement
    fecharRef.current?.focus()

    const anterior = document.body.style.overflow
    const anteriorHtml = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    /* Mesma trava do VideoModal: `html` tem `overflow-x: clip` explícito em
       base.css, o que impede o `overflow: hidden` do `body` de se propagar
       para o elemento raiz. Sem travar o `html` também, a barra de rolagem
       nativa da página segue visível atrás do véu e rouba largura de layout
       da caixa `position: fixed`, descentralizando-a. */
    document.documentElement.style.overflow = 'hidden'

    const aoTeclar = (e) => {
      if (e.key === 'Escape') aoFechar()
      if (e.key === 'ArrowRight') passar(1)
      if (e.key === 'ArrowLeft') passar(-1)
    }

    window.addEventListener('keydown', aoTeclar)
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = anterior
      document.documentElement.style.overflow = anteriorHtml
      anteriorRef.current?.focus?.()
    }
  })

  /* Pula as vagas sem foto: a ampliação só faz sentido onde há imagem. */
  const passar = (passo) => {
    const comFotoIdx = itens.map((it, i) => (it.src ? i : null)).filter((i) => i !== null)
    if (comFotoIdx.length < 2) return
    const atual = comFotoIdx.indexOf(indice)
    const proximo = (atual + passo + comFotoIdx.length) % comFotoIdx.length
    aoTrocar(comFotoIdx[proximo])
  }

  if (!item?.src) return null

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.legenda}>
      <button type="button" className="lightbox__veu" onClick={aoFechar} aria-label="Fechar ampliação" />

      <figure className="lightbox__caixa">
        <img src={item.src} alt={item.legenda} />
        <figcaption>{item.legenda}</figcaption>
      </figure>

      <button type="button" ref={fecharRef} className="lightbox__fechar" onClick={aoFechar}>
        <Icone nome="fechar" tamanho={26} />
        <span className="so-leitor">Fechar</span>
      </button>

      {comFoto.length > 1 && (
        <>
          <button type="button" className="lightbox__seta lightbox__seta--antes" onClick={() => passar(-1)}>
            <Icone nome="seta" tamanho={24} />
            <span className="so-leitor">Foto anterior</span>
          </button>
          <button type="button" className="lightbox__seta lightbox__seta--depois" onClick={() => passar(1)}>
            <Icone nome="seta" tamanho={24} />
            <span className="so-leitor">Próxima foto</span>
          </button>
        </>
      )}
    </div>
  )
}
