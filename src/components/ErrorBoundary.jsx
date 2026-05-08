import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-main)' }}>
          <h2 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>عذراً، حدث خطأ غير متوقع.</h2>
          <p style={{ marginBottom: '1rem' }}>الرجاء إعادة تحميل الصفحة للمحاولة مرة أخرى.</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
