// ============================================================
//  FLY WAY DELIVERY — Google Apps Script Backend
//  Versão: 1.0
// ============================================================

// ── CONFIGURAÇÕES GLOBAIS ────────────────────────────────────
const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

const SHEETS = {
  PEDIDOS:   'Pedidos',
  CLIENTES:  'Clientes',
  MOTOBOYS:  'Motoboys',
  CONFIG:    'Config'
};

// Credenciais (altere conforme necessário)
const CREDENTIALS = {
  admin: {
    username: 'admin',
    password: 'flyway@2025',
    role: 'Administrador'
  },
  assistente: {
    username: 'assistente',
    password: 'assist@123',
    role: 'Assistente'
  }
};

// ── PONTO DE ENTRADA WEB APP ─────────────────────────────────
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Fly Way Delivery — Sistema de Gestão')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// ── AUTENTICAÇÃO ─────────────────────────────────────────────
function login(username, password) {
  try {
    for (const key in CREDENTIALS) {
      const cred = CREDENTIALS[key];
      if (cred.username === username && cred.password === password) {
        return { success: true, role: cred.role, username: cred.username };
      }
    }
    return { success: false, message: 'Credenciais inválidas.' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── UTILITÁRIOS DE PLANILHA ──────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Aba "' + name + '" não encontrada.');
  return sheet;
}

function generateId(prefix) {
  const now = new Date();
  const ts  = now.getFullYear().toString().slice(-2)
    + pad(now.getMonth() + 1)
    + pad(now.getDate())
    + pad(now.getHours())
    + pad(now.getMinutes())
    + pad(now.getSeconds());
  return prefix + '-' + ts;
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatDateTime(date) {
  if (!date) date = new Date();
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
}

// ── PEDIDOS ──────────────────────────────────────────────────

function getPedidos() {
  try {
    const sheet = getSheet(SHEETS.PEDIDOS);
    const data  = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    const headers = data[0];
    const rows    = data.slice(1).map((row, idx) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      obj._row = idx + 2;
      return obj;
    }).filter(r => r['ID'] && r['ID'] !== '');

    return { success: true, data: rows };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function addPedido(pedido) {
  try {
    const sheet = getSheet(SHEETS.PEDIDOS);
    const id    = generateId('PED');
    const pin   = generatePin();
    const dt    = formatDateTime(new Date());

    const row = [
      id,
      dt,
      pedido.cliente,
      pedido.contacto,
      pedido.localizacao,
      pedido.tipo,
      pin,
      pedido.valorTaxa,
      'Pendente',
      pedido.motoboy || '',
      pedido.observacoes || ''
    ];

    sheet.appendRow(row);

    // Actualizar ou adicionar cliente
    upsertCliente(pedido.cliente, pedido.contacto);

    return { success: true, id: id, pin: pin, data: dt };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function updatePedidoStatus(rowIndex, status, motoboy) {
  try {
    const sheet = getSheet(SHEETS.PEDIDOS);
    sheet.getRange(rowIndex, 9).setValue(status);
    if (motoboy !== undefined) {
      sheet.getRange(rowIndex, 10).setValue(motoboy);
    }
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deletePedido(rowIndex) {
  try {
    const sheet = getSheet(SHEETS.PEDIDOS);
    sheet.deleteRow(rowIndex);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── CLIENTES ─────────────────────────────────────────────────

function getClientes() {
  try {
    const sheet = getSheet(SHEETS.CLIENTES);
    const data  = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    const headers = data[0];
    const rows = data.slice(1).map((row, idx) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      obj._row = idx + 2;
      return obj;
    }).filter(r => r['Nome'] && r['Nome'] !== '');

    return { success: true, data: rows };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function upsertCliente(nome, contacto) {
  try {
    const sheet = getSheet(SHEETS.CLIENTES);
    const data  = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === nome) {
        sheet.getRange(i + 1, 2).setValue(contacto);
        return { success: true, action: 'updated' };
      }
    }
    sheet.appendRow([nome, contacto]);
    return { success: true, action: 'created' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteCliente(rowIndex) {
  try {
    const sheet = getSheet(SHEETS.CLIENTES);
    sheet.deleteRow(rowIndex);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── MOTOBOYS ─────────────────────────────────────────────────

function getMotoboys() {
  try {
    const sheet = getSheet(SHEETS.MOTOBOYS);
    const data  = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };

    const headers = data[0];
    const rows = data.slice(1).map((row, idx) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      obj._row = idx + 2;
      return obj;
    }).filter(r => r['Nome'] && r['Nome'] !== '');

    return { success: true, data: rows };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function addMotoboy(motoboy) {
  try {
    const sheet = getSheet(SHEETS.MOTOBOYS);
    sheet.appendRow([motoboy.nome, motoboy.contacto, 'Disponível']);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function updateMotoboyStatus(rowIndex, status) {
  try {
    const sheet = getSheet(SHEETS.MOTOBOYS);
    sheet.getRange(rowIndex, 3).setValue(status);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function deleteMotoboy(rowIndex) {
  try {
    const sheet = getSheet(SHEETS.MOTOBOYS);
    sheet.deleteRow(rowIndex);
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── DASHBOARD / RELATÓRIOS ───────────────────────────────────

function getDashboardData() {
  try {
    const pedidosRes  = getPedidos();
    const motoboyRes  = getMotoboys();
    const clientesRes = getClientes();

    const pedidos  = pedidosRes.data  || [];
    const motoboys = motoboyRes.data  || [];
    const clientes = clientesRes.data || [];

    const hoje = new Date();
    const hojeStr = Utilities.formatDate(hoje, Session.getScriptTimeZone(), 'dd/MM/yyyy');

    const totalPedidos    = pedidos.length;
    const pedidosHoje     = pedidos.filter(p => String(p['Data ou Hora']).startsWith(hojeStr)).length;
    const pedidosPendentes = pedidos.filter(p => p['Status'] === 'Pendente').length;
    const pedidosEntregues = pedidos.filter(p => p['Status'] === 'Entregue').length;
    const pedidosEmRota    = pedidos.filter(p => p['Status'] === 'Em Rota').length;

    const receita = pedidos
      .filter(p => p['Status'] === 'Entregue')
      .reduce((sum, p) => sum + (parseFloat(p['Valor Taxa']) || 0), 0);

    const receitaHoje = pedidos
      .filter(p => p['Status'] === 'Entregue' && String(p['Data ou Hora']).startsWith(hojeStr))
      .reduce((sum, p) => sum + (parseFloat(p['Valor Taxa']) || 0), 0);

    const motoboyDisp = motoboys.filter(m => m['Status'] === 'Disponível').length;
    const motoboyOcup = motoboys.filter(m => m['Status'] === 'Ocupado').length;

    // Pedidos por tipo
    const tipos = {};
    pedidos.forEach(p => {
      const t = p['Tipo'] || 'Outro';
      tipos[t] = (tipos[t] || 0) + 1;
    });

    // Últimos 5 pedidos
    const recentes = pedidos.slice(-5).reverse();

    return {
      success: true,
      totalPedidos,
      pedidosHoje,
      pedidosPendentes,
      pedidosEntregues,
      pedidosEmRota,
      receita,
      receitaHoje,
      totalClientes: clientes.length,
      totalMotoboys: motoboys.length,
      motoboyDisp,
      motoboyOcup,
      tipos,
      recentes
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function getRelatorio(filtros) {
  try {
    const pedidosRes = getPedidos();
    let pedidos = pedidosRes.data || [];

    if (filtros) {
      if (filtros.dataInicio) {
        pedidos = pedidos.filter(p => {
          const dt = String(p['Data ou Hora']).split(' ')[0];
          return dt >= filtros.dataInicio;
        });
      }
      if (filtros.dataFim) {
        pedidos = pedidos.filter(p => {
          const dt = String(p['Data ou Hora']).split(' ')[0];
          return dt <= filtros.dataFim;
        });
      }
      if (filtros.status && filtros.status !== 'Todos') {
        pedidos = pedidos.filter(p => p['Status'] === filtros.status);
      }
      if (filtros.tipo && filtros.tipo !== 'Todos') {
        pedidos = pedidos.filter(p => p['Tipo'] === filtros.tipo);
      }
    }

    const totalReceita = pedidos
      .filter(p => p['Status'] === 'Entregue')
      .reduce((sum, p) => sum + (parseFloat(p['Valor Taxa']) || 0), 0);

    return { success: true, data: pedidos, totalReceita };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── INICIALIZAÇÃO DAS ABAS ───────────────────────────────────

function inicializarPlanilhas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Pedidos
    let ped = ss.getSheetByName(SHEETS.PEDIDOS);
    if (!ped) {
      ped = ss.insertSheet(SHEETS.PEDIDOS);
      ped.appendRow(['ID','Data ou Hora','Cliente','Contacto','Localização','Tipo','PIN','Valor Taxa','Status','Motoboy','Observações']);
      formatarCabecalho(ped);
    }

    // Clientes
    let cli = ss.getSheetByName(SHEETS.CLIENTES);
    if (!cli) {
      cli = ss.insertSheet(SHEETS.CLIENTES);
      cli.appendRow(['Nome','Contacto']);
      formatarCabecalho(cli);
    }

    // Motoboys
    let mot = ss.getSheetByName(SHEETS.MOTOBOYS);
    if (!mot) {
      mot = ss.insertSheet(SHEETS.MOTOBOYS);
      mot.appendRow(['Nome','Contacto','Status']);
      formatarCabecalho(mot);
    }

    return { success: true, message: 'Planilhas inicializadas com sucesso!' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function formatarCabecalho(sheet) {
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1);
  range.setBackground('#1E3A8A');
  range.setFontColor('#FFFFFF');
  range.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

// Menu na planilha para acesso rápido
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 Fly Way Delivery')
    .addItem('Inicializar Planilhas', 'inicializarPlanilhas')
    .addItem('Abrir Sistema', 'abrirSistema')
    .addToUi();
}

function abrirSistema() {
  const url = ScriptApp.getService().getUrl();
  const html = HtmlService.createHtmlOutput(
    '<script>window.open("' + url + '", "_blank"); google.script.host.close();</script>'
  ).setWidth(100).setHeight(50);
  SpreadsheetApp.getUi().showModalDialog(html, 'Abrindo sistema...');
}
