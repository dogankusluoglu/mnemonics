/** @author Dogan Kusluoglu */
import { GridViewport } from './components/GridViewport';
import { ThreeMapViewport } from './components/ThreeMapViewport';
import { Toolbar } from './components/Toolbar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { WordList } from './components/WordList';
import { EngramRoots } from './components/EngramRoots';
import { WelcomeModal } from './components/WelcomeModal';
import { useMnemonicStore } from './store/useMnemonicStore';
import { useEffect } from 'react';

function App() {
  const { leftPanelOpen, rightPanelOpen, closePanels, theme, viewMode } = useMnemonicStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-[#0a0a0a] font-mono text-black dark:text-white selection:bg-black dark:selection:bg-white selection:text-white dark:selection:text-black overflow-hidden">
      <Toolbar />
      <WelcomeModal />
      <Breadcrumbs />
      <div className="flex flex-grow relative overflow-hidden">
        {/* Mobile Backdrop */}
        {(leftPanelOpen || rightPanelOpen) && (
          <div 
            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 transition-opacity"
            onClick={closePanels}
          />
        )}

        {/* Left Panel (Engram Roots) */}
        <aside className={`
          fixed md:relative z-40 h-full transition-all duration-300 ease-in-out border-black dark:border-white/20
          ${leftPanelOpen ? 'w-64 border-r translate-x-0' : 'w-0 border-r-0 -translate-x-full md:translate-x-0 overflow-hidden'}
        `}>
          <div className="w-64 h-full">
            <EngramRoots />
          </div>
        </aside>

        <main className="flex-grow relative overflow-hidden">
          {viewMode === 'grid2d' ? <GridViewport /> : <ThreeMapViewport />}
        </main>

        {/* Right Panel (Word List) */}
        <aside className={`
          fixed md:relative right-0 z-40 h-full transition-all duration-300 ease-in-out border-black dark:border-white/20
          ${rightPanelOpen ? 'w-80 border-l translate-x-0' : 'w-0 border-l-0 translate-x-full md:translate-x-0 overflow-hidden'}
        `}>
          <div className="w-80 h-full">
            <WordList />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
