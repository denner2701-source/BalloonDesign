const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const canvas = $('#design-canvas');
const ctx = canvas.getContext('2d');
const guideCanvas = $('#guide-canvas');
const storageKey = 'balloon-design-projects-v1';
const balloonSizeCosts = { 5: .55, 9: .88, 11: 1.15, 16: 2.40 };
const { slugify, balloonLabel } = window.BalloonCalculations;
const checklistDefaults = [
  'Conferir medidas do local e pontos de fixação',
  'Separar balões por cor, tamanho e lote',
  'Testar infladores, extensões e ferramentas',
  'Conferir estruturas, bases, nylon e fitas',
  'Fotografar o projeto antes da entrega',
  'Planejar desmontagem e retirada dos materiais'
];

const paletteDefaults = [
  { name: 'Lavanda', hex: '#8b5cf6' }, { name: 'Rosa chiclete', hex: '#f472b6' },
  { name: 'Pêssego', hex: '#fbad8f' }, { name: 'Manteiga', hex: '#f8da72' },
  { name: 'Menta', hex: '#62d8b0' }, { name: 'Azul céu', hex: '#75bff4' },
];
let state = { id: crypto.randomUUID(), name: 'Novo projeto', shape: 'panel_duplet', cols: 12, rows: 8, palette: paletteDefaults, selected: '#8b5cf6', selectedSize: 9, cells: [], balloonSizes: [], checklist: [], zoom: 1, rotation: -12 };
let tool = 'pencil';
let undoStack = [], redoStack = [];

