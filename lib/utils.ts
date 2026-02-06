import { type ClassValue, clsx } from "clsx"
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
