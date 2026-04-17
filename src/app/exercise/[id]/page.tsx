export default async function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <div className="panel" id="source-panel">
        <div className="panel-hdr">source.c</div>
        <div id="exercise-desc">Exercise: {id}</div>
        <div className="panel-body">
          <div id="source-code"></div>
        </div>
      </div>
      <div className="panel" id="stack-panel">
        <div className="panel-hdr">stack</div>
        <div className="panel-body">
          <div id="stack-viz"></div>
          <div id="heap-viz" style={{ display: 'none' }}></div>
        </div>
      </div>
      <div className="panel" id="input-panel">
        <div className="panel-hdr">input</div>
        <div className="panel-body">
          <div id="input-area"></div>
        </div>
      </div>
      <div className="panel" id="log-panel">
        <div className="panel-hdr">execution log</div>
        <div className="panel-body">
          <div id="exec-log"></div>
        </div>
      </div>
    </>
  );
}
