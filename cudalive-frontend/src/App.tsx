import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { ErrorBoundary } from "react-error-boundary";

import './App.css'
import ExampleCompletion from './components/ExampleCompletion'

import { Button } from "@/components/ui/button"


function App() {
  return (
    <>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <h1>CUDAlive</h1>
      <ModeToggle />
      <ErrorBoundary fallback={<p>Something went wrong</p>}>
        <Button>Click me</Button>
        <ExampleCompletion />
      </ErrorBoundary>
    </ThemeProvider>
    </>
  )
}

export default App
