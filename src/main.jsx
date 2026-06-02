import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Error boundary — catches React render crashes that are silent in production
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '24px', fontFamily: 'monospace',
          background: '#fff', color: '#D85A30',
          minHeight: '100dvh', whiteSpace: 'pre-wrap',
          fontSize: '13px', lineHeight: 1.6,
        }}>
          <strong>App crashed. Please share this with the developer:</strong>
          {'\n\n'}
          {String(this.state.error)}
          {'\n'}
          {this.state.error?.stack}
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
