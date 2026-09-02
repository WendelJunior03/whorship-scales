import { Mp3Encoder } from '@breezystack/lamejs';

// Comprime um AudioBuffer pra MP3 (pra guardar o projeto ocupando ~10x menos
// espaço no navegador). Puro-JS, roda no navegador, offline. A reprodução da
// sessão continua em qualidade cheia — isto afeta só o que fica SALVO.

/** Float32 [-1,1] → Int16 (clampado). */
function paraInt16(f32: Float32Array): Int16Array {
  const out = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/** Devolve o controle pro navegador (deixa pintar a tela/responder input). */
function cederControle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Codifica o AudioBuffer em MP3 (128 kbps por padrão) e devolve um Blob.
 * Mantém mono/estéreo (até 2 canais) e a taxa de amostragem do buffer.
 *
 * O encoder é puro-JS e síncrono — pra uma faixa de alguns minutos, o loop
 * inteiro sem pausa trava a thread principal por vários segundos (o navegador
 * não consegue nem pintar a tela de "Comprimindo e salvando…" nesse tempo,
 * fica com cara de travado). Por isso cede o controle de volta ao navegador
 * a cada N blocos — mantém a UI responsiva/pintando durante a compressão.
 */
export async function comprimirMp3(buffer: AudioBuffer, kbps = 128): Promise<Blob> {
  const canais = Math.min(2, buffer.numberOfChannels);
  const rate = buffer.sampleRate;
  const enc = new Mp3Encoder(canais, rate, kbps);

  const esq = paraInt16(buffer.getChannelData(0));
  const dir = canais > 1 ? paraInt16(buffer.getChannelData(1)) : null;

  const partes: ArrayBuffer[] = [];
  const BLOCO = 1152; // tamanho de frame que o lamejs espera
  const BLOCOS_POR_PAUSA = 200; // ~5s de áudio (44.1kHz) entre cada pausa
  let blocosDesdeAPausa = 0;
  for (let i = 0; i < esq.length; i += BLOCO) {
    const l = esq.subarray(i, i + BLOCO);
    const r = dir ? dir.subarray(i, i + BLOCO) : undefined;
    const mp3 = r ? enc.encodeBuffer(l, r) : enc.encodeBuffer(l);
    if (mp3.length > 0) partes.push(new Uint8Array(mp3).buffer);
    if (++blocosDesdeAPausa >= BLOCOS_POR_PAUSA) {
      blocosDesdeAPausa = 0;
      await cederControle();
    }
  }
  const fim = enc.flush();
  if (fim.length > 0) partes.push(new Uint8Array(fim).buffer);

  return new Blob(partes, { type: 'audio/mpeg' });
}
