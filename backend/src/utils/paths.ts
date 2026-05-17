import path from 'path';

const PROJECT_ROOT = path.resolve(process.cwd(), '..');
export const STORAGE_PATH = path.join(PROJECT_ROOT, 'storage');
export const RELATORIOS_PATH = path.join(STORAGE_PATH, 'relatorios');
export const ANEXOS_PATH = path.join(STORAGE_PATH, 'anexos');
