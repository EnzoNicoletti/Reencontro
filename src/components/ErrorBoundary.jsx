import { Component } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Ocorreu um erro inesperado na aplicação.',
    };
  }

  componentDidCatch(error, info) {
    console.error('Erro capturado pelo ErrorBoundary:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F9F6] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-[#E2E9E1] rounded-2xl p-6 shadow-card text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FDF0ED] text-[#B04332] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="font-display text-xl font-semibold text-[#26352B]">
              Algo não saiu como esperado
            </h1>
            <p className="text-sm text-[#6B786D] leading-relaxed">
              Encontramos uma instabilidade momentânea ao carregar esta página. Seus dados continuam seguros.
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-5 h-12 rounded-lg bg-[#52765A] hover:bg-[#425E48] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Voltar para o início
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
