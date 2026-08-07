import { useEffect, useRef, useState } from 'react'

/* Revela um bloco quando ele entra na tela. Uma vez revelado, fica: reanimar no
   scroll de volta cansa o leitor e atrapalha quem relê um trecho. */
export function useRevelar(margem = '0px 0px -12% 0px') {
  const ref = useRef(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setVisivel(true)
      return
    }

    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true)
          obs.disconnect()
        }
      },
      { rootMargin: margem, threshold: 0.05 },
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [margem])

  return [ref, visivel]
}
