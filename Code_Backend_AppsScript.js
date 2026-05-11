// ============================================================
//  FLY WAY DELIVERY — Google Apps Script Backend
//  Versão: 2.0  (compatível com GitHub Pages via fetch/CORS)
// ============================================================

// ── CONFIGURAÇÕES ────────────────────────────────────────────
const SHEETS = {
  PEDIDOS:  'Pedidos',
  CLIENTES: 'Clientes',
  MOTOBOYS: 'Motoboys'
};

// Credenciais — altere conforme necessário
const CREDENTIALS = {
  admin:      { username: 'admin',      password: 'flyway@2025', role: 'Administrador' },
  assistente: { username: 'assistente', password: 'assist@123',  role: 'Assistente'    }
};

// ── PONTO DE ENTRADA: GET (serve o HTML se acedido directo) ──
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action) {
    // Chamada de API via GET (fallback)
    return buildResponse(routeAction(action, e.parameter));
  }
  // Sem action → devolve página informativa
  return HtmlService.createHtmlOutput(
    '<h2>Fly Way Delivery API</h2><p>Backend activo. Aceda pelo frontend no GitHub Pages.</p>'
  ).setTitle('Fly Way Delivery API');
}

// ── PONTO DE ENTRADA: POST (chamadas fetch do frontend) ──────
function doPost(e) {
  try {
    let body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    const action = body.action || (e.parameter && e.parameter.action) || '';
    return buildResponse(routeAction(action, body));
  } catch (err) {
    return buildResponse({ success: false, message: err.message });
  }
}

// ── CONSTRUIR RESPOSTA COM CABEÇALHOS CORS ───────────────────
function buildResponse(data) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ── ROUTER ───────────────────────────────────────────────────
function routeAction(action, params) {
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
    default:                    return { success: false, message: 'Acção inválida: ' + action };
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
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear()
    + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function generateId() {
  const d = new Date();
  return 'PED-' + pad(d.getDate()) + pad(d.getMonth()+1) + String(d.getFullYear()).slice(-2)
       + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map((row, idx) => {
    const obj = { _row: idx + 2 };
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  }).filter(r => r[headers[0]] && r[headers[0]] !== '');
}

// ── AUTENTICAÇÃO ─────────────────────────────────────────────
function login(username, password) {
  try {
    for (const key in CREDENTIALS) {
      const c = CREDENTIALS[key];
      if (c.username === username && c.password === password) {
        return { success: true, role: c.role, username: c.username };
      }
    }
    return { success: false, message: 'Credenciais inválidas.' };
  } catch (e) { return { success: false, message: e.message }; }
}

// ── PEDIDOS ──────────────────────────────────────────────────
function getPedidos() {
  try {
    return { success: true, data: sheetToObjects(getSheet(SHEETS.PEDIDOS)) };
  } catch (e) { return { success: false, message: e.message }; }
}

function addPedido(p) {
  try {
    const sheet = getSheet(SHEETS.PEDIDOS);
    const id  = generateId();
    const pin = generatePin();
    const dt  = formatDateTime(new Date());
    sheet.appendRow([id, dt, p.cliente, p.contacto, p.localizacao, p.tipo,
                     pin, p.valorTaxa, 'Pendente', p.motoboy || '', p.observacoes || '']);
    upsertCliente(p.cliente, p.contacto);
    return { success: true, id, pin, data: dt };
  } catch (e) { return { success: false, message: e.message }; }
}

function updatePedidoStatus(rowIndex, status, motoboy) {
  try {
    const sheet = getSheet(SHEETS.PEDIDOS);
    sheet.getRange(rowIndex, 9).setValue(status);
    if (motoboy !== undefined) sheet.getRange(rowIndex, 10).setValue(motoboy);
    return { success: true };
  } catch (e) { return { success: false, message: e.message }; }
}

function deletePedido(rowIndex) {
  try { getSheet(SHEETS.PEDIDOS).deleteRow(rowIndex); return { success: true }; }
  catch (e) { return { success: false, message: e.message }; }
}

// ── CLIENTES ─────────────────────────────────────────────────
function getClientes() {
  try {
    return { success: true, data: sheetToObjects(getSheet(SHEETS.CLIENTES)) };
  } catch (e) { return { success: false, message: e.message }; }
}

function upsertCliente(nome, contacto) {
  try {
    const sheet = getSheet(SHEETS.CLIENTES);
    const data  = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === nome) { sheet.getRange(i + 1, 2).setValue(contacto); return; }
    }
    sheet.appendRow([nome, contacto]);
  } catch (_) {}
}

function deleteCliente(rowIndex) {
  try { getSheet(SHEETS.CLIENTES).deleteRow(rowIndex); return { success: true }; }
  catch (e) { return { success: false, message: e.message }; }
}

// ── MOTOBOYS ─────────────────────────────────────────────────
function getMotoboys() {
  try {
    return { success: true, data: sheetToObjects(getSheet(SHEETS.MOTOBOYS)) };
  } catch (e) { return { success: false, message: e.message }; }
}

function addMotoboy(p) {
  try {
    getSheet(SHEETS.MOTOBOYS).appendRow([p.nome, p.contacto, 'Disponível']);
    return { success: true };
  } catch (e) { return { success: false, message: e.message }; }
}

