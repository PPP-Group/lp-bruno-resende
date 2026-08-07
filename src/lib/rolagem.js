import Lenis from 'lenis'

/* Rolagem suave. Desligada para quem pediu menos movimento no sistema, nesse
   caso o scroll nativo é o comportamento correto, não um fallback pior. */
export function iniciarRolagem() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {}

  const lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 })

  let quadro
  const passo = (t) => {
    lenis.raf(t)
    quadro = requestAnimationFrame(passo)
  }
  quadro = requestAnimationFrame(passo)

  /* Âncoras precisam parar abaixo do menu fixo. */
  const aoClicar = (e) => {
    const link = e.target.closest('a[href^="#"]')
    if (!link) return
    const id = link.getAttribute('href').slice(1)
    const alvo = id && document.getElementById(id)
    if (!alvo) return
    e.preventDefault()
    lenis.scrollTo(alvo, { offset: -88 })
    history.replaceState(null, '', `#${id}`)
  }

  document.addEventListener('click', aoClicar)

  return () => {
    document.removeEventListener('click', aoClicar)
    cancelAnimationFrame(quadro)
    lenis.destroy()
  }
}
