import { useEffect, useState } from 'react'
import { linkWhatsapp } from '../data/candidato.js'
import { Marca } from './icons/Icone.jsx'

/* Botão flutuante de WhatsApp. Aparece depois do herói, no topo da página o
   CTA do menu já está na tela e os dois juntos só disputariam atenção.

   Some perto do fim para não cobrir o rodapé, onde estão o CNPJ e o
   disclaimer eleitoral, que precisam ficar legíveis. */
export function WhatsAppFab() {
  const [mostrar, setMostrar] = useState(false)
  const wa = linkWhatsapp()

  useEffect(() => {
    if (!wa) return

    const medir = () => {
      const y = window.scrollY
      const fim = document.body.scrollHeight - window.innerHeight - 420
      setMostrar(y > window.innerHeight * 0.75 && y < fim)
    }

    medir()
    window.addEventListener('scroll', medir, { passive: true })
    window.addEventListener('resize', medir)
    return () => {
      window.removeEventListener('scroll', medir)
      window.removeEventListener('resize', medir)
    }
  }, [wa])

  if (!wa) return null

  return (
    <a
      className="fab"
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      data-visivel={mostrar}
      aria-hidden={!mostrar}
      tabIndex={mostrar ? 0 : -1}
    >
      <Marca nome="WhatsApp" tamanho={26} />
      <span className="fab__texto">Falar com a campanha</span>
    </a>
  )
}
