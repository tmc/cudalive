import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "react-error-boundary";

import { CUDALiveConverter } from "@/components/cudalive-converter";
import './App.css'

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ErrorBoundary fallback={<p>Something went wrong</p>}>
          <CUDALiveConverter />
        </ErrorBoundary>
      </ThemeProvider>
    </>
  )
}

export default App
