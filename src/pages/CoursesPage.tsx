import { ArrowRight, CheckCircle2, LockKeyhole, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageIntro } from '../components/SiteLayout'
import { courseUnits } from '../data'
import { useApp } from '../state/AppContext'

export function CoursesPage() {
  const { text } = useApp()
  return <>
    <PageIntro eyebrow="SCENE COURSES" title="场景课程" traditionalTitle="場景課程" description="从香港每天都会遇见的场景开始，一课学会几句真正用得上的粤语。" />
    <section className="section compact-top"><div className="container course-list">
      {courseUnits.map((unit, index) => <article className={`course-row tone-${unit.tone}`} key={unit.id}>
        <div className="course-row-no">{unit.no}</div>
        <div className="course-row-copy"><span className="eyebrow">UNIT {unit.no}</span><h2>{text(unit.title, unit.traditional)}</h2><p>{text(unit.desc)}</p><div className="progress-track"><span style={{ width: `${unit.progress}%` }} /></div><small>{unit.progress ? text(`已完成 ${unit.progress}%`, `已完成 ${unit.progress}%`) : text('尚未开始', '尚未開始')}</small></div>
        <div className="lesson-dots">{Array.from({ length: unit.lessons }).map((_, lesson) => <span key={lesson} className={index === 0 && lesson < 2 ? 'done' : lesson === 0 ? 'next' : ''}>{index === 0 && lesson < 2 ? <CheckCircle2 /> : lesson === 0 ? <PlayCircle /> : <LockKeyhole />}{text(`第 ${lesson + 1} 课`, `第 ${lesson + 1} 課`)}</span>)}</div>
        <Link className="btn btn-outline" to={`/lessons/${unit.id}-1`}>{unit.progress ? text('继续学习', '繼續學習') : text('开始课程', '開始課程')}<ArrowRight size={17} /></Link>
      </article>)}
    </div></section>
  </>
}
