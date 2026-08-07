import { Navigate, Route, Routes } from 'react-router-dom'
import coursesSource from '../design/mockup/courses.html?raw'
import favoritesSource from '../design/mockup/favorites.html?raw'
import homeSource from '../design/mockup/home.html?raw'
import lessonSource from '../design/mockup/lesson.html?raw'
import mySource from '../design/mockup/my.html?raw'
import videoStudySource from '../design/mockup/video-study.html?raw'
import videosSource from '../design/mockup/videos.html?raw'
import { PrototypePage } from './components/PrototypePage'
import { SiteLayout } from './components/SiteLayout'
import { JyutpingPage } from './pages/JyutpingPage'
import { LoginPage } from './pages/LoginPage'
import { WordsPage } from './pages/WordsPage'

export function App() {
  return (
    <Routes>
      <Route index element={<PrototypePage source={homeSource} pageId="home" />} />
      <Route path="courses" element={<PrototypePage source={coursesSource} pageId="courses" />} />
      <Route path="courses/:unitId" element={<PrototypePage source={coursesSource} pageId="courses" />} />
      <Route path="lessons/:lessonId" element={<PrototypePage source={lessonSource} pageId="lesson" />} />
      <Route path="videos" element={<PrototypePage source={videosSource} pageId="videos" />} />
      <Route path="watch/:videoId" element={<PrototypePage source={videoStudySource} pageId="video-study" />} />
      <Route path="favorites" element={<PrototypePage source={favoritesSource} pageId="favorites" />} />
      <Route path="my" element={<PrototypePage source={mySource} pageId="my" />} />
      <Route element={<SiteLayout />}>
        <Route path="jyutping" element={<JyutpingPage />} />
        <Route path="words" element={<WordsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
