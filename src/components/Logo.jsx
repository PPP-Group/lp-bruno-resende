import { candidato } from '../data/candidato.js'

/* O logotipo oficial, extraído do manual em vetor.

   `claro` é a versão de texto branco, para pousar sobre azul.
   `deitado` é o lockup horizontal (nome à esquerda, número à direita), que é o
   que cabe numa barra de menu, o empilhado tem quase a altura de três linhas
   e, reduzido para caber, fica ilegível.

   Nunca recolorir por CSS: o "4400" é rosa nas duas versões e o coração tem
   cinco cores próprias. */
export function Logo({ claro = false, deitado = false, altura = 52, className = '' }) {
  const { nome, cargo, numero } = candidato.identidade
  const base = deitado ? 'logo-h' : 'logo'

  /* A altura vai por variável, não por `style={{height}}`: estilo em linha só
     seria vencido por `!important`, e a barra de menu precisa encolher o
     lockup por media query para ele caber ao lado do hambúrguer. */
  return (
    <img
      src={`/assets/${base}${claro ? '-claro' : ''}.svg`}
      alt={`${nome} ${numero}, ${cargo}`}
      style={{ '--logo-altura': `${altura}px` }}
      className={`logo ${className}`.trim()}
    />
  )
}
