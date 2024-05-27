import { ErrorBoundary } from "react-error-boundary";

import './App.css'
import ExampleCompletion from './components/ExampleCompletion'


function App() {
  return (
    <>
      <h1>CUDAlive</h1>
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
      <ExampleCompletion />
</ErrorBoundary>
    </>
  )
}

export default App
