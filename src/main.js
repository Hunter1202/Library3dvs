import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { inject } from '@vercel/analytics'

// Initialize Vercel Web Analytics
inject({ mode: import.meta.env.DEV ? 'development' : 'production' })

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
