import { create } from 'zustand'

/** A voluntary "replay this tutorial" request from TutorialsHelpModal,
 * handed off to TutorialManager (mounted once at the App root). The
 * request has to be routed through here rather than rendered straight from
 * the Help modal itself — a spotlight tour can navigate to a different
 * page mid-tour, which would unmount the modal (and the tour inside it)
 * along with whatever page opened it. TutorialManager lives outside
 * <AppRoutes> and survives navigation, so it's the only safe place to
 * actually render one. */
interface TutorialReplayState {
  replayKey: string | null
  requestReplay: (key: string) => void
  clearReplay: () => void
}

export const useTutorialReplayStore = create<TutorialReplayState>((set) => ({
  replayKey: null,
  requestReplay: (key) => set({ replayKey: key }),
  clearReplay: () => set({ replayKey: null }),
}))
