import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function cleanCPF(cpf: string) {
  return cpf.replace(/\D/g, "")
}

export function formatCEP(cep: string) {
  return cep
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d)/, "$1-$2")
    .substring(0, 9)
}

export function formatPhone(phone: string) {
  return phone
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15)
}

/**
 * Gera um número de cartão único no formato: [Letra][00000-99999]
 * Exemplo: A12345, Z98765
 * 
 * @returns String com 1 letra maiúscula (A-Z) seguida de 5 dígitos numéricos
 */
export function generateCardNumber(): string {
  // Gera uma letra aleatória de A-Z (códigos ASCII 65-90)
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  
  // Gera 5 dígitos numéricos (00000-99999)
  const numbers = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  
  return `${letter}${numbers}`
}
