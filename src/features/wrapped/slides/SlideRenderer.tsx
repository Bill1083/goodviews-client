import type { WrappedReady, WrappedSlide } from '../../../types/stats'
import { CriticSlide, HatesSlide, HiddenGemSlide, HotTakeSlide, LovesSlide, RewatchesSlide, WordsSlide } from './FilmSlides'
import { IntroSlide, MonthsSlide, VolumeSlide } from './OpeningSlides'
import PersonaSlide from './PersonaSlide'
import { FriendsSlide, WatchlistSlide, WorldSlide } from './SocialSlides'
import SummarySlide from './SummarySlide'
import { ErasSlide, GenresSlide, PeopleSlide } from './TasteSlides'

interface Props {
  slide: WrappedSlide
  data: WrappedReady
  onReplay: () => void
  onExit: () => void
}

/** Picks the component for a slide kind. Unknown kinds (a newer backend)
 * render nothing rather than breaking the story. */
export default function SlideRenderer({ slide, data, onReplay, onExit }: Props) {
  switch (slide.kind) {
    case 'intro':
      return <IntroSlide slide={slide} year={data.year} />
    case 'volume':
      return <VolumeSlide slide={slide} />
    case 'months':
      return <MonthsSlide slide={slide} year={data.year} />
    case 'genres':
      return <GenresSlide slide={slide} />
    case 'eras':
      return <ErasSlide slide={slide} />
    case 'people':
      return <PeopleSlide slide={slide} />
    case 'loves':
      return <LovesSlide slide={slide} />
    case 'hates':
      return <HatesSlide slide={slide} />
    case 'hot_take':
      return <HotTakeSlide slide={slide} />
    case 'critic':
      return <CriticSlide slide={slide} />
    case 'rewatches':
      return <RewatchesSlide slide={slide} />
    case 'words':
      return <WordsSlide slide={slide} />
    case 'watchlist':
      return <WatchlistSlide slide={slide} />
    case 'friends':
      return <FriendsSlide slide={slide} />
    case 'hidden_gem':
      return <HiddenGemSlide slide={slide} />
    case 'world':
      return <WorldSlide slide={slide} />
    case 'persona':
      return <PersonaSlide slide={slide} />
    case 'summary':
      return <SummarySlide slide={slide} year={data.year} onReplay={onReplay} onExit={onExit} />
    default:
      return null
  }
}
