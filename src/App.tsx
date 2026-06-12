import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import ProjectList from '@/pages/ProjectList'
import ProjectNew from '@/pages/ProjectNew'
import ProjectDetail from '@/pages/ProjectDetail'
import Scheduling from '@/pages/Scheduling'
import Approval from '@/pages/Approval'
import Monitoring from '@/pages/Monitoring'
import Documents from '@/pages/Documents'
import Statistics from '@/pages/Statistics'
import Floorplan from '@/pages/Floorplan'
import Experts from '@/pages/Experts'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/new" element={<ProjectNew />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/approval" element={<Approval />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/floorplan" element={<Floorplan />} />
          <Route path="/experts" element={<Experts />} />
        </Route>
      </Routes>
    </Router>
  )
}
