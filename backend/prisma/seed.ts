import { PrismaClient, EstagioOS } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed OS Monitor...\n');

  // Limpa dados existentes (ordem reversa para respeitar FKs)
  await prisma.historico.deleteMany();
  await prisma.pendencia.deleteMany();
  await prisma.relatorioPdf.deleteMany();
  await prisma.anexo.deleteMany();
  await prisma.ordemServico.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();

  // ── Usuários ──
  const senhaHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.usuario.create({
    data: { nome: 'Administrador', email: 'admin@osmonitor.local', senha_hash: senhaHash },
  });

  const tecnico = await prisma.usuario.create({
    data: { nome: 'Técnico', email: 'tecnico@osmonitor.local', senha_hash: senhaHash },
  });

  console.log(`Usuarios: ${await prisma.usuario.count()} criados`);

  // ── Clientes ──
  const clientesRaw = [
    { nome: 'Empresa Alpha Ltda', email: 'contato@alpha.com', telefone: '(11) 3000-1001', documento: '12.345.678/0001-90', endereco: 'Av. Paulista, 1000, Sao Paulo - SP' },
    { nome: 'Joao Silva', email: 'joao@email.com', telefone: '(11) 98888-1111', documento: '123.456.789-00', endereco: 'Rua A, 123, Sao Paulo - SP' },
    { nome: 'Maria Oliveira', email: 'maria@email.com', telefone: '(21) 97777-2222', documento: '987.654.321-00', endereco: 'Rua B, 456, Rio de Janeiro - RJ' },
    { nome: 'Tech Solutions ME', email: 'vendas@techsolutions.com', telefone: '(31) 3000-2002', documento: '98.765.432/0001-10', endereco: 'Av. Afonso Pena, 500, Belo Horizonte - MG' },
    { nome: 'Carlos Pereira', email: 'carlos@email.com', telefone: '(41) 96666-3333', documento: '456.789.123-00', endereco: 'Rua C, 789, Curitiba - PR' },
    { nome: 'Ana Costa', email: 'ana@email.com', telefone: '(51) 95555-4444', documento: '789.123.456-00', endereco: 'Rua D, 321, Porto Alegre - RS' },
    { nome: 'Construtora Beta Ltda', email: 'obra@construtorabeta.com', telefone: '(11) 3000-3003', documento: '45.678.901/0001-23', endereco: 'Rua E, 100, Sao Paulo - SP' },
    { nome: 'Pedro Santos', email: 'pedro@email.com', telefone: '(19) 94444-5555', documento: '321.654.987-00', endereco: 'Rua F, 654, Campinas - SP' },
    { nome: 'Auto Center Brasil', email: 'oficina@autocenter.com', telefone: '(11) 3000-4004', documento: '56.789.012/0001-34', endereco: 'Rua G, 200, Sao Paulo - SP' },
    { nome: 'Lucia Mendes', email: 'lucia@email.com', telefone: '(27) 93333-6666', documento: '654.321.987-00', endereco: 'Rua H, 111, Vitoria - ES' },
  ];

  const clientes: any[] = [];
  for (const c of clientesRaw) {
    const cliente = await prisma.cliente.create({ data: { ...c, criado_por: admin.id } });
    clientes.push(cliente);
  }
  console.log(`Clientes: ${clientes.length} criados`);

  // ── Ordens de Serviço em diversos estágios ──
  const ano = new Date().getFullYear();

  const ordensConfig = [
    { titulo: 'Manutencao preventiva ar-condicionado', clienteIdx: 0, estagio: 'ABERTA' as EstagioOS, diasAtras: 1 },
    { titulo: 'Troca de tela notebook Dell', clienteIdx: 1, estagio: 'EM_ANALISE' as EstagioOS, diasAtras: 3 },
    { titulo: 'Instalacao de rede cabeada', clienteIdx: 0, estagio: 'ENVIADA_AO_CLIENTE' as EstagioOS, diasAtras: 5 },
    { titulo: 'Recuperacao de dados HD externo', clienteIdx: 2, estagio: 'AGUARDANDO_RETORNO' as EstagioOS, diasAtras: 7 },
    { titulo: 'Configuracao de servidor Windows', clienteIdx: 3, estagio: 'AGENDADA' as EstagioOS, diasAtras: 2 },
    { titulo: 'Reparo impressora multifuncional', clienteIdx: 5, estagio: 'EM_EXECUCAO' as EstagioOS, diasAtras: 4 },
    { titulo: 'Limpeza e otimizacao de desktops', clienteIdx: 4, estagio: 'CONCLUIDA' as EstagioOS, diasAtras: 10 },
    { titulo: 'Migracao de email para novo servidor', clienteIdx: 6, estagio: 'CONCLUIDA' as EstagioOS, diasAtras: 12, semPdf: true },
    { titulo: 'Instalacao de cameras de seguranca', clienteIdx: 7, estagio: 'RELATORIO_ENTREGUE' as EstagioOS, diasAtras: 15 },
    { titulo: 'Backup e formatacao de notebooks', clienteIdx: 8, estagio: 'ENCERRADA' as EstagioOS, diasAtras: 30 },
    { titulo: 'Consultoria de seguranca digital', clienteIdx: 9, estagio: 'ABERTA' as EstagioOS, diasAtras: 0 },
    { titulo: 'Substituicao de nobreak', clienteIdx: 5, estagio: 'EM_EXECUCAO' as EstagioOS, diasAtras: 1 },
  ];

  let seq = 1;
  for (const cfg of ordensConfig) {
    const numero = `OS-${ano}-${String(seq).padStart(5, '0')}`;
    const criadoEm = new Date(Date.now() - cfg.diasAtras * 86400000);
    const criador = seq <= 6 ? admin : tecnico;

    await prisma.$transaction(async (tx) => {
      const os = await tx.ordemServico.create({
        data: {
          numero,
          titulo: cfg.titulo,
          descricao: `Ordem de servico para ${cfg.titulo.toLowerCase()}.`,
          cliente_id: clientes[cfg.clienteIdx].id,
          estagio: cfg.estagio,
          criado_por: criador.id,
          criado_em: criadoEm,
          atualizado_em: criadoEm,
        },
      });

      await tx.historico.create({
        data: {
          ordem_id: os.id,
          usuario_id: criador.id,
          tipo: 'CRIACAO_OS',
          descricao: 'Ordem de servico criada.',
          estagio_novo: cfg.estagio,
          criado_em: criadoEm,
        },
      });

      // Gera PDF para OS em RELATORIO_ENTREGUE e ENCERRADA
      if (['RELATORIO_ENTREGUE', 'ENCERRADA'].includes(cfg.estagio)) {
        await tx.relatorioPdf.create({
          data: {
            ordem_id: os.id,
            nome_arquivo: `${numero}_relatorio.pdf`,
            caminho_arquivo: `${numero}_relatorio.pdf`,
            tamanho_bytes: 1500 + Math.floor(Math.random() * 1000),
            criado_por: criador.id,
            criado_em: criadoEm,
          },
        });
        await tx.historico.create({
          data: {
            ordem_id: os.id,
            usuario_id: criador.id,
            tipo: 'PDF_GERADO',
            descricao: 'Relatorio PDF gerado.',
            criado_em: new Date(criadoEm.getTime() + 3600000),
          },
        });
      }

      // Pendências para algumas OS
      if (['EM_ANALISE', 'EM_EXECUCAO', 'CONCLUIDA'].includes(cfg.estagio)) {
        const p1 = await tx.pendencia.create({
          data: {
            ordem_id: os.id,
            descricao: 'Verificar compatibilidade de pecas com fornecedor',
            resolvida: cfg.estagio === 'CONCLUIDA',
            data_resolucao: cfg.estagio === 'CONCLUIDA' ? new Date(criadoEm.getTime() + 86400000) : null,
            resolvido_por: cfg.estagio === 'CONCLUIDA' ? tecnico.id : null,
            criado_por: admin.id,
            criado_em: new Date(criadoEm.getTime() + 7200000),
          },
        });
        await tx.historico.create({
          data: {
            ordem_id: os.id,
            usuario_id: admin.id,
            tipo: 'PENDENCIA_CRIADA',
            descricao: `Pendencia criada: ${p1.descricao}`,
            criado_em: p1.criado_em,
          },
        });
        if (cfg.estagio === 'CONCLUIDA') {
          await tx.historico.create({
            data: {
              ordem_id: os.id,
              usuario_id: tecnico.id,
              tipo: 'PENDENCIA_CONCLUIDA',
              descricao: `Pendencia concluida: ${p1.descricao}`,
              criado_em: p1.data_resolucao!,
            },
          });
        }
      }

      if (cfg.estagio === 'EM_EXECUCAO') {
        const p2 = await tx.pendencia.create({
          data: {
            ordem_id: os.id,
            descricao: 'Aguardar aprovacao do orcamento pelo cliente',
            resolvida: false,
            criado_por: tecnico.id,
            criado_em: new Date(criadoEm.getTime() + 10800000),
          },
        });
        await tx.historico.create({
          data: {
            ordem_id: os.id,
            usuario_id: tecnico.id,
            tipo: 'PENDENCIA_CRIADA',
            descricao: `Pendencia criada: ${p2.descricao}`,
            criado_em: p2.criado_em,
          },
        });
      }

      // Histórico de mudança de estágio para OS que não estão em ABERTA
      if (cfg.estagio !== 'ABERTA') {
        await tx.historico.create({
          data: {
            ordem_id: os.id,
            usuario_id: criador.id,
            tipo: 'MUDANCA_ESTAGIO',
            descricao: `Estagio alterado de ABERTA para ${cfg.estagio}.`,
            estagio_anterior: 'ABERTA',
            estagio_novo: cfg.estagio,
            criado_em: new Date(criadoEm.getTime() + 3600000),
          },
        });
      }
    });

    seq++;
  }

  const totalOS = await prisma.ordemServico.count();
  const totalHist = await prisma.historico.count();
  const totalPend = await prisma.pendencia.count();
  console.log(`Ordens: ${totalOS} | Historico: ${totalHist} registros | Pendencias: ${totalPend}`);

  console.log('\nSeed concluido!');
  console.log('  admin@osmonitor.local / admin123');
  console.log('  tecnico@osmonitor.local / admin123');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