function updateMotoboyStatus(rowIndex, status) {
  try {
    getSheet(SHEETS.MOTOBOYS).getRange(rowIndex, 3).setValue(status);
    return { success: true };
  } catch (e) { return { success: false, message: e.message }; }
}

function deleteMotoboy(rowIndex) {
  try { getSheet(SHEETS.MOTOBOYS).deleteRow(rowIndex); return { success: true }; }
  catch (e) { return { success: false, message: e.message }; }
}

// ── DASHBOARD ────────────────────────────────────────────────
function getDashboardData() {
  try {
    const pedidos  = sheetToObjects(getSheet(SHEETS.PEDIDOS));
    const motoboys = sheetToObjects(getSheet(SHEETS.MOTOBOYS));
    const clientes = sheetToObjects(getSheet(SHEETS.CLIENTES));

    const hoje = formatDateTime(new Date()).split(' ')[0];
    const tipos = {};
    pedidos.forEach(p => { const t = p['Tipo'] || 'Outro'; tipos[t] = (tipos[t] || 0) + 1; });

    return {
      success: true,
      totalPedidos:      pedidos.length,
      pedidosHoje:       pedidos.filter(p => String(p['Data ou Hora']).startsWith(hoje)).length,
      pedidosPendentes:  pedidos.filter(p => p['Status'] === 'Pendente').length,
      pedidosEmRota:     pedidos.filter(p => p['Status'] === 'Em Rota').length,
      pedidosEntregues:  pedidos.filter(p => p['Status'] === 'Entregue').length,
      receita:           pedidos.filter(p => p['Status'] === 'Entregue').reduce((s, p) => s + (+p['Valor Taxa'] || 0), 0),
      totalClientes:     clientes.length,
      totalMotoboys:     motoboys.length,
      motoboyDisp:       motoboys.filter(m => m['Status'] === 'Disponível').length,
      motoboyOcup:       motoboys.filter(m => m['Status'] === 'Ocupado').length,
      tipos,
      recentes:          pedidos.slice(-5).reverse()
    };
  } catch (e) { return { success: false, message: e.message }; }
}

// ── RELATÓRIO ────────────────────────────────────────────────
function getRelatorio(filtros) {
  try {
    let pedidos = sheetToObjects(getSheet(SHEETS.PEDIDOS));
    if (filtros) {
      if (filtros.status && filtros.status !== 'Todos')
        pedidos = pedidos.filter(p => p['Status'] === filtros.status);
      if (filtros.tipo && filtros.tipo !== 'Todos')
        pedidos = pedidos.filter(p => p['Tipo'] === filtros.tipo);
      // Filtro de data simples por prefixo dd/mm/yyyy
      if (filtros.dataInicio) {
        const [ay, am, ad] = filtros.dataInicio.split('-').map(Number);
        pedidos = pedidos.filter(p => {
          const parts = String(p['Data ou Hora']).split('/');
          if (parts.length < 3) return true;
          const pd = +parts[0], pm = +parts[1], py = +parts[2].split(' ')[0];
          return (py > ay) || (py === ay && pm > am) || (py === ay && pm === am && pd >= ad);
        });
      }
      if (filtros.dataFim) {
        const [by, bm, bd] = filtros.dataFim.split('-').map(Number);
        pedidos = pedidos.filter(p => {
          const parts = String(p['Data ou Hora']).split('/');
          if (parts.length < 3) return true;
          const pd = +parts[0], pm = +parts[1], py = +parts[2].split(' ')[0];
          return (py < by) || (py === by && pm < bm) || (py === by && pm === bm && pd <= bd);
        });
      }
    }
    const totalReceita = pedidos.filter(p => p['Status'] === 'Entregue')
      .reduce((s, p) => s + (+p['Valor Taxa'] || 0), 0);
    return { success: true, data: pedidos, totalReceita };
  } catch (e) { return { success: false, message: e.message }; }
}

// ── INICIALIZAÇÃO DAS ABAS ───────────────────────────────────
function inicializarPlanilhas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abas = [
      { nome: SHEETS.PEDIDOS,  cabecalhos: ['ID','Data ou Hora','Cliente','Contacto','Localização','Tipo','PIN','Valor Taxa','Status','Motoboy','Observações'] },
      { nome: SHEETS.CLIENTES, cabecalhos: ['Nome','Contacto'] },
      { nome: SHEETS.MOTOBOYS, cabecalhos: ['Nome','Contacto','Status'] }
    ];
    abas.forEach(({ nome, cabecalhos }) => {
      let sheet = ss.getSheetByName(nome);
      if (!sheet) sheet = ss.insertSheet(nome);
      if (sheet.getLastRow() === 0) sheet.appendRow(cabecalhos);
      const r = sheet.getRange(1, 1, 1, cabecalhos.length);
      r.setBackground('#1E3A8A').setFontColor('#FFFFFF').setFontWeight('bold');
      sheet.setFrozenRows(1);
    });
    return { success: true, message: 'Planilhas iniciadas com sucesso!' };
  } catch (e) { return { success: false, message: e.message }; }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Fly Way Delivery')
    .addItem('Inicializar Planilhas', 'inicializarPlanilhas')
    .addItem('Ver URL da Web App', 'mostrarUrl')
    .addToUi();
}

function mostrarUrl() {
  const url = ScriptApp.getService().getUrl();
  SpreadsheetApp.getUi().alert(
    'URL da Web App',
    'Cole este URL no ficheiro config.js do GitHub:\n\n' + url,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
