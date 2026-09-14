import { useNavigate } from 'react-router-dom'
import SettingsPanel from '../components/SettingsPanel'

export default function SettingsPage() {
  const navigate = useNavigate()

  return (
    <main className="mx-auto flex max-w-4xl flex-col px-4 py-8 gap-6 sm:px-6 sm:py-10 sm:gap-8">
      <SettingsPanel onClose={() => navigate('/profile')} closeLabel="Back" />
    </main>
  )
}
