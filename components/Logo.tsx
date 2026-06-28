export function Logo({ size = 24, color = "currentColor", className = "" }: { size?: number, color?: string, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* Contorno da Casa (Esquerda e Fundo) */}
      <path d="M10 3L3 9v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
      {/* Gráfico / Seta subindo que rompe o teto direito */}
      <path d="M4 20l6-7 3 3 8-10" />
      <path d="M15 6h6v6" />
    </svg>
  )
}
