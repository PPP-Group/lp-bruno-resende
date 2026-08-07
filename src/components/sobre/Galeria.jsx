import { useState } from 'react'
import { useRevelar } from '../../lib/useRevelar.js'
import { Icone } from '../icons/Icone.jsx'
import { Lightbox } from './Lightbox.jsx'

/* Enquanto as fotos reais não chegam, cada vaga desenha um lugar reservado com
   a legenda já escrita. Isso é melhor que esconder o bloco: quem for aprovar as
   imagens vê exatamente quantas faltam e o que cada uma precisa mostrar. */
function Reservada({ legenda, indice }) {
  return (
    <div className="galeria__reservada" style={{ '--giro': `${(indice % 4) * 90}deg` }}>
      <svg viewBox="0 0 100 100" aria-hidden="true" className="galeria__hachura">
        <defs>
          <pattern id={`hachura-${indice}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="4" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill={`url(#hachura-${indice})`} />
      </svg>
      <span className="galeria__aviso">Foto a definir</span>
    </div>
  )
}

export function Galeria({ titulo, itens }) {
  const [ref, visivel] = useRevelar()
  const [aberta, setAberta] = useState(null)
  const comFoto = itens.filter((i) => i.src)

  return (
    <div ref={ref} className="faixa-conteudo galeria revelar" data-visivel={visivel}>
      <div className="galeria__cabeca">
        <h3 className="galeria__titulo">{titulo}</h3>
        {comFoto.length > 0 && (
          <p className="galeria__dica">
            <Icone nome="tocar" tamanho={18} />
            Toque para ampliar
          </p>
        )}
      </div>

      <ul className="galeria__grade">
        {itens.map((item, i) => (
          <li key={item.legenda} className="galeria__item">
            {item.src ? (
              <button type="button" className="galeria__botao" onClick={() => setAberta(i)}>
                <img src={item.src} alt={item.legenda} loading="lazy" decoding="async" />
                <span className="galeria__legenda">{item.legenda}</span>
              </button>
            ) : (
              <div className="galeria__botao galeria__botao--vazio">
                <Reservada legenda={item.legenda} indice={i} />
                <span className="galeria__legenda">{item.legenda}</span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {aberta !== null && (
        <Lightbox itens={itens} indice={aberta} aoFechar={() => setAberta(null)} aoTrocar={setAberta} />
      )}
    </div>
  )
}