function blankCells(cols = state.cols, rows = state.rows) { return Array.from({ length: cols * rows }, () => null); }
function blankSizes(cols = state.cols, rows = state.rows) { return Array.from({ length: cols * rows }, () => null); }
function normalizeShape(shape = state.shape) { return ({ panel: 'panel_duplet', cylinder: 'duplet_alternating', garland: 'organic', creative_panel: 'panel_alternating' })[shape] || shape; }
function safeHex(value, fallback = null) { return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value).toLowerCase() : fallback; }
function ensureCells() {
  state.shape = normalizeShape();
  if (!['panel_duplet','panel_alternating','duplet_alternating','column','arch','disc','organic'].includes(state.shape)) state.shape='panel_duplet';
  state.cols=Math.max(1,Math.min(100,Math.round(Number(state.cols)||12)));
  state.rows=Math.max(1,Math.min(100,Math.round(Number(state.rows)||8)));
  state.palette=(Array.isArray(state.palette)?state.palette:[]).slice(0,30).map((color,index)=>({name:String(color?.name||`Cor ${index+1}`).slice(0,40),hex:safeHex(color?.hex)})).filter(color=>color.hex);
  if (!state.palette.length) state.palette=structuredClone(paletteDefaults);
  state.selected=safeHex(state.selected,state.palette[0].hex);
  if (!Array.isArray(state.cells) || state.cells.length !== state.cols * state.rows) state.cells = blankCells();
  else state.cells=state.cells.map(value=>safeHex(value));
  if (!Array.isArray(state.balloonSizes) || state.balloonSizes.length !== state.cols * state.rows) {
    state.balloonSizes = Array.from({ length: state.cols * state.rows }, (_, index) => state.cells[index] ? 9 : null);
  }
  state.selectedSize = Number(state.selectedSize) || 9;
}
function ensureChecklist() {
  if (!Array.isArray(state.checklist) || !state.checklist.length) {
    state.checklist = checklistDefaults.map((label, index) => ({ id: `item-${index + 1}`, label, done: false }));
  }
}
function shapeLabel(shape = state.shape) {
  return ({ panel: 'Painel Duplet', panel_duplet: 'Painel Duplet', panel_alternating: 'Painel Alternado', cylinder: 'Duplet Alternado', duplet_alternating: 'Duplet Alternado', arch: 'Arco', column: 'Coluna', disc: 'Disco', organic: 'Orgânico', garland: 'Orgânico', creative_panel: 'Painel Alternado' })[shape] || 'Projeto';
}
function snapshot() { return JSON.stringify({ cells: state.cells, balloonSizes: state.balloonSizes, palette: state.palette, selected: state.selected, selectedSize: state.selectedSize, shape: state.shape, cols: state.cols, rows: state.rows }); }
function restore(snapshotValue) { const next = JSON.parse(snapshotValue); Object.assign(state, next); renderAll(); }
function commit() { undoStack.push(snapshot()); if (undoStack.length > 80) undoStack.shift(); redoStack = []; updateHistoryButtons(); }
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); updateHistoryButtons(); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); updateHistoryButtons(); }
function updateHistoryButtons() { $('#undo').disabled = !undoStack.length; $('#redo').disabled = !redoStack.length; }
function shapeVisible(col, row) {
  if (['panel_duplet', 'panel_alternating', 'duplet_alternating'].includes(state.shape)) return true;
  if (state.shape === 'column') return col > Math.floor(state.cols * .25) && col < Math.ceil(state.cols * .75);
  if (state.shape === 'disc') {
    const x = (col + .5) / state.cols * 2 - 1, y = (row + .5) / state.rows * 2 - 1;
    return x * x + y * y <= .94;
  }
  if (state.shape === 'organic') {
    const progress = state.cols <= 1 ? 0 : col / (state.cols - 1);
    const center = state.rows * (.72 - progress * .40 + Math.sin(progress * Math.PI * 2) * .08);
    return Math.abs(row - center) <= Math.max(1.4, state.rows * .16);
  }
  const x = (col + .5) / state.cols * 2 - 1, y = (row + .4) / state.rows;
  return x * x + Math.pow(y - 1.03, 2) < 1.06 && y > .07;
}
function drawBalloon(c, x, y, r, color, ghost = false) {
  c.save(); c.globalAlpha = ghost ? .20 : 1;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = color || '#ded9e8'; c.fill();
  c.lineWidth = Math.max(1, r * .06); c.strokeStyle = '#fff9'; c.stroke();
  if (!ghost) { c.beginPath(); c.ellipse(x - r*.28, y-r*.3, r*.16, r*.26, -.6, 0, Math.PI*2); c.fillStyle='#fff6'; c.fill(); }
  c.restore();
}
function renderCanvas(target = canvas, guide = false) {
  const c = target.getContext('2d'); const width = target.width, height = target.height;
  c.clearRect(0, 0, width, height); c.fillStyle = guide ? '#faf9fd' : '#f7f5fb'; c.fillRect(0, 0, width, height);
  ensureCells(); const margin = guide ? 55 : 68;
  const size = Math.min((width - margin * 2) / state.cols, (height - margin * 2) / state.rows);
  const startX = (width - size * state.cols) / 2 + size / 2, startY = (height - size * state.rows) / 2 + size / 2;
  for (let row=0; row<state.rows; row++) for (let col=0; col<state.cols; col++) {
    if (!shapeVisible(col,row)) continue;
    const index=row*state.cols+col;
    const sizeScale = Math.max(.58, Math.min(1.22, Number(state.balloonSizes[index] || state.selectedSize || 9) / 9));
    const alternatingScale = state.shape === 'panel_alternating' || state.shape === 'duplet_alternating' ? ((row + col) % 3 === 0 ? 1.14 : .78) : 1;
    const organicScale = state.shape === 'organic' ? [.72, 1, 1.28, .86][(row * 3 + col) % 4] : 1;
    const cylinderDepth = state.shape === 'duplet_alternating' ? .76 + Math.sin((col + .5) / state.cols * Math.PI) * .24 : 1;
    const rowOffset = state.shape === 'panel_duplet' && row % 2 ? size * .28 : 0;
    drawBalloon(c, startX+col*size+rowOffset, startY+row*size, size*.40*sizeScale*alternatingScale*organicScale*cylinderDepth, state.cells[index], !state.cells[index]);
  }
  if (!guide) { c.fillStyle='#776f8d'; c.font='600 15px DM Sans'; c.fillText(`${state.cols} × ${state.rows} · ${shapeLabel()}`, 32, height-26); }
}
function renderPalette() { $('#palette').innerHTML = state.palette.map(c => `<button class="color-swatch ${c.hex===state.selected?'active':''}" data-color="${c.hex}" title="${escapeHtml(c.name)}"><i style="background:${c.hex}"></i></button>`).join(''); }
function renderPreview() {
  const preview = $('#preview-object');
  if (!preview) return;
  preview.innerHTML=''; preview.style.transform=`translateX(-50%) rotateY(${state.rotation}deg)`;
  const colors = state.cells.filter(Boolean); const source = colors.length ? colors : state.palette.map(x=>x.hex);
  const positions = state.shape === 'column' ? Array.from({length:24},(_,i)=>[43+(i%3)*24,90-Math.floor(i/3)*12]) : state.shape === 'arch' ? Array.from({length:23},(_,i)=>[10+(i%8)*14,82-Math.sin((i%8)/7*Math.PI)*55-Math.floor(i/8)*12]) : Array.from({length:24},(_,i)=>[12+(i%6)*17,90-Math.floor(i/6)*18]);
  positions.forEach(([x,y],i)=>{ const ball=document.createElement('i'); ball.className='mini-balloon'; ball.style.cssText=`left:${x}px;bottom:${y}px;background:${source[i%source.length]}`; preview.append(ball); });
}
function colorName(hex) { return state.palette.find(c=>c.hex===hex)?.name || hex.toUpperCase(); }
function materialCounts() {
  const result = {};
  state.cells.forEach((hex, index) => {
    if (!hex) return;
    const size = Number(state.balloonSizes[index] || 9);
    const key = `${hex}|${size}`;
    result[key] ||= { hex, size, quantity: 0 };
    result[key].quantity += 1;
  });
  return Object.values(result).sort((a, b) => a.size - b.size || colorName(a.hex).localeCompare(colorName(b.hex)));
}
function renderMaterials() {
  const entries = materialCounts(); const count=state.cells.filter(Boolean).length;
  const materialCost = entries.reduce((sum, item) => sum + item.quantity * (balloonSizeCosts[item.size] || .88), 0);
  $('#balloon-count').textContent=balloonLabel(count); $('#material-total').textContent=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(materialCost);
  const markup = entries.length ? entries.map(item=>`<div class="material-row"><i style="background:${item.hex}"></i><span>${colorName(item.hex)} · ${item.size}&quot;</span><small>${item.quantity} un.</small></div>`).join('') : '<p class="muted small">Pinte alguns balões para gerar a lista.</p>';
  $('#material-list').innerHTML=markup; $('#guide-materials').innerHTML=entries.length ? markup+`<div class="estimate-total"><span>Total</span><strong>${balloonLabel(count)}</strong></div>` : markup;
  $('#guide-project-name').textContent=state.name; $('#guide-shape').textContent=`${shapeLabel()} de balões · ${state.cols} × ${state.rows}`;
}
function renderChecklist() {
  ensureChecklist();
  const completed = state.checklist.filter(item => item.done).length;
  $('#checklist-progress').textContent = `${completed}/${state.checklist.length}`;
  $('#guide-checklist').innerHTML = state.checklist.map(item => `<label class="checklist-row ${item.done ? 'done' : ''}"><input type="checkbox" data-checklist-id="${item.id}" ${item.done ? 'checked' : ''} /><span>${escapeHtml(item.label)}</span></label>`).join('');
}
function renderAll() { ensureCells(); ensureChecklist(); $('#project-title').textContent=state.name; $('#project-breadcrumb').textContent=state.name; $('#project-subtitle').textContent=`${shapeLabel()} de balões · ${state.cols} × ${state.rows}`; $('#shape-select').value=state.shape; const gridValue=`${state.cols}x${state.rows}`; $('#grid-select').value=[...$('#grid-select').options].some(option=>option.value===gridValue)?gridValue:'custom'; $('#balloon-size').value=String(state.selectedSize); canvas.style.transform='none'; canvas.style.maxWidth='none'; canvas.style.maxHeight='none'; canvas.style.width=`${Math.round(state.zoom*94)}%`; canvas.style.height='auto'; $('#zoom-value').textContent=`${Math.round(state.zoom*100)}%`; renderCanvas(); renderCanvas(guideCanvas,true); renderPalette(); renderPreview(); renderMaterials(); renderChecklist(); updateCanvasAccessibility(); persistDraft(); }
function persistDraft(){ localStorage.setItem('balloon-design-draft',JSON.stringify(state)); }
function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2500); }
function canvasPosition(event) { const r=canvas.getBoundingClientRect(); return { x:(event.clientX-r.left)/r.width*canvas.width, y:(event.clientY-r.top)/r.height*canvas.height }; }
function cellAt(event){ const {x,y}=canvasPosition(event), margin=68, size=Math.min((canvas.width-margin*2)/state.cols,(canvas.height-margin*2)/state.rows), startX=(canvas.width-size*state.cols)/2, startY=(canvas.height-size*state.rows)/2; const col=Math.floor((x-startX)/size),row=Math.floor((y-startY)/size); return col<0||row<0||col>=state.cols||row>=state.rows||!shapeVisible(col,row)?null:row*state.cols+col; }
function flood(index, replacement){ const origin=state.cells[index]; const queue=[index], seen=new Set(); while(queue.length){ const i=queue.pop(); if(seen.has(i)||state.cells[i]!==origin)continue; seen.add(i); state.cells[i]=replacement; state.balloonSizes[i]=replacement ? state.selectedSize : null; const row=Math.floor(i/state.cols),col=i%state.cols; [[row-1,col],[row+1,col],[row,col-1],[row,col+1]].forEach(([r,c])=>{if(r>=0&&c>=0&&r<state.rows&&c<state.cols&&shapeVisible(c,r))queue.push(r*state.cols+c)}); } }
function applyToolAt(event){const index=cellAt(event);if(index===null)return false;if(tool==='fill')flood(index,state.selected);else{state.cells[index]=tool==='eraser'?null:state.selected;state.balloonSizes[index]=tool==='eraser'?null:state.selectedSize;}return true;}
let drawing=false, drawingChanged=false;
let panStart=null;
let keyboardIndex=0;
function firstVisibleIndex() {
  for (let row=0;row<state.rows;row++) for (let col=0;col<state.cols;col++) if (shapeVisible(col,row)) return row*state.cols+col;
  return 0;
}
function updateCanvasAccessibility() {
  if (keyboardIndex >= state.cells.length || !shapeVisible(keyboardIndex%state.cols,Math.floor(keyboardIndex/state.cols))) keyboardIndex=firstVisibleIndex();
  const row=Math.floor(keyboardIndex/state.cols),col=keyboardIndex%state.cols;
  const content=state.cells[keyboardIndex] ? `${colorName(state.cells[keyboardIndex])}, ${state.balloonSizes[keyboardIndex] || 9} polegadas` : 'vazio';
  canvas.setAttribute('aria-label',`Grade de balões editável. Célula ${col+1} de ${state.cols}, linha ${row+1} de ${state.rows}: ${content}. Use as setas para navegar e Enter para aplicar a ferramenta.`);
}
function moveKeyboardCell(rowDelta,colDelta) {
  let row=Math.floor(keyboardIndex/state.cols),col=keyboardIndex%state.cols;
  for (let attempt=0;attempt<state.cells.length;attempt++) {
    row=Math.max(0,Math.min(state.rows-1,row+rowDelta)); col=Math.max(0,Math.min(state.cols-1,col+colDelta));
    if (shapeVisible(col,row)) { keyboardIndex=row*state.cols+col; updateCanvasAccessibility(); return; }
    if ((rowDelta<0&&row===0)||(rowDelta>0&&row===state.rows-1)||(colDelta<0&&col===0)||(colDelta>0&&col===state.cols-1)) return;
  }
}
canvas.addEventListener('keydown',event=>{
  const moves={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
  if (moves[event.key]) { event.preventDefault(); moveKeyboardCell(...moves[event.key]); return; }
  if (!['Enter',' ','Delete','Backspace'].includes(event.key)) return;
  event.preventDefault(); commit();
  if (event.key==='Delete'||event.key==='Backspace') { state.cells[keyboardIndex]=null; state.balloonSizes[keyboardIndex]=null; }
  else if (tool==='fill') flood(keyboardIndex,state.selected);
  else if (tool!=='pan') { state.cells[keyboardIndex]=tool==='eraser'?null:state.selected; state.balloonSizes[keyboardIndex]=tool==='eraser'?null:state.selectedSize; }
  renderAll();
});
canvas.addEventListener('pointerdown',event=>{
  if(tool==='pan'){panStart={x:event.clientX,y:event.clientY,left:$('#canvas-wrap').scrollLeft,top:$('#canvas-wrap').scrollTop};canvas.setPointerCapture(event.pointerId);return;}
  if(tool==='fill'){commit();if(applyToolAt(event))renderAll();return;}
  drawing=true;drawingChanged=false;canvas.setPointerCapture(event.pointerId);commit();if(applyToolAt(event)){drawingChanged=true;renderCanvas();}
});
canvas.addEventListener('pointermove',event=>{
  if(tool==='pan'&&panStart){$('#canvas-wrap').scrollLeft=panStart.left-(event.clientX-panStart.x);$('#canvas-wrap').scrollTop=panStart.top-(event.clientY-panStart.y);return;}
  if(!drawing||tool==='fill')return;if(applyToolAt(event)){drawingChanged=true;renderCanvas();}
});
function finishDrawing(){panStart=null;if(!drawing)return;drawing=false;if(drawingChanged)renderAll();}
canvas.addEventListener('pointerup',finishDrawing);
canvas.addEventListener('pointercancel',finishDrawing);
$$('.tool[data-tool]').forEach(button=>button.addEventListener('click',()=>{tool=button.dataset.tool;$$('.tool[data-tool]').forEach(x=>x.classList.toggle('active',x===button));$('#canvas-hint').textContent=tool==='fill'?'Clique para preencher uma área':tool==='eraser'?'Clique em um balão para apagar':tool==='pan'?'Arraste para mover a área de trabalho':'Clique em um balão para pintar';canvas.style.cursor=tool==='pan'?'grab':'crosshair';}));
$('#undo').onclick=undo;$('#redo').onclick=redo;$('#zoom-in').onclick=()=>{state.zoom=Math.min(2.5,state.zoom+.1);renderAll()};$('#zoom-out').onclick=()=>{state.zoom=Math.max(.35,state.zoom-.1);renderAll()};
$('#palette').addEventListener('click',event=>{const button=event.target.closest('[data-color]');if(button){state.selected=button.dataset.color;renderAll()}});
$('#add-color').onclick=()=>$('#color-picker').click();$('#color-picker').onchange=(event)=>{const hex=event.target.value;if(!state.palette.some(c=>c.hex===hex))state.palette.push({name:'Cor personalizada',hex});state.selected=hex;renderAll()};
$('#balloon-size').onchange=event=>{state.selectedSize=Number(event.target.value);persistDraft();toast(`Pincel ajustado para balões de ${state.selectedSize} polegadas.`);};
function mirrorDesign(axis) {
  commit();
  const nextCells=blankCells(), nextSizes=blankSizes();
  for(let row=0;row<state.rows;row++)for(let col=0;col<state.cols;col++){
    const source=row*state.cols+col;
    const targetRow=axis==='vertical'?state.rows-1-row:row;
    const targetCol=axis==='horizontal'?state.cols-1-col:col;
    const target=targetRow*state.cols+targetCol;
    nextCells[target]=state.cells[source];
    nextSizes[target]=state.balloonSizes[source];
  }
  state.cells=nextCells;state.balloonSizes=nextSizes;renderAll();toast('Design espelhado.');
}
$('#mirror-horizontal').onclick=()=>mirrorDesign('horizontal');
$('#mirror-vertical').onclick=()=>mirrorDesign('vertical');
$('#import-image').onclick=()=>$('#image-input').click();
$('#image-input').onchange=event=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{commit();const sample=document.createElement('canvas');sample.width=state.cols;sample.height=state.rows;const sampleCtx=sample.getContext('2d',{willReadFrequently:true});sampleCtx.drawImage(image,0,0,state.cols,state.rows);const pixels=sampleCtx.getImageData(0,0,state.cols,state.rows).data;for(let row=0;row<state.rows;row++)for(let col=0;col<state.cols;col++){if(!shapeVisible(col,row))continue;const index=row*state.cols+col;const pos=index*4;const [r,g,b,a]=pixels.slice(pos,pos+4);if(a<45){state.cells[index]=null;state.balloonSizes[index]=null;continue;}let nearest=state.palette[0];let distance=Infinity;state.palette.forEach(color=>{const rgb=color.hex.match(/\w\w/g).map(value=>parseInt(value,16));const value=(r-rgb[0])**2+(g-rgb[1])**2+(b-rgb[2])**2;if(value<distance){distance=value;nearest=color;}});state.cells[index]=nearest.hex;state.balloonSizes[index]=state.selectedSize;}renderAll();toast('Imagem convertida para a paleta do projeto.');};image.src=reader.result;};reader.readAsDataURL(file);event.target.value='';};
$('#rotation').oninput=e=>{state.rotation=e.target.value;renderPreview();persistDraft()};
$('#shape-select').onchange=e=>{commit();state.shape=e.target.value;renderAll()};
$('#grid-select').onchange=e=>{
  let value=e.target.value;
  if(value==='custom'){
    const cols=Number(prompt('Quantidade de colunas (1 a 100):',state.cols));
    const rows=Number(prompt('Quantidade de linhas (1 a 100):',state.rows));
    if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<1||cols>100||rows<1||rows>100){renderAll();toast('Use valores inteiros entre 1 e 100.');return;}
    value=`${cols}x${rows}`;
  }
  commit();const [cols,rows]=value.split('x').map(Number);state.cols=cols;state.rows=rows;state.cells=blankCells();state.balloonSizes=blankSizes();renderAll();toast('Grade atualizada — o desenho foi reiniciado.');
};
function projectStore(){try{return JSON.parse(localStorage.getItem(storageKey))||[]}catch{return[]}}
function saveProject(){const projects=projectStore().filter(p=>p.id!==state.id);projects.unshift({...state,updatedAt:Date.now()});localStorage.setItem(storageKey,JSON.stringify(projects));persistDraft();toast('Projeto salvo com sucesso.');renderProjectList();}
$('#save-project').onclick=saveProject;
function miniProject(canvasEl,project){const backup=state;state=project;renderCanvas(canvasEl,true);state=backup;}
function filteredProjects(){
  const search=($('#project-search')?.value||'').trim().toLocaleLowerCase('pt-BR');
  const type=$('#project-type-filter')?.value||'';
  const sort=$('#project-sort')?.value||'updated-desc';
  const projects=projectStore().filter(project=>(!search||project.name.toLocaleLowerCase('pt-BR').includes(search))&&(!type||normalizeShape(project.shape)===type));
  projects.sort(sort==='name'?(a,b)=>a.name.localeCompare(b.name,'pt-BR'):sort==='updated-asc'?(a,b)=>(a.updatedAt||0)-(b.updatedAt||0):(a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  return projects;
}
function renderProjectList(){const projects=filteredProjects();if($('#project-results'))$('#project-results').textContent=`${projects.length} ${projects.length===1?'projeto':'projetos'}`;$('#project-list').innerHTML=projects.length?projects.map(p=>`<article class="project-card"><div class="project-thumb"><canvas width="300" height="170" data-id="${p.id}"></canvas></div><div class="project-card-body"><h3>${escapeHtml(p.name)}</h3><p>${shapeLabel(p.shape)} · ${p.cols} × ${p.rows} · ${balloonLabel(p.cells.filter(Boolean).length)}</p><div class="project-card-actions"><button data-open="${p.id}">Abrir</button><button data-duplicate="${p.id}">Duplicar</button><button data-export="${p.id}">Exportar</button><button class="danger-action" data-delete="${p.id}">Excluir</button></div></div></article>`).join(''):'<div class="empty-state"><b>Nenhum projeto encontrado</b><p>Ajuste os filtros ou crie um projeto novo.</p></div>';projects.forEach(p=>{const el=$(`#project-list canvas[data-id="${p.id}"]`);if(el)miniProject(el,p)});}
function escapeHtml(value){return value.replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
$('#project-list').onclick=e=>{const id=e.target.dataset.open||e.target.dataset.duplicate||e.target.dataset.export||e.target.dataset.delete;if(!id)return;const project=projectStore().find(p=>p.id===id);if(!project)return;if(e.target.dataset.duplicate){state={...structuredClone(project),id:crypto.randomUUID(),name:`Cópia de ${project.name}`};void saveProject();}else if(e.target.dataset.export){const link=document.createElement('a');link.download=`${slugify(project.name)}.balloondesign.json`;link.href=URL.createObjectURL(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));link.click();URL.revokeObjectURL(link.href);toast('Arquivo do projeto exportado.');}else if(e.target.dataset.delete){if(!confirm(`Excluir “${project.name}”? Esta ação remove o projeto salvo.`))return;localStorage.setItem(storageKey,JSON.stringify(projectStore().filter(item=>item.id!==id)));window.dispatchEvent(new CustomEvent('balloon-project-delete',{detail:{id}}));renderProjectList();toast('Projeto excluído.');}else{state=structuredClone(project);undoStack=[];redoStack=[];renderAll();activateView('studio');} };
['#project-search','#project-type-filter','#project-sort'].forEach(selector=>$(selector)?.addEventListener('input',renderProjectList));
function activateView(view){$$('.nav-link').forEach(x=>x.classList.toggle('active',x.dataset.view===view));$$('.view').forEach(x=>x.classList.toggle('active',x.id===`${view}-view`));if(view==='guide')renderAll();if(view==='projects')renderProjectList();$('.sidebar').classList.remove('open');}
$$('.nav-link').forEach(button=>button.onclick=()=>activateView(button.dataset.view));
const dialog=$('#project-dialog');function openDialog(){ $('#new-project-name').value=''; dialog.showModal(); }$('#new-project').onclick=openDialog;$('#new-project-alt').onclick=openDialog;dialog.querySelector('.dialog-close').addEventListener('click',event=>{event.preventDefault();dialog.close();});
$('#project-form').addEventListener('submit',event=>{event.preventDefault();const name=$('#new-project-name').value.trim();if(!name)return;const shape=document.querySelector('input[name="new-shape"]:checked').value;const defaults=({column:[8,16],arch:[16,10],disc:[12,12],organic:[20,12]})[shape]||[12,8];state={id:crypto.randomUUID(),name,shape,cols:defaults[0],rows:defaults[1],palette:structuredClone(paletteDefaults),selected:'#8b5cf6',selectedSize:9,cells:blankCells(defaults[0],defaults[1]),balloonSizes:blankSizes(defaults[0],defaults[1]),checklist:checklistDefaults.map((label,index)=>({id:`item-${index+1}`,label,done:false})),zoom:1,rotation:-12};undoStack=[];redoStack=[];dialog.close();renderAll();activateView('studio');toast('Projeto criado. Escolha uma cor e um tamanho para começar.');});
$('#export-png').onclick=()=>{renderCanvas(guideCanvas,true);const link=document.createElement('a');link.download=`${slugify(state.name,'design')}.png`;link.href=guideCanvas.toDataURL('image/png');link.click();toast('Imagem do guia baixada.');};
$('#export-csv').onclick=()=>{const rows=[['Cor','Código','Tamanho (pol.)','Quantidade'],...materialCounts().map(item=>[colorName(item.hex),item.hex,item.size,item.quantity])];const csv='\uFEFF'+rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(';')).join('\n');const link=document.createElement('a');link.download=`lista-de-compras-${slugify(state.name)}.csv`;link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));link.click();URL.revokeObjectURL(link.href);toast('Lista de compras em CSV baixada.');};
$('#print-guide').onclick=()=>window.print();
$('#mobile-menu').onclick=()=>$('.sidebar').classList.toggle('open');
$('#guide-checklist').addEventListener('change',event=>{const id=event.target.dataset.checklistId;if(!id)return;ensureChecklist();const item=state.checklist.find(entry=>entry.id===id);if(item){item.done=event.target.checked;renderChecklist();persistDraft();}});
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo()}});
try{const saved=JSON.parse(localStorage.getItem('balloon-design-draft'));if(saved)state={...state,...saved};}catch{}ensureCells();renderAll();renderProjectList();updateHistoryButtons();
