// ============================================================
//  FLY WAY DELIVERY — Google Apps Script Backend v4.0
//  Método: JSONP via doGet (única forma sem erros CORS externos)
// ============================================================

const SHEETS = {
  PEDIDOS:  'Pedidos',
  CLIENTES: 'Clientes',
  MOTOBOYS: 'Motoboys'
};

const CREDENTIALS = {
  admin:      { username: 'admin',      password: 'flyway@2025', role: 'Administrador' },
  assistente: { username: 'assistente', password: 'assist@123',  role: 'Assistente'    }
};

// ── ÚNICO PONTO DE ENTRADA ───────────────────────────────────
// Tudo via GET + JSONP para contornar CORS do Apps Script.
function doGet(e) {
  const p        = e.parameter || {};
  const action   = p.action   || '';
  const callback = p.callback || '';

  let result;
  try {
    result = routeAction(action, p);
  } catch (err) {
    result = { success: false, message: err.message };
  }

  const json = JSON.stringify(result);

  if (callback) {
    // Resposta JSONP — funciona cross-origin sem restrições CORS
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  // Resposta JSON simples (para testes directos no browser)
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

// ── ROUTER ───────────────────────────────────────────────────
function routeAction(action, p) {
  // Parâmetros complexos chegam como JSON em p.data
  let data = {};
  if (p.data) {
    try { data = JSON.parse(decodeURIComponent(p.data)); } catch(_) {}
  }
  const params = Object.assign({}, p, data);

  switch (action) {
    case 'login':               return login(params.username, params.password);
    case 'getPedidos':          return getPedidos();
    case 'addPedido':           return addPedido(params);
    case 'updatePedidoStatus':  return updatePedidoStatus(+params.rowIndex, params.status, params.motoboy);
    case 'deletePedido':        return deletePedido(+params.rowIndex);
    case 'getClientes':         return getClientes();
    case 'getMotoboys':         return getMotoboys();
    case 'addMotoboy':          return addMotoboy(params);
    case 'updateMotoboyStatus': return updateMotoboyStatus(+params.rowIndex, params.status);
    case 'deleteMotoboy':       return deleteMotoboy(+params.rowIndex);
    case 'getDashboardData':    return getDashboardData();
    case 'getRelatorio':        return getRelatorio(params);
    default: return { success: false, message: 'Acção inválida: ' + action };
  }
}

// ── UTILITÁRIOS ──────────────────────────────────────────────
function getSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Aba "' + name + '" não encontrada. Execute "Inicializar Planilhas".');
  return sheet;
}
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function formatDateTime(d) {
  if (!d) d = new Date();
  return pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes());
}
function generateId() {
  const d = new Date();
  return 'PED-'+pad(d.getDate())+pad(d.getMonth()+1)+String(d.getFullYear()).slice(-2)+pad(d.getHours())+pad(d.getMinutes())+pad(d.getSeconds());
}
function generatePin() { return String(Math.floor(100000 + Math.random() * 900000)); }
function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map((row, idx) => {
    const obj = { _row: idx + 2 };
    headers.forEach((h, i) => { obj[String(h)] = row[i]; });
    return obj;
  }).filter(r => r[String(headers[0])] !== '' && r[String(headers[0])] !== null);
}

// ── AUTH ─────────────────────────────────────────────────────
function login(username, password) {
  for (const k in CREDENTIALS) {
    const c = CREDENTIALS[k];
    if (c.username === username && c.password === password)
      return { success: true, role: c.role, username: c.username };
  }
  return { success: false, message: 'Credenciais inválidas.' };
}

// ── PEDIDOS ──────────────────────────────────────────────────
function getPedidos() {
  try { return { success: true, data: sheetToObjects(getSheet(SHEETS.PEDIDOS)) }; }
  catch(e) { return { success: false, message: e.message }; }
}
function addPedido(p) {
  try {
    const id = generateId(), pin = generatePin(), dt = formatDateTime(new Date());
    getSheet(SHEETS.PEDIDOS).appendRow([id, dt, p.cliente, p.contacto, p.localizacao,
      p.tipo, pin, p.valorTaxa, 'Pendente', p.motoboy||'', p.observacoes||'']);
    upsertCliente(p.cliente, p.contacto);
    return { success: true, id, pin, data: dt };
  } catch(e) { return { success: false, message: e.message }; }
}
function updatePedidoStatus(rowIndex, status, motoboy) {
  try {
    const s = getSheet(SHEETS.PEDIDOS);
    s.getRange(rowIndex, 9).setValue(status);
    if (motoboy !== undefined) s.getRange(rowIndex, 10).setValue(motoboy);
    return { success: true };
  } catch(e) { return { success: false, message: e.message }; }
}
function deletePedido(rowIndex) {
  try { getSheet(SHEETS.PEDIDOS).deleteRow(rowIndex); return { success: true }; }
  catch(e) { return { success: false, message: e.message }; }
}

