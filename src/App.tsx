/** @author Dogan Kusluoglu */
import { GridViewport } from './components/GridViewport';
import { Toolbar } from './components/Toolbar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { WordList } from './components/WordList';
import { EngramRoots } from './components/EngramRoots';

function App() {
  return (
    <div className="flex flex-col h-screen w-full bg-white font-mono text-black selection:bg-black selection:text-white">
      <Toolbar />
      <Breadcrumbs />
      <div className="flex flex-grow overflow-hidden">
        <EngramRoots />
        <main className="flex-grow relative">
          <GridViewport />
        </main>
        <WordList />
      </div>
    </div>
  );
}

export default App;
