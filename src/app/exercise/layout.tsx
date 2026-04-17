export default function ExerciseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="app">
      <header>
        <h1>// MEMORY CORRUPTION LAB</h1>
        <nav id="exercise-nav">{/* populated by ExerciseNav component later */}</nav>
        <div id="badges"></div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
}
