import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"
import setupClientProxy from "./server.ts"

// Add process polyfill for web3.js
if (typeof window !== "undefined" && !window.process) {
  window.process = { env: {} } as any
}

// Set up client-side API proxy
setupClientProxy()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
