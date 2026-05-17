import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Limpando todos os dados...');

  await prisma.historico.deleteMany();
  await prisma.pendencia.deleteMany();
  await prisma.relatorioPdf.deleteMany();
  await prisma.anexo.deleteMany();
  await prisma.ordemServico.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.usuario.deleteMany();

  const senhaHash = await bcrypt.hash('admin123', 10);

  await prisma.usuario.create({ data: { nome: 'Administrador', email: 'admin@osmonitor.local', senha_hash: senhaHash } });
  await prisma.usuario.create({ data: { nome: 'Tecnico', email: 'tecnico@osmonitor.local', senha_hash: senhaHash } });

  console.log('Banco zerado. 2 usuarios criados.');
  console.log('  admin@osmonitor.local / admin123');
  console.log('  tecnico@osmonitor.local / admin123');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
