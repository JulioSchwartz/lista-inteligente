export const metadata = {
  title: 'Lista Inteligente',
  description: 'App de compras'
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
