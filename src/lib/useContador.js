import { useEffect, useRef, useState } from 'react'

/* Conta de zero até `alvo` quando o número aparece na tela.
   Desacelera no fim (easeOutExpo), um contador linear parece um relógio
   digital; este parece alguém somando. */
export function useContador(alvo, duracao = 1600) {
  const ref = useRef(null)
  const [valor, setValor] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduzido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduzido || typeof IntersectionObserver === 'undefined') {
      setValor(alvo)
      return
    }

    let quadro
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return
        obs.disconnect()

        const inicio = performance.now()
        const passo = (agora) => {
          const t = Math.min((agora - inicio) / duracao, 1)
          const suave = 1 - Math.pow(2, -10 * t)
          setValor(Math.round(alvo * (t === 1 ? 1 : suave)))
          if (t < 1) quadro = requestAnimationFrame(passo)
        }
        quadro = requestAnimationFrame(passo)
      },
      { threshold: 0.4 },
    )

    obs.observe(el)
    return () => {
      obs.disconnect()
      cancelAnimationFrame(quadro)
    }
  }, [alvo, duracao])

  return [ref, valor]
}
