// AudioEngine central do Multitrack (web-only). Todas as faixas tocam a partir
// de um único AudioContext, com AudioBufferSourceNode iniciados no MESMO instante
// (`when`) e no mesmo offset — garante sincronização amostra-a-amostra. Volume,
// mudo e solo são feitos por um GainNode por faixa. Não usa <audio> independente.

interface FaixaInterna {
  id: string;
  buffer: AudioBuffer;
  gain: GainNode;
  source: AudioBufferSourceNode | null;
  volume: number;
  mudo: boolean;
  solo: boolean;
}

// Pequeno lookahead pra agendar todas as fontes no mesmo `when` sem "corrida".
const LOOKAHEAD = 0.06;

export class MultitrackEngine {
  private ctx: AudioContext;
  private master: GainNode;
  private faixas: FaixaInterna[] = [];
  private tocando = false;
  private startedAt = 0; // ctx.currentTime do último start
  private startOffset = 0; // posição (s) no áudio quando começou

  constructor() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
  }

  get duracao(): number {
    return this.faixas.reduce((max, f) => Math.max(max, f.buffer.duration), 0);
  }

  /**
   * Picos normalizados (0..1) do áudio, pra desenhar a waveform. Usa a faixa mais
   * longa como referência e reduz o canal 0 a `n` colunas (máximo por bloco).
   */
  getPeaks(n: number): number[] {
    const ref = this.faixas.reduce<FaixaInterna | null>(
      (maior, f) => (!maior || f.buffer.duration > maior.buffer.duration ? f : maior),
      null,
    );
    if (!ref) return [];
    const dados = ref.buffer.getChannelData(0);
    const bloco = Math.max(1, Math.floor(dados.length / n));
    const picos: number[] = [];
    let maxGlobal = 0;
    for (let i = 0; i < n; i++) {
      let max = 0;
      const ini = i * bloco;
      for (let j = 0; j < bloco; j++) {
        const v = Math.abs(dados[ini + j] ?? 0);
        if (v > max) max = v;
      }
      picos.push(max);
      if (max > maxGlobal) maxGlobal = max;
    }
    // Normaliza pra 0..1 (evita divisão por zero em áudio silencioso).
    return maxGlobal > 0 ? picos.map((p) => p / maxGlobal) : picos;
  }

  get estaTocando(): boolean {
    return this.tocando;
  }

  get posicao(): number {
    if (!this.tocando) return this.startOffset;
    const t = this.ctx.currentTime - this.startedAt + this.startOffset;
    return Math.min(this.duracao, Math.max(0, t));
  }

  /** Decodifica um arquivo e adiciona como faixa. Retorna a duração dela. */
  async adicionarArquivo(id: string, arquivo: File): Promise<number> {
    const dados = await arquivo.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(dados);
    const gain = this.ctx.createGain();
    gain.gain.value = 1;
    gain.connect(this.master);
    this.faixas.push({ id, buffer, gain, source: null, volume: 1, mudo: false, solo: false });
    this.aplicarGanhos();
    return buffer.duration;
  }

  removerFaixa(id: string) {
    const f = this.faixas.find((x) => x.id === id);
    if (!f) return;
    try {
      f.source?.stop();
    } catch {
      // já parada
    }
    f.gain.disconnect();
    this.faixas = this.faixas.filter((x) => x.id !== id);
    this.aplicarGanhos();
  }

  private iniciarFontes(offset: number) {
    const when = this.ctx.currentTime + LOOKAHEAD;
    for (const f of this.faixas) {
      if (offset >= f.buffer.duration) {
        f.source = null;
        continue; // faixa mais curta já terminou nesse ponto
      }
      const src = this.ctx.createBufferSource();
      src.buffer = f.buffer;
      src.connect(f.gain);
      src.start(when, offset);
      f.source = src;
    }
    this.startedAt = when;
    this.startOffset = offset;
  }

  private pararFontes() {
    for (const f of this.faixas) {
      try {
        f.source?.stop();
      } catch {
        // já parada
      }
      f.source = null;
    }
  }

  async play() {
    if (this.tocando || this.faixas.length === 0) return;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.iniciarFontes(this.startOffset);
    this.tocando = true;
  }

  pause() {
    if (!this.tocando) return;
    const pos = this.posicao;
    this.pararFontes();
    this.startOffset = pos;
    this.tocando = false;
  }

  stop() {
    this.pararFontes();
    this.startOffset = 0;
    this.tocando = false;
  }

  seek(segundos: number) {
    const alvo = Math.min(this.duracao, Math.max(0, segundos));
    if (this.tocando) {
      this.pararFontes();
      this.iniciarFontes(alvo);
    } else {
      this.startOffset = alvo;
    }
  }

  setVolume(id: string, v: number) {
    const f = this.faixas.find((x) => x.id === id);
    if (f) {
      f.volume = Math.min(1, Math.max(0, v));
      this.aplicarGanhos();
    }
  }

  setMudo(id: string, mudo: boolean) {
    const f = this.faixas.find((x) => x.id === id);
    if (f) {
      f.mudo = mudo;
      this.aplicarGanhos();
    }
  }

  setSolo(id: string, solo: boolean) {
    const f = this.faixas.find((x) => x.id === id);
    if (f) {
      f.solo = solo;
      this.aplicarGanhos();
    }
  }

  /** Recalcula o ganho de cada faixa considerando mudo e solo. */
  private aplicarGanhos() {
    const temSolo = this.faixas.some((f) => f.solo);
    for (const f of this.faixas) {
      const audivel = !f.mudo && (!temSolo || f.solo);
      f.gain.gain.value = audivel ? f.volume : 0;
    }
  }

  destruir() {
    this.pararFontes();
    this.ctx.close().catch(() => undefined);
  }
}
