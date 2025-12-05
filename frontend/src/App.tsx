import './App.css'
import { GotchiProvider, useGotchi } from './contexts/GotchiContext'
import { Canvas, EvolutionAnimation, Input, Popup, SkeletonScreen, LoadingSpinner, Header } from './components'

function AppContent() {
  const { 
    isLoading,
    isAnalyzingEmotions,
    isGeneratingArt,
    isGeneratingPoetry,
    isEvolutionAnimationPlaying, 
    evolutionFromStage, 
    evolutionToStage,
    completeEvolutionAnimation,
    currentExpression,
    closeExpression
  } = useGotchi();

  // Show skeleton screen during initial load
  if (isLoading) {
    return <SkeletonScreen />;
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      backgroundColor: '#0a0014',
      position: 'relative'
    }}>
      <Header />
      <Canvas />
      <Input />
      
      {/* Evolution Animation Overlay */}
      {isEvolutionAnimationPlaying && evolutionFromStage !== null && evolutionToStage !== null && (
        <EvolutionAnimation
          fromStage={evolutionFromStage}
          toStage={evolutionToStage}
          onComplete={completeEvolutionAnimation}
        />
      )}
      
      {/* Expression Popup */}
      <Popup expression={currentExpression} onClose={closeExpression} />
    </div>
  );
}

function App() {
  return (
    <GotchiProvider>
      <AppContent />
    </GotchiProvider>
  )
}

export default App
