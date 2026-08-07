import { useState } from 'react'
import { candidato, linkWhatsapp } from '../../data/candidato.js'
import { Icone } from '../icons/Icone.jsx'

/* O formulário funciona nos dois cenários:
   Com `endpointFormulario`, faz POST no serviço da campanha.
   Sem ele, monta a mensagem e abre o WhatsApp já preenchido.
   Sem nenhum dos dois (o estado de hoje, com o número ainda pendente), avisa a
   pessoa em vez de fingir que enviou. */
export function Formulario() {
  const { contato } = candidato
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState(null)
  const [voluntario, setVoluntario] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    setErro(null)

    const dados = Object.fromEntries(new FormData(e.currentTarget))

    if (contato.endpointFormulario) {
      setEnviando(true)
      try {
        const r = await fetch(contato.endpointFormulario, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados),
        })
        if (!r.ok) throw new Error(String(r.status))
        setEnviado(true)
      } catch {
        setErro('Não foi possível enviar agora. Tente de novo em alguns minutos.')
      } finally {
        setEnviando(false)
      }
      return
    }

    const wa = linkWhatsapp()
    if (!wa) {
      setErro('O canal de mensagens da campanha ainda está sendo configurado. Enquanto isso, fale pelo Instagram.')
      return
    }

    const texto = [
      `Olá! Sou ${dados.nome}, de ${dados.municipio}.`,
      `Assunto: ${dados.assunto}.`,
      dados.mensagem,
      dados.voluntario ? `Quero ser voluntário: ${dados.ajuda || 'como for possível'}.` : '',
      `Contato: ${dados.contato}`,
    ]
.filter(Boolean)
.join('\n')

    window.open(`${wa.split('?')[0]}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="formulario formulario--fim" role="status">
        <span className="formulario__marca">
          <Icone nome="checar" tamanho={30} />
        </span>
        <h3>{contato.confirmacao.titulo}</h3>
        <p>{contato.confirmacao.texto}</p>
        <button type="button" className="btn btn--secundario" onClick={() => setEnviado(false)}>
          <span className="btn__texto">Enviar outra mensagem</span>
        </button>
      </div>
    )
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate={false}>
      <div className="campo">
        <label htmlFor="f-nome">Nome completo</label>
        <input id="f-nome" name="nome" type="text" required autoComplete="name" />
      </div>

      <div className="campo">
        <label htmlFor="f-municipio">Seu município</label>
        <input id="f-municipio" name="municipio" type="text" required autoComplete="address-level2" />
      </div>

      <div className="campo">
        <label htmlFor="f-contato">WhatsApp ou e-mail</label>
        <input id="f-contato" name="contato" type="text" required autoComplete="tel" />
        <p className="campo__dica">É por aqui que a campanha responde.</p>
      </div>

      <div className="campo">
        <label htmlFor="f-assunto">Assunto</label>
        <select id="f-assunto" name="assunto" defaultValue={contato.assuntos[0]}>
          {contato.assuntos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="campo campo--largo">
        <label htmlFor="f-mensagem">O que sua cidade precisa?</label>
        <textarea id="f-mensagem" name="mensagem" rows="4" required />
      </div>

      <div className="campo campo--largo voluntario">
        <label className="caixa">
          <input
            type="checkbox"
            name="voluntario"
            checked={voluntario}
            onChange={(e) => setVoluntario(e.target.checked)}
          />
          <span>
            <strong>{contato.voluntario.titulo}</strong>
            <span className="caixa__texto">{contato.voluntario.texto}</span>
          </span>
        </label>

        {voluntario && (
          <fieldset className="voluntario__opcoes">
            <legend className="so-leitor">Como você pode ajudar</legend>
            {contato.voluntario.opcoes.map((o) => (
              <label key={o} className="marcador">
                <input type="checkbox" name="ajuda" value={o} />
                <span>{o}</span>
              </label>
            ))}
          </fieldset>
        )}
      </div>

      <div className="campo campo--largo">
        <label className="caixa caixa--consentimento">
          <input type="checkbox" name="consentimento" required />
          <span className="caixa__texto">{contato.consentimento}</span>
        </label>
      </div>

      {erro && (
        <p className="formulario__erro" role="alert">
          {erro}
        </p>
      )}

      <button type="submit" className="btn btn--primario formulario__enviar" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar mensagem'}
      </button>
    </form>
  )
}
