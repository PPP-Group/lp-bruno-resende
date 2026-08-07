import { useEffect, useState } from 'react'

/* Qual seção está sob o menu agora. A linha de leitura fica a 38% da altura da
   janela: perto o bastante do topo para trocar quando a seção realmente domina
   a tela, longe o bastante para não piscar entre duas. */
export function useSecaoAtiva(ids) {
  const [ativa, setAtiva] = useState(ids[0])

  useEffect(() => {
    const medir = () => {
      const linha = window.innerHeight * 0.38
      let atual = ids[0]

      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= linha) atual = id
      }

      /* No fim da página a última seção pode nunca cruzar a linha, se o scroll
         chegou ao fim, ela é a ativa por definição. */
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 80) {
        atual = ids[ids.length - 1]
      }

      setAtiva((anterior) => (anterior === atual ? anterior : atual))
    }

    medir()
    window.addEventListener('scroll', medir, { passive: true })
    window.addEventListener('resize', medir)
    return () => {
      window.removeEventListener('scroll', medir)
      window.removeEventListener('resize', medir)
    }
  }, [ids])

  return ativa
}
