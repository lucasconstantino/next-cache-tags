import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { Analytics } from '@vercel/analytics/react'

import '../styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Disable any sorts of prefetching to simplify comprehension
  // of the cache-tags cleaning events.
  router.prefetch = async () => void 0

  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}
export default MyApp
