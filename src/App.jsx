import { useEffect, useMemo } from 'react'
import { candidato, secoes } from './data/candidato.js'
import { iniciarRolagem } from './lib/rolagem.js'
import { useSecaoAtiva } from './lib/useSecaoAtiva.js'

import { Nav } from './components/Nav.jsx'
import { FaixaCorrida } from './components/FaixaCorrida.jsx'
import { WhatsAppFab } from './components/WhatsAppFab.jsx'
import { Footer } from './components/Footer.jsx'

import { Hero } from './components/hero/Hero.jsx'
import { Sobre } from './components/sobre/Sobre.jsx'
import { Propostas } from './components/propostas/Propostas.jsx'
import { Conquistas } from './components/conquistas/Conquistas.jsx'
import { Urna } from './components/urna/Urna.jsx'
import { Contato } from './components/contato/Contato.jsx'

export default function App() {
  const ids = useMemo(() => secoes.map((s) => s.id), [])
  const secaoAtiva = useSecaoAtiva(ids)

  useEffect(() => iniciarRolagem(), [])

  const { propostas, conquistas } = candidato

  return (
    <>
      <a className="pular" href="#inicio">
        Pular para o conteúdo
      </a>

      <Nav secaoAtiva={secaoAtiva} />

      <main className="pagina">
        {/* O herói já traz a sua própria faixa, montada na borda de baixo do
            cartaz. Uma segunda logo abaixo dela, com o mesmo texto e a mesma
            cor, só pareceria repetição. */}
        <Hero />
        <Sobre />

        {/* Antes das propostas, a faixa anuncia os eixos. */}
        <FaixaCorrida variante="azul" frases={propostas.eixos.map((e) => e.titulo)} />
        <Propostas />

        <Conquistas />

        {/* Depois das provas, o ensaio: quem acabou de ver o que foi feito é
            quem está mais disposto a decorar o número. */}
        <Urna />

        <FaixaCorrida frases={conquistas.leis.map((l) => `${l.titulo} · ${l.lei}/${l.ano}`)} />
        <Contato />
      </main>

      <Footer />
      <WhatsAppFab />
    </>
  )
}
