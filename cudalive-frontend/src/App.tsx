import { ErrorBoundary } from "react-error-boundary";

import './App.css'
import ExampleCompletion from './components/ExampleCompletion'

import { Button } from "@/components/ui/button"


function App() {
  return (
    <>
      <h1>CUDAlive</h1>
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
        <Button>Click me</Button>
        <ExampleCompletion />
      </ErrorBoundary>
    </>
  )
}

export default App