// ── CLIENTES ─────────────────────────────────────────────────
function getClientes() {
  try { return { success: true, data: sheetToObjects(getSheet(SHEETS.CLIENTES)) }; }
  catch(e) { return { success: false, message: e.message }; }
}
function upsertCliente(nome, contacto) {
  try {
    const s = getSheet(SHEETS.CLIENTES);
    const d = s.getDataRange().getValues();
    for (let i = 1; i < d.length; i++) {
      if (d[i][0] === nome) { s.getRange(i+1,2).setValue(contacto); return; }
    }
    s.appendRow([nome, contacto]);
  } catch(_) {}
}

// ── MOTOBOYS ─────────────────────────────────────────────────
function getMotoboys() {
  try { return { success: true, data: sheetToObjects(getSheet(SHEETS.MOTOBOYS)) }; }
  catch(e) { return { success: false, message: e.message }; }
}
function addMotoboy(p) {
  try { getSheet(SHEETS.MOTOBOYS).appendRow([p.nome, p.contacto, 'Disponível']); return { success: true }; }
  catch(e) { return { success: false, message: e.message }; }
}
function updateMotoboyStatus(rowIndex, status) {
  try { getSheet(SHEETS.MOTOBOYS).getRange(rowIndex, 3).setValue(status); return { success: true }; }
  catch(e) { return { success: false, message: e.message }; }
}
function deleteMotoboy(rowIndex) {
  try { getSheet(SHEETS.MOTOBOYS).deleteRow(rowIndex); return { success: true }; }
  catch(e) { return { success: false, message: e.message }; }
}

// ── DASHBOARD ────────────────────────────────────────────────
function getDashboardData() {
  try {
    const pedidos  = sheetToObjects(getSheet(SHEETS.PEDIDOS));
    const motoboys = sheetToObjects(getSheet(SHEETS.MOTOBOYS));
    const clientes = sheetToObjects(getSheet(SHEETS.CLIENTES));
    const hoje = formatDateTime(new Date()).split(' ')[0];
    const tipos = {};
    pedidos.forEach(p => { const t = p['Tipo']||'Outro'; tipos[t]=(tipos[t]||0)+1; });
    return {
      success: true,
      totalPedidos:     pedidos.length,
      pedidosHoje:      pedidos.filter(p=>String(p['Data ou Hora']).startsWith(hoje)).length,
      pedidosPendentes: pedidos.filter(p=>p['Status']==='Pendente').length,
      pedidosEmRota:    pedidos.filter(p=>p['Status']==='Em Rota').length,
      pedidosEntregues: pedidos.filter(p=>p['Status']==='Entregue').length,
      receita:          pedidos.filter(p=>p['Status']==='Entregue').reduce((s,p)=>s+(+p['Valor Taxa']||0),0),
      totalClientes:    clientes.length,
      totalMotoboys:    motoboys.length,
      motoboyDisp:      motoboys.filter(m=>m['Status']==='Disponível').length,
      motoboyOcup:      motoboys.filter(m=>m['Status']==='Ocupado').length,
      tipos,
      recentes:         pedidos.slice(-5).reverse()
    };
  } catch(e) { return { success: false, message: e.message }; }
}

// ── RELATÓRIO ────────────────────────────────────────────────
function getRelatorio(params) {
  try {
    let pedidos = sheetToObjects(getSheet(SHEETS.PEDIDOS));
    if (params.status && params.status !== 'Todos')
      pedidos = pedidos.filter(p=>p['Status']===params.status);
    if (params.tipo && params.tipo !== 'Todos')
      pedidos = pedidos.filter(p=>p['Tipo']===params.tipo);
    const totalReceita = pedidos.filter(p=>p['Status']==='Entregue')
      .reduce((s,p)=>s+(+p['Valor Taxa']||0),0);
    return { success: true, data: pedidos, totalReceita };
  } catch(e) { return { success: false, message: e.message }; }
}

// ── SETUP ────────────────────────────────────────────────────
function inicializarPlanilhas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    [
      { nome:'Pedidos',  cols:['ID','Data ou Hora','Cliente','Contacto','Localização','Tipo','PIN','Valor Taxa','Status','Motoboy','Observações'] },
      { nome:'Clientes', cols:['Nome','Contacto'] },
      { nome:'Motoboys', cols:['Nome','Contacto','Status'] }
    ].forEach(({nome, cols}) => {
      let sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
      if (sh.getLastRow() === 0) sh.appendRow(cols);
      sh.getRange(1,1,1,cols.length).setBackground('#1E3A8A').setFontColor('#fff').setFontWeight('bold');
      sh.setFrozenRows(1);
    });
    return { success: true, message: 'Planilhas inicializadas!' };
  } catch(e) { return { success: false, message: e.message }; }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Fly Way Delivery')
    .addItem('Inicializar Planilhas', 'inicializarPlanilhas')
    .addItem('Ver URL da Web App', 'mostrarUrl')
    .addToUi();
}
function mostrarUrl() {
  SpreadsheetApp.getUi().alert('URL da Web App',
    'Cole este URL no config.js do GitHub:\n\n' + ScriptApp.getService().getUrl(),
    SpreadsheetApp.getUi().ButtonSet.OK);
}
