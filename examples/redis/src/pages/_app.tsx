import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Disable any sorts of prefetching
  router.prefetch = async () => void 0

  return <Component {...pageProps} />
}
export default MyApp
