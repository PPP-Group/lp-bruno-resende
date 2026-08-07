import { useEffect, useState } from 'react'
import { candidato } from '../../data/candidato.js'
import { useRevelar } from '../../lib/useRevelar.js'
import { Icone } from '../icons/Icone.jsx'

/* ============================================================================
   ENSAIO DO VOTO
   ----------------------------------------------------------------------------
   Um teclado para treinar 4-4-0-0. Duas regras que não podem ser afrouxadas:

   1. Só o número certo mostra o candidato. Qualquer outro dá VOTO NULO. Mostrar
      nome e foto para quatro dígitos quaisquer seria enganoso e destruiria o
      objetivo da peça, que é fixar o número, é o contraste entre acertar e
      errar que faz decorar.

   2. Isto não reproduz a urna oficial da Justiça Eleitoral, e a legenda diz
      isso na tela. O painel é desenhado na identidade da campanha justamente
      para não ser confundido com o equipamento real.
   ========================================================================== */

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

export function Urna() {
  const { urna, identidade } = candidato
  const [ref, visivel] = useRevelar()
  const [digitos, setDigitos] = useState('')
  const [confirmado, setConfirmado] = useState(false)

  const tamanho = identidade.numero.length
  const completo = digitos.length === tamanho
  const certo = digitos === identidade.numero

  const digitar = (d) => {
    if (confirmado || digitos.length >= tamanho) return
    setDigitos(digitos + d)
  }

  const corrigir = () => {
    setDigitos('')
    setConfirmado(false)
  }

  const confirmar = () => {
    if (completo) setConfirmado(true)
  }

  /* O teclado físico também funciona: quem está no computador digita direto. */
  useEffect(() => {
    const aoTeclar = (e) => {
      if (!visivel) return
      if (/^[0-9]$/.test(e.key)) digitar(e.key)
      else if (e.key === 'Backspace') corrigir()
      else if (e.key === 'Enter' && completo && document.activeElement?.tagName !== 'BUTTON') confirmar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  })

  return (
    <section id="urna" className="secao urna-secao">
      <div ref={ref} className="faixa-conteudo urna-secao__interior revelar" data-visivel={visivel}>
        <div className="urna-secao__dizer">
          <p className="rotulo">{urna.rotulo}</p>
          <h2 className="titulo-secao">{urna.titulo}</h2>
          <p className="chamada-secao">{urna.texto}</p>

          <ol className="urna-passos">
            <li>
              <span>1</span> Digite {identidade.numero.split('').join('-')}
            </li>
            <li>
              <span>2</span> Confira a foto e o nome
            </li>
            <li>
              <span>3</span> Aperte CONFIRMA
            </li>
          </ol>
        </div>

        <div className="urna">
          <div className="urna__tela" aria-live="polite">
            <p className="urna__cargo">Deputado Federal</p>

            <div className="urna__digitos">
              {Array.from({ length: tamanho }).map((_, i) => (
                <span key={i} className="urna__casa" data-cheia={Boolean(digitos[i])}>
                  {digitos[i] ?? ''}
                </span>
              ))}
            </div>

            {/* O cartão só existe quando o número está completo. */}
            {completo && certo && (
              <div className="urna__cartao">
                <img src="/assets/bruno-rosto.jpg" alt="" width="900" height="900" loading="lazy" />
                <div>
                  <strong>{identidade.nomeUrna}</strong>
                  <span>{identidade.partido}</span>
                </div>
              </div>
            )}

            {completo &&!certo && (
              <p className="urna__nulo">
                VOTO NULO
                <span>Esse número não é de nenhum candidato. O de Bruno Resende é {identidade.numero}.</span>
              </p>
            )}

            {!completo && <p className="urna__instrucao">Aperte as teclas do número</p>}

            {confirmado && (
              <p className="urna__fim" role="status">
                {certo ? (
                  <>
                    <Icone nome="checar" tamanho={20} />
                    Voto registrado no ensaio. É assim no dia.
                  </>
                ) : (
                  <>Ensaio encerrado com voto nulo. Toque em CORRIGE e tente {identidade.numero}.</>
                )}
              </p>
            )}
          </div>

          <div className="urna__teclado">
            {TECLAS.map((t) => (
              <button
                key={t}
                type="button"
                className="urna__tecla"
                onClick={() => digitar(t)}
                disabled={confirmado || completo}
              >
                {t}
              </button>
            ))}

            <button type="button" className="urna__tecla urna__tecla--corrige" onClick={corrigir}>
              Corrige
            </button>

            <button
              type="button"
              className="urna__tecla urna__tecla--confirma"
              onClick={confirmar}
              disabled={!completo || confirmado}
            >
              Confirma
            </button>
          </div>

          <p className="urna__aviso">{urna.aviso}</p>
        </div>
      </div>
    </section>
  )
}
