import { randomInt } from "node:crypto";

const alfabeto = ('ABCDEFGHJKLMNPQRSTUVWXYZ');
const numeros = ('23456789');
const caracteres_possiveis = alfabeto + numeros;

export function gerarPrefixo(nome: string) {
  const palavras = nome
  
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

    if (palavras.length === 0){
    throw new Error('Prefixo não fornecido!');
    }

    if (palavras.length >= 2) {
        return palavras.map(p => p[0]!.toUpperCase()).join(''); 
    }

    return palavras[0]!.slice(0, 2).toUpperCase();
}

export function gerarOrgCode(prefixo: string) {
    if (prefixo.length === 0){
        throw new Error('Prefixo não fornecido para gerar OrgCode');
    }
    const sufixo = Array.from({ length: 6 })
    .map(() => caracteres_possiveis[randomInt(caracteres_possiveis.length)])
    .join('');
    return prefixo + "-" + sufixo 
}       