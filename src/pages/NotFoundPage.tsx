import { Link } from 'react-router-dom'
import InfoPage from '../components/public/InfoPage'
import { usePageMeta } from '../hooks/usePageMeta'

export default function NotFoundPage() {
  usePageMeta({ title: 'Page not found', description: "This page doesn't exist.", noindex: true })

  return (
    <InfoPage title="Page not found">
      <p className="text-sm text-gray-light">
        There's nothing at this address. It may have moved, or the link may be wrong.
      </p>
      <Link to="/" className="self-start rounded-pill bg-blue-brand px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110">
        Go to the home page
      </Link>
    </InfoPage>
  )
}
