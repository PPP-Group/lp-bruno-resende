import { candidato } from '../data/candidato.js'

/* A faixa que campanhas penduram atravessada na rua. Aqui ela atravessa a
   junção entre duas seções, é o que costura uma na outra em vez de deixar a
   página virar uma pilha de blocos.

   É também o único lugar do site onde o slogan aparece em movimento: no herói
   ele disputaria com o nome, a headline e o número. */
export function FaixaCorrida({ variante = 'rosa', frases, className = '' }) {
  const { slogan, conceito, numero } = candidato.identidade
  const itens = frases ?? [slogan, `${numero} · Deputado Federal`, conceito, `${numero} · Espírito Santo`]

  return (
    <div className={`faixa faixa--${variante} ${className}`.trim()} aria-hidden="true">
      <div className="faixa__pista">
        {/* Duas cópias: a animação translada 50% e reinicia sem emenda. */}
        {[0, 1].map((copia) => (
          <div key={copia} className="faixa__grupo">
            {itens.map((texto, i) => (
              <span key={`${copia}-${i}`} className="faixa__item">
                {texto}
                <span className="faixa__marca">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 21s-8-5.1-8-11a4.6 4.6 0 0 1 8-3.1A4.6 4.6 0 0 1 20 10c0 5.9-8 11-8 11z" />
                  </svg>
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
