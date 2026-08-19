import { getAudioContext } from '../../audio/audioContext';

export type Note = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export const NOTAS: Note[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Nome de arquivo por nota. Sem "#" — esse caractere tem significado especial em URL
// (marca fragmento, tipo pagina.html#secao) e cortaria o resto do caminho.
const ARQUIVO_DA_NOTA: Record<Note, string> = {
    C: 'C',
    'C#': 'Csharp',
    D: 'D',
    'D#': 'Dsharp',
    E: 'E',
    F: 'F',
    'F#': 'Fsharp',
    G: 'G',
    'G#': 'Gsharp',
    A: 'A',
    'A#': 'Asharp',
    B: 'B',
};

interface Tons {
    buffer: AudioBuffer; // decodificado uma vez, reusado pra sempre
    volume: GainNode; // fade de entrada/saída do usuário + roteamento pro volume geral
    fontesAtivas: AudioBufferSourceNode[]; // instâncias tocando/agendadas agora (0, 1 ou 2 por causa da sobreposição)
    agendadorId: ReturnType<typeof setInterval> | null;
}

const tons: Partial<Record<Note, Tons>> = {};

let volumeGeral: GainNode | undefined;

function obterVolumeGeral(): GainNode {
    if (!volumeGeral) {
        volumeGeral = getAudioContext().createGain();
        volumeGeral.connect(getAudioContext().destination);
    }
    return volumeGeral;
}

export function definirVolumeGeral(valor: number) {
    obterVolumeGeral().gain.value = valor;
}

const FADE_ENTRADA_SEGUNDOS = 5;
const FADE_SAIDA_SEGUNDOS = 1.2;

// Loop com crossfade: em vez do `.loop = true` nativo (que só reinicia, sem
// disfarçar descompasso de forma de onda na emenda), cada repetição é uma
// instância própria, que começa um pouco ANTES da anterior terminar — as duas
// se sobrepõem por `DURACAO_CROSSFADE_SEGUNDOS`, uma sumindo enquanto a outra
// aparece. Como sabemos a duração exata do buffer, dá pra agendar cada início
// com precisão (sem depender de evento nenhum do navegador).
const DURACAO_CROSSFADE_SEGUNDOS = 1;
const JANELA_AGENDAMENTO_SEGUNDOS = 2; // agenda instâncias que começam nos próximos 2s
const INTERVALO_VERIFICACAO_MS = 500; // confere se precisa agendar mais, a cada 500ms

function iniciarLoopComCrossfade(tom: Tons, tempoInicio: number): ReturnType<typeof setInterval> {
    const duracaoBuffer = tom.buffer.duration;
    const periodo = duracaoBuffer - DURACAO_CROSSFADE_SEGUNDOS; // tempo entre um início e o próximo
    let proximaRepeticao = 0;

    function agendarInstancia(tempoDeInicio: number) {
        const contexto = getAudioContext();

        const fonte = contexto.createBufferSource();
        fonte.buffer = tom.buffer;

        // Envelope próprio dessa instância: sobe no início, segura, desce no final —
        // é essa sobreposição de subida/descida entre instâncias vizinhas que faz o crossfade.
        const envelope = contexto.createGain();
        envelope.gain.setValueAtTime(0, tempoDeInicio);
        envelope.gain.linearRampToValueAtTime(1, tempoDeInicio + DURACAO_CROSSFADE_SEGUNDOS);
        envelope.gain.setValueAtTime(1, tempoDeInicio + duracaoBuffer - DURACAO_CROSSFADE_SEGUNDOS);
        envelope.gain.linearRampToValueAtTime(0, tempoDeInicio + duracaoBuffer);

        fonte.connect(envelope);
        envelope.connect(tom.volume);
        fonte.start(tempoDeInicio);
        fonte.stop(tempoDeInicio + duracaoBuffer);

        tom.fontesAtivas.push(fonte);
        fonte.onended = () => {
            tom.fontesAtivas = tom.fontesAtivas.filter((f) => f !== fonte);
        };
    }

    function agendarProximas() {
        const contexto = getAudioContext();
        const limite = contexto.currentTime + JANELA_AGENDAMENTO_SEGUNDOS;

        while (tempoInicio + proximaRepeticao * periodo <= limite) {
            agendarInstancia(tempoInicio + proximaRepeticao * periodo);
            proximaRepeticao++;
        }
    }

    agendarProximas();
    return setInterval(agendarProximas, INTERVALO_VERIFICACAO_MS);
}

export async function tocar(nota: Note) {
    let tom = tons[nota];
    if (!tom) {
        const resposta = await fetch(`/pads/${ARQUIVO_DA_NOTA[nota]}.mp3`);
        const dados = await resposta.arrayBuffer();
        const buffer = await getAudioContext().decodeAudioData(dados);

        const volume = getAudioContext().createGain();
        volume.connect(obterVolumeGeral());

        tons[nota] = { buffer, volume, fontesAtivas: [], agendadorId: null };
        tom = tons[nota];
    }
    if (!tom) throw new Error(`Tom ${nota} não encontrado`);

    // Fade de entrada: sobe de 0 até o volume cheio, só no início (não se repete
    // a cada volta do loop — isso também cancela qualquer fade de saída que um
    // "parar" anterior tenha deixado agendado nesse GainNode).
    const contexto = getAudioContext();
    tom.volume.gain.cancelScheduledValues(contexto.currentTime);
    tom.volume.gain.setValueAtTime(0, contexto.currentTime);
    tom.volume.gain.linearRampToValueAtTime(1, contexto.currentTime + FADE_ENTRADA_SEGUNDOS);

    if (tom.agendadorId !== null) {
        clearInterval(tom.agendadorId);
    }
    tom.fontesAtivas.forEach((f) => f.stop());
    tom.fontesAtivas = [];

    const tempoInicio = contexto.currentTime;
    tom.agendadorId = iniciarLoopComCrossfade(tom, tempoInicio);
}

export function parar(nota: Note) {
    const tom = tons[nota];
    if (!tom || tom.fontesAtivas.length === 0) return;

    if (tom.agendadorId !== null) {
        clearInterval(tom.agendadorId);
        tom.agendadorId = null;
    }

    const contexto = getAudioContext();
    tom.volume.gain.cancelScheduledValues(contexto.currentTime);
    tom.volume.gain.setValueAtTime(tom.volume.gain.value, contexto.currentTime);
    tom.volume.gain.linearRampToValueAtTime(0, contexto.currentTime + FADE_SAIDA_SEGUNDOS);

    const tempoParada = contexto.currentTime + FADE_SAIDA_SEGUNDOS;
    tom.fontesAtivas.forEach((f) => f.stop(tempoParada));
    tom.fontesAtivas = [];
}
