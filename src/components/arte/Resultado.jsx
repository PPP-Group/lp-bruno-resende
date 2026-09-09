import { useRef, useState } from 'react'
import { usePintura } from '../../lib/useArte.js'

/* O cartão 3: prévia, medida do arquivo, e os dois botões. */
export function Resultado({ quadro, cena, formato, pronto, aoExportar, aoAvisar, textos }) {
  const previa = useRef(null)
  const [ocupado, setOcupado] = useState(false)

  usePintura(previa, cena, quadro, 320)

  const entregar = async (comoPartilha) => {
    setOcupado(true)
    try {
      const arquivo = await aoExportar()

      if (comoPartilha && navigator.canShare?.({ files: [arquivo] })) {
        try {
          await navigator.share({ files: [arquivo], title: formato.rotulo })
          return
        } catch {
          /* A pessoa cancelou a folha de compartilhamento. Não é erro, e não
             merece nem aviso nem download por baixo do pano. */
          return
        }
      }

      const url = URL.createObjectURL(arquivo)
      const a = document.createElement('a')
      a.href = url
      a.download = arquivo.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1500)

      if (comoPartilha) aoAvisar('semPartilha')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <>
      <div
        className="resultado__palco"
        style={{ aspectRatio: `${quadro.largura} / ${quadro.altura}` }}
      >
        <canvas ref={previa} className="resultado__previa" role="img" aria-label={formato.rotulo} />
      </div>

      <p className="resultado__medida">
        {textos.medida(formato.rotulo, quadro.largura, quadro.altura)}
      </p>

      <button
        type="button"
        className="btn btn--primario resultado__baixar"
        disabled={!pronto || ocupado}
        onClick={() => entregar(false)}
      >
        <span className="btn__texto">{textos.acoes.baixar}</span>
      </button>

      <button
        type="button"
        className="btn btn--secundario resultado__compartilhar"
        disabled={!pronto || ocupado}
        onClick={() => entregar(true)}
      >
        <span className="btn__texto">{textos.acoes.compartilhar}</span>
      </button>
    </>
  )
}
