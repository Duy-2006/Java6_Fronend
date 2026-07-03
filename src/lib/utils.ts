/*
 * utils.ts
 * Ham tien ich dung chung trong toan du an.
 * cn(): gop nhieu class CSS lai thanh 1 chuoi, tu dong xu ly xung dot giua cac class Tailwind.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Ham gop class CSS: ket hop clsx (xu ly dieu kien) va twMerge (giai quyet xung dot Tailwind)
// Vi du: cn("text-red-500", condition && "text-blue-500", "p-4") => "text-blue-500 p-4"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
