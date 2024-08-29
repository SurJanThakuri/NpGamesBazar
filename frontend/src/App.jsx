import { useState } from 'react'
import Dummy from './screens/Dummy'
import Dashboard from './screens/Dashboard'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Hello</h1>
      <Dashboard />
    </>
  )
}

export default App
