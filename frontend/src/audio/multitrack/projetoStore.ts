// Persistência LOCAL dos projetos do Multitrack no IndexedDB do navegador
// (web-only, custo zero de servidor). Dois object stores:
//  - `meta`: dados leves do projeto (pra listar sem carregar os áudios)
//  - `blobs`: os arquivos de áudio de cada projeto (carregados só ao abrir)
import { IconName } from '@/components/Icon';

export interface FaixaMeta {
  id: string;
  nome: string;
  icone: IconName;
  cor: string | null;
  volume: number;
  mudo: boolean;
  solo: boolean;
}

export interface ProjetoMeta {
  id: string;
  nome: string;
  criadoEm: number;
  tamanho: number; // bytes
  faixas: FaixaMeta[];
}

interface BlobFaixa {
  id: string;
  blob: Blob;
}

const DB = 'worshipstage-multitrack';
const META = 'meta';
const BLOBS = 'blobs';

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function comoPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Lista os projetos (só metadados — não carrega os áudios). */
export async function listarProjetos(): Promise<ProjetoMeta[]> {
  const db = await abrir();
  const store = db.transaction(META, 'readonly').objectStore(META);
  const todos = await comoPromise<ProjetoMeta[]>(store.getAll());
  return todos.sort((a, b) => b.criadoEm - a.criadoEm);
}

/** Salva/atualiza um projeto (metadados + blobs das faixas). */
export async function salvarProjeto(
  meta: ProjetoMeta,
  blobs: BlobFaixa[],
): Promise<void> {
  const db = await abrir();
  const tx = db.transaction([META, BLOBS], 'readwrite');
  tx.objectStore(META).put(meta);
  tx.objectStore(BLOBS).put({ id: meta.id, faixas: blobs });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Carrega os blobs de um projeto (pra reabrir). */
export async function carregarBlobs(id: string): Promise<BlobFaixa[]> {
  const db = await abrir();
  const store = db.transaction(BLOBS, 'readonly').objectStore(BLOBS);
  const rec = await comoPromise<{ id: string; faixas: BlobFaixa[] } | undefined>(store.get(id));
  return rec?.faixas ?? [];
}

export async function apagarProjeto(id: string): Promise<void> {
  const db = await abrir();
  const tx = db.transaction([META, BLOBS], 'readwrite');
  tx.objectStore(META).delete(id);
  tx.objectStore(BLOBS).delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
