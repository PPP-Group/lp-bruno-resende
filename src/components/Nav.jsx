import { useEffect, useState } from 'react'
import { secoes, linkWhatsapp } from '../data/candidato.js'
import { Logo } from './Logo.jsx'
import { Icone, Marca } from './icons/Icone.jsx'

export function Nav({ secaoAtiva }) {
  const [descido, setDescido] = useState(false)
  const [aberto, setAberto] = useState(false)

  /* Enquanto o número oficial de WhatsApp não chega, o botão continua na tela e
     leva ao formulário. Um menu de campanha sem chamada para ação é um menu
     quebrado, e a pendência do número não pode virar um buraco no layout. */
  const wa = linkWhatsapp()
  const acao = wa
    ? { href: wa, externo: true, texto: 'Falar agora' }
    : { href: '#contato', externo: false, texto: 'Fale conosco' }

  /* O menu começa transparente sobre o herói azul e vira uma barra sólida
     assim que a página sai do topo. */
  useEffect(() => {
    const medir = () => setDescido(window.scrollY > 40)
    medir()
    window.addEventListener('scroll', medir, { passive: true })
    return () => window.removeEventListener('scroll', medir)
  }, [])

  /* Com a gaveta aberta o fundo não rola, e Esc fecha. */
  useEffect(() => {
    if (!aberto) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const aoTeclar = (e) => e.key === 'Escape' && setAberto(false)
    window.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  return (
    <header className="nav" data-descido={descido}>
      <div className="nav__interior faixa-conteudo">
        <a href="#inicio" className="nav__logo" aria-label="Início">
          <Logo deitado claro={!descido} altura={46} />
        </a>

        <nav className="nav__links" aria-label="Seções da página">
          {secoes.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="nav__link" data-ativo={secaoAtiva === s.id}>
              {s.rotulo}
            </a>
          ))}
        </nav>

        {/* O número não se repete aqui: o logotipo deitado já traz o 4400 em
            rosa, do lado esquerdo da barra. Repetir só disputaria com ele. */}
        <div className="nav__acoes">
          <a
            className="btn btn--primario nav__cta"
            href={acao.href}
            {...(acao.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {acao.externo && <Marca nome="WhatsApp" tamanho={18} />}
            {acao.texto}
          </a>

          <button
            type="button"
            className="nav__hamburguer"
            onClick={() => setAberto(true)}
            aria-expanded={aberto}
            aria-controls="menu-gaveta"
          >
            <Icone nome="menu" tamanho={26} />
            <span className="so-leitor">Abrir menu</span>
          </button>
        </div>
      </div>

      <div id="menu-gaveta" className="gaveta" data-aberto={aberto} hidden={!aberto}>
        <div className="gaveta__topo faixa-conteudo">
          <Logo deitado claro altura={34} />
          <button type="button" className="gaveta__fechar" onClick={() => setAberto(false)}>
            <Icone nome="fechar" tamanho={26} />
            <span className="so-leitor">Fechar menu</span>
          </button>
        </div>

        <nav className="gaveta__links" aria-label="Seções da página">
          {secoes.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="gaveta__link"
              data-ativo={secaoAtiva === s.id}
              onClick={() => setAberto(false)}
            >
              <span className="gaveta__indice">{String(i + 1).padStart(2, '0')}</span>
              {s.rotulo}
            </a>
          ))}
        </nav>

        <div className="gaveta__pe faixa-conteudo">
          <p className="slogan" style={{ '--slogan-tamanho': '1.5rem' }}>
            <span>Cuida</span>
            <span>e salva vidas.</span>
          </p>
          <a
            className="btn btn--primario"
            href={acao.href}
            onClick={() => setAberto(false)}
            {...(acao.externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {acao.externo && <Marca nome="WhatsApp" tamanho={18} />}
            Falar com a campanha
          </a>
        </div>
      </div>

      {aberto && <button type="button" className="gaveta__veu" onClick={() => setAberto(false)} tabIndex={-1} aria-hidden="true" />}
    </header>
  )
}
