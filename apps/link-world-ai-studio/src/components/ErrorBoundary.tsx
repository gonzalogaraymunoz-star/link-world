import React from 'react';

export class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('LINK World: error de interfaz', error); }
  render() {
    if (this.state.failed) return <main className="p-8 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">No se pudo mostrar esta mesa</h1>
      <p className="text-sm">Actualiza la página para volver a conectar con LINK.</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2" style={{background: 'var(--link-fluor)',color:'#111'}}>Volver a cargar</button>
    </main>;
    return this.props.children;
  }
}
