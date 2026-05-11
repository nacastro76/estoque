import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'controle_estoque_materiais_v1'

const materiaisIniciais = [
  {
    id: crypto.randomUUID(),
    nome: 'Parafuso M6',
    categoria: 'Fixação',
    unidade: 'un',
    quantidade: 120,
    estoqueMinimo: 30,
    localizacao: 'Almoxarifado',
    observacoes: 'Item inicial de exemplo',
    historico: []
  },
  {
    id: crypto.randomUUID(),
    nome: 'Chapa de aço',
    categoria: 'Matéria-prima',
    unidade: 'un',
    quantidade: 18,
    estoqueMinimo: 10,
    localizacao: 'Laboratório',
    observacoes: 'Item inicial de exemplo',
    historico: []
  }
]

const formularioVazio = {
  nome: '',
  categoria: '',
  unidade: 'un',
  quantidade: 0,
  estoqueMinimo: 0,
  localizacao: '',
  observacoes: ''
}

function salvarMateriais(materiais) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(materiais))
}

function carregarMateriais() {
  const dados = localStorage.getItem(STORAGE_KEY)
  if (!dados) return materiaisIniciais

  try {
    return JSON.parse(dados)
  } catch {
    return materiaisIniciais
  }
}

export default function App() {
  const [materiais, setMateriais] = useState(carregarMateriais)
  const [formulario, setFormulario] = useState(formularioVazio)
  const [busca, setBusca] = useState('')
  const [materialEditando, setMaterialEditando] = useState(null)
  const [movimento, setMovimento] = useState({ id: '', tipo: 'entrada', quantidade: 1, responsavel: '', observacao: '' })

  useEffect(() => {
    salvarMateriais(materiais)
  }, [materiais])

  const materiaisFiltrados = useMemo(() => {
    const texto = busca.toLowerCase()
    return materiais.filter((item) =>
      [item.nome, item.categoria, item.localizacao, item.observacoes]
        .join(' ')
        .toLowerCase()
        .includes(texto)
    )
  }, [busca, materiais])

  const baixoEstoque = materiais.filter((item) => Number(item.quantidade) <= Number(item.estoqueMinimo))
  const totalItens = materiais.length
  const totalUnidades = materiais.reduce((soma, item) => soma + Number(item.quantidade || 0), 0)

  function atualizarFormulario(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  function salvarMaterial(evento) {
    evento.preventDefault()

    if (!formulario.nome.trim()) {
      alert('Informe o nome do material.')
      return
    }

    if (materialEditando) {
      setMateriais((atuais) =>
        atuais.map((item) =>
          item.id === materialEditando
            ? {
                ...item,
                ...formulario,
                quantidade: Number(formulario.quantidade),
                estoqueMinimo: Number(formulario.estoqueMinimo)
              }
            : item
        )
      )
    } else {
      setMateriais((atuais) => [
        ...atuais,
        {
          id: crypto.randomUUID(),
          ...formulario,
          quantidade: Number(formulario.quantidade),
          estoqueMinimo: Number(formulario.estoqueMinimo),
          historico: [
            {
              data: new Date().toLocaleString('pt-BR'),
              tipo: 'cadastro',
              quantidade: Number(formulario.quantidade),
              responsavel: 'Sistema',
              observacao: 'Cadastro inicial'
            }
          ]
        }
      ])
    }

    setFormulario(formularioVazio)
    setMaterialEditando(null)
  }

  function editarMaterial(item) {
    setMaterialEditando(item.id)
    setFormulario({
      nome: item.nome,
      categoria: item.categoria,
      unidade: item.unidade,
      quantidade: item.quantidade,
      estoqueMinimo: item.estoqueMinimo,
      localizacao: item.localizacao,
      observacoes: item.observacoes
    })
  }

  function excluirMaterial(id) {
    const confirmar = confirm('Deseja excluir este material?')
    if (!confirmar) return
    setMateriais((atuais) => atuais.filter((item) => item.id !== id))
  }

  function registrarMovimento(evento) {
    evento.preventDefault()

    if (!movimento.id) {
      alert('Selecione um material.')
      return
    }

    const quantidadeMovimento = Number(movimento.quantidade)

    if (quantidadeMovimento <= 0) {
      alert('Informe uma quantidade maior que zero.')
      return
    }

    setMateriais((atuais) =>
      atuais.map((item) => {
        if (item.id !== movimento.id) return item

        const novaQuantidade =
          movimento.tipo === 'entrada'
            ? Number(item.quantidade) + quantidadeMovimento
            : Number(item.quantidade) - quantidadeMovimento

        if (novaQuantidade < 0) {
          alert('Saída maior que o estoque disponível.')
          return item
        }

        return {
          ...item,
          quantidade: novaQuantidade,
          historico: [
            {
              data: new Date().toLocaleString('pt-BR'),
              tipo: movimento.tipo,
              quantidade: quantidadeMovimento,
              responsavel: movimento.responsavel || 'Não informado',
              observacao: movimento.observacao || '-'
            },
            ...(item.historico || [])
          ]
        }
      })
    )

    setMovimento({ id: '', tipo: 'entrada', quantidade: 1, responsavel: '', observacao: '' })
  }

  function exportarJson() {
    const arquivo = new Blob([JSON.stringify(materiais, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(arquivo)
    const link = document.createElement('a')
    link.href = url
    link.download = 'estoque-materiais.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  function limparBancoLocal() {
    const confirmar = confirm('Deseja apagar todos os dados locais e restaurar os exemplos?')
    if (!confirmar) return
    localStorage.removeItem(STORAGE_KEY)
    setMateriais(materiaisIniciais)
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <h1 style={styles.title}>Sistema de Controle de Estoque</h1>
          <p style={styles.subtitle}>Cadastro, movimentação e controle de materiais com banco local no navegador.</p>
        </div>
        <div style={styles.actions}>
          <button style={styles.secondaryButton} onClick={exportarJson}>Exportar JSON</button>
          <button style={styles.dangerButton} onClick={limparBancoLocal}>Restaurar exemplos</button>
        </div>
      </section>

      <section style={styles.cards}>
        <div style={styles.card}><span>Total de materiais</span><strong>{totalItens}</strong></div>
        <div style={styles.card}><span>Unidades em estoque</span><strong>{totalUnidades}</strong></div>
        <div style={styles.card}><span>Baixo estoque</span><strong style={{ color: '#b91c1c' }}>{baixoEstoque.length}</strong></div>
      </section>

      <section style={styles.grid}>
        <form style={styles.panel} onSubmit={salvarMaterial}>
          <h2>{materialEditando ? 'Editar material' : 'Cadastrar material'}</h2>
          <div style={styles.formGrid}>
            <label>Material<input value={formulario.nome} onChange={(e) => atualizarFormulario('nome', e.target.value)} /></label>
            <label>Categoria<input value={formulario.categoria} onChange={(e) => atualizarFormulario('categoria', e.target.value)} /></label>
            <label>Unidade<input value={formulario.unidade} onChange={(e) => atualizarFormulario('unidade', e.target.value)} /></label>
            <label>Quantidade<input type="number" min="0" value={formulario.quantidade} onChange={(e) => atualizarFormulario('quantidade', e.target.value)} /></label>
            <label>Estoque mínimo<input type="number" min="0" value={formulario.estoqueMinimo} onChange={(e) => atualizarFormulario('estoqueMinimo', e.target.value)} /></label>
            <label>Localização<input value={formulario.localizacao} onChange={(e) => atualizarFormulario('localizacao', e.target.value)} /></label>
          </div>
          <label>Observações<textarea value={formulario.observacoes} onChange={(e) => atualizarFormulario('observacoes', e.target.value)} /></label>
          <div style={styles.actions}>
            <button style={styles.primaryButton} type="submit">{materialEditando ? 'Salvar alterações' : 'Cadastrar'}</button>
            {materialEditando && <button style={styles.secondaryButton} type="button" onClick={() => { setMaterialEditando(null); setFormulario(formularioVazio) }}>Cancelar</button>}
          </div>
        </form>

        <form style={styles.panel} onSubmit={registrarMovimento}>
          <h2>Registrar entrada/saída</h2>
          <label>Material
            <select value={movimento.id} onChange={(e) => setMovimento({ ...movimento, id: e.target.value })}>
              <option value="">Selecione</option>
              {materiais.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
            </select>
          </label>
          <label>Tipo
            <select value={movimento.tipo} onChange={(e) => setMovimento({ ...movimento, tipo: e.target.value })}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </label>
          <label>Quantidade<input type="number" min="1" value={movimento.quantidade} onChange={(e) => setMovimento({ ...movimento, quantidade: e.target.value })} /></label>
          <label>Responsável<input value={movimento.responsavel} onChange={(e) => setMovimento({ ...movimento, responsavel: e.target.value })} /></label>
          <label>Observação<textarea value={movimento.observacao} onChange={(e) => setMovimento({ ...movimento, observacao: e.target.value })} /></label>
          <button style={styles.primaryButton} type="submit">Registrar movimento</button>
        </form>
      </section>

      <section style={styles.panel}>
        <div style={styles.tableHeader}>
          <h2>Materiais cadastrados</h2>
          <input style={styles.search} placeholder="Buscar por material, categoria ou local..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Material</th>
                <th>Categoria</th>
                <th>Qtd.</th>
                <th>Mínimo</th>
                <th>Unidade</th>
                <th>Local</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {materiaisFiltrados.map((item) => {
                const baixo = Number(item.quantidade) <= Number(item.estoqueMinimo)
                return (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.categoria}</td>
                    <td>{item.quantidade}</td>
                    <td>{item.estoqueMinimo}</td>
                    <td>{item.unidade}</td>
                    <td>{item.localizacao}</td>
                    <td><span style={baixo ? styles.badgeDanger : styles.badgeOk}>{baixo ? 'Baixo estoque' : 'OK'}</span></td>
                    <td>
                      <button style={styles.smallButton} onClick={() => editarMaterial(item)}>Editar</button>
                      <button style={styles.smallDangerButton} onClick={() => excluirMaterial(item.id)}>Excluir</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={styles.panel}>
        <h2>Histórico de movimentações</h2>
        {materiais.flatMap((item) => (item.historico || []).map((h, index) => ({ ...h, material: item.nome, id: `${item.id}-${index}` }))).slice(0, 20).length === 0 ? (
          <p>Nenhuma movimentação registrada.</p>
        ) : (
          <ul style={styles.historyList}>
            {materiais.flatMap((item) => (item.historico || []).map((h, index) => ({ ...h, material: item.nome, id: `${item.id}-${index}` }))).slice(0, 20).map((h) => (
              <li key={h.id} style={styles.historyItem}>
                <strong>{h.material}</strong> — {h.tipo} de {h.quantidade} em {h.data}. Responsável: {h.responsavel}. Obs.: {h.observacao}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#f3f4f6', padding: '24px', fontFamily: 'Arial, sans-serif', color: '#111827' },
  header: { display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', marginBottom: '20px', flexWrap: 'wrap' },
  title: { margin: 0, fontSize: '30px' },
  subtitle: { margin: '8px 0 0', color: '#4b5563' },
  actions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' },
  card: { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 6px 18px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' },
  panel: { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 6px 18px rgba(0,0,0,0.06)', marginBottom: '20px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  search: { maxWidth: '360px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  primaryButton: { background: '#2563eb', color: '#fff', border: 0, padding: '10px 14px', borderRadius: '10px', cursor: 'pointer' },
  secondaryButton: { background: '#374151', color: '#fff', border: 0, padding: '10px 14px', borderRadius: '10px', cursor: 'pointer' },
  dangerButton: { background: '#b91c1c', color: '#fff', border: 0, padding: '10px 14px', borderRadius: '10px', cursor: 'pointer' },
  smallButton: { background: '#2563eb', color: '#fff', border: 0, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', marginRight: '6px' },
  smallDangerButton: { background: '#b91c1c', color: '#fff', border: 0, padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' },
  badgeOk: { background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '999px', fontWeight: 700 },
  badgeDanger: { background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '999px', fontWeight: 700 },
  historyList: { paddingLeft: '18px' },
  historyItem: { marginBottom: '8px' }
}
