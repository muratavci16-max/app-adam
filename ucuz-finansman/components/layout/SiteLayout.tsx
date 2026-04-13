import Header from './Header'
import Footer from './Footer'

interface SiteLayoutProps {
  children: React.ReactNode
  footerContent?: {
    yasal_uyari?: string
    adres?: string
    telefon?: string
    email?: string
    sosyal_medya?: Record<string, string>
    hizli_linkler?: { label: string; href: string }[]
  }
}

export default function SiteLayout({ children, footerContent }: SiteLayoutProps) {
  return (
    <>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer content={footerContent} />
    </>
  )
}
