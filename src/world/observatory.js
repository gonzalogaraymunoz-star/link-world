const DRIVE_FOLDER_URL='https://drive.google.com/drive/folders/1AN00cm7Ya69o384jiCpB4sPyT9nyjt2V';
const OMNIGET_REPO='https://github.com/OpenSelena/omniget';

export function mountObservatory(){
  const root=document.querySelector('#lw-observatory');
  if(!root)return {open(){},close(){}};
  root.innerHTML=`
    <div class="obs-shell">
      <header class="obs-head">
        <div><span class="lw-kicker">OBS · OBSERVATORIO DE APRENDIZAJE</span><h1>Del mundo exterior a memoria reutilizable.</h1>
        <p>OmniGet captura. Drive conserva la evidencia. OBS transforma. Hipocampo recuerda. Los LINKDOT reutilizan.</p></div>
        <span class="obs-state">CAPACIDAD TRANSVERSAL</span>
      </header>
      <div class="obs-flow" aria-label="Flujo del Observatorio">
        <article><b>01</b><strong>Captura</strong><span>OmniGet · URL, video, audio, documento</span></article>
        <article><b>02</b><strong>Evidencia</strong><span>Drive · original inmutable</span></article>
        <article><b>03</b><strong>Comprensión</strong><span>Transcripción + extracción + MD</span></article>
        <article><b>04</b><strong>Memoria</strong><span>Hipocampo · fuente + tags + relaciones</span></article>
        <article><b>05</b><strong>Aplicación</strong><span>LINKDOT / Skill / misión</span></article>
        <article><b>06</b><strong>Aprendizaje</strong><span>Resultado vuelve al Observatorio</span></article>
      </div>
      <section class="obs-source">
        <div><span class="lw-kicker">FUENTE ACTIVA</span><h2>Videos Reel IA</h2>
        <p>Carpeta canónica de captura audiovisual. No se reemplaza por la biblioteca local de OmniGet.</p></div>
        <a href="${DRIVE_FOLDER_URL}" target="_blank" rel="noopener noreferrer">Abrir carpeta Drive ↗</a>
      </section>
      <div class="obs-grid">
        <section><span class="lw-kicker">CAPTURADOR</span><h3>OmniGet</h3><p>Puerta de entrada local para Instagram, YouTube y otras fuentes. Puede descargar, transcribir y exponer operaciones mediante CLI/MCP.</p><a href="${OMNIGET_REPO}" target="_blank" rel="noopener noreferrer">OpenSelena/omniget ↗</a></section>
        <section><span class="lw-kicker">REGLA</span><h3>La fuente no se pierde</h3><p>Cada aprendizaje conserva URL, archivo original, fecha de captura y vínculo a Drive. El MD es una interpretación; nunca sustituye la evidencia.</p></section>
        <section><span class="lw-kicker">DESTINO</span><h3>Hipocampo</h3><p>Solo recibe conocimiento estructurado y trazable. El video bruto vive en Drive; el conocimiento útil entra a la memoria del organismo.</p></section>
        <section><span class="lw-kicker">RETORNO</span><h3>Aprender haciendo</h3><p>Cuando un LINKDOT usa un aprendizaje, el resultado y su evidencia vuelven a OBS para reforzar, corregir o descartar el modelo.</p></section>
      </div>
      <p class="obs-boundary"><strong>Límite actual:</strong> LINK WORLD está desplegado en la nube y OmniGet corre localmente. La unión operativa debe hacerse mediante el bridge controlado del Mac/MCP; no exponiendo el servidor local de OmniGet a Internet.</p>
    </div>`;
  return {open(){root.dataset.open='true';},close(){delete root.dataset.open;}};
}
