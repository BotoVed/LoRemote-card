class LoRemoteCard extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
    this._data = {};
    this._filter = 'all';
    this._expanded = null;
    this._status = 'offline';
  }

  setConfig(config) {
    this._config = config;
    if (this._hass) {
      this._collect();
    }
    this._render();
  }

  getCardSize() { return 1; }

  static getConfigElement() { return document.createElement('loremote-card'); }

  set hass(hass) {
    this._hass = hass;
    this._collect();
    this._render();
  }

  _collect() {
    const s = (id) => {
      const sensor = this._hass?.states[id];
      if (sensor && sensor.state !== 'unknown' && sensor.state !== 'unavailable') {
        return sensor.state;
      }
      return null;
    };
    const attrs = (id) => {
      const sensor = this._hass?.states[id];
      return sensor?.attributes || {};
    };

    this._data.status = s('sensor.loremote_status') || 'offline';
    this._data.status = this._data.status.toLowerCase();
    this._data.nodeId = s('sensor.loremote_node_id') || '—';
    this._data.devices = s('sensor.loremote_devices_count') || '0';
    this._data.uptime = s('sensor.loremote_uptime_24h') || '0';
    this._data.connHistory = attrs('sensor.loremote_conn_history')?.data || [];
    this._data.packetLog = attrs('sensor.loremote_packet_log')?.data || [];
    this._data.sessions = attrs('sensor.loremote_sessions')?.data || [];
  }

  _render() {
    this._shadow.innerHTML = `
      <style>
        :host { display: block; }
        .card {
          --_primary: ${this._hass?.themes?.darkMode ? '#e8edf0' : '#222'};
          --_secondary: ${this._hass?.themes?.darkMode ? '#9ca3b0' : '#6c7482'};
          --_bg: var(--card-background-color, #fff);
          --_divider: var(--divider-color, #e8e8e8);
          --_primary-color: var(--primary-color, #1565c0);
          --_success: var(--success-color, #43a047);
          --_error: var(--error-color, #e53935);
          --_warning: var(--warning-color, #f9a825);
          --_text: var(--primary-text-color, #212121);
          --_secondary-text: var(--secondary-text-color, #757575);
          --_card-bg: var(--card-background-color, #fff);
        }
        .card {
          font-family: 'Roboto', 'Segoe UI', sans-serif;
          padding: 16px;
          background: var(--_card-bg);
          border-radius: 12px;
          color: var(--_text);
          line-height: 1.4;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .title {
          font-size: 18px;
          font-weight: 500;
        }
        .badge {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }
        .badge.online { background: var(--_success); color: #fff; }
        .badge.offline { background: var(--_error); color: #fff; }
        .metrics {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          font-size: 13px;
          color: var(--_secondary-text);
        }
        .metric { display: flex; align-items: center; gap: 4px; }
        .metric-value { font-weight: 500; color: var(--_text); }
        .section-title {
          font-size: 13px;
          font-weight: 500;
          margin: 16px 0 8px;
          color: var(--_secondary-text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .uptime-bar {
          display: flex;
          gap: 2px;
          margin-bottom: 16px;
        }
        .uptime-seg {
          flex: 1;
          height: 16px;
          border-radius: 2px;
        }
        .uptime-seg.online { background: var(--_success); }
        .uptime-seg.offline { background: var(--_error); }
        .filters {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .filter-btn {
          padding: 4px 12px;
          border: 1px solid var(--_divider);
          border-radius: 16px;
          background: transparent;
          color: var(--_text);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter-btn:hover { background: var(--_divider); }
        .filter-btn.active {
          background: var(--_primary-color);
          color: #fff;
          border-color: var(--_primary-color);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th {
          text-align: left;
          padding: 6px 8px;
          color: var(--_secondary-text);
          font-weight: 500;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--_divider);
        }
        td {
          padding: 4px 8px;
          border-bottom: 1px solid var(--_divider);
        }
        .status-dot {
          display: inline-block;
          width: 12px;
          text-align: center;
          font-size: 11px;
        }
        .status-dot.ok { color: var(--_success); }
        .status-dot.fail { color: var(--_error); }
        .status-dot.wait { color: var(--_warning); }
        .packet-row {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          border-bottom: 1px solid var(--_divider);
          cursor: pointer;
          font-size: 13px;
        }
        .packet-row:hover { background: var(--_divider); }
        .packet-row.expanded { background: var(--_divider); }
        .packet-dir {
          font-weight: 600;
          width: 24px;
          text-align: center;
        }
        .packet-dir.rx { color: var(--_primary-color); }
        .packet-dir.tx { color: var(--_success); }
        .packet-time { flex: 1; color: var(--_secondary-text); font-size: 11px; margin: 0 8px; }
        .packet-node { width: 50px; font-weight: 500; }
        .packet-type { flex: 1; color: var(--_secondary-text); }
        .packet-size { width: 50px; text-align: right; color: var(--_secondary-text); }
        .packet-detail {
          padding: 8px 12px;
          background: var(--_divider);
          border-radius: 4px;
          margin-top: 4px;
        }
        .detail-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
        .detail-tag {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          background: var(--_card-bg);
        }
        .tag-dir { color: var(--_primary-color); }
        .tag-status-ok { color: var(--_success); }
        .tag-status-fail { color: var(--_error); }
        .tag-status-wait { color: var(--_warning); }
        .json-block {
          font-family: 'Fira Code', monospace;
          font-size: 12px;
          overflow-x: auto;
          white-space: pre;
          margin: 4px 0;
        }
        .json-key { color: var(--_primary-color); }
        .json-string { color: var(--_success); }
        .json-number { color: var(--_warning); }
        .hex-block {
          font-family: 'Fira Code', monospace;
          font-size: 11px;
          color: var(--_secondary-text);
          overflow-x: auto;
          white-space: pre;
        }
        .session-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .session-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 6px;
          font-size: 13px;
        }
        .session-row:nth-child(odd) { background: rgba(0,0,0,0.02); }
        .session-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--_primary-color);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
        }
        .session-name { flex: 1; font-weight: 500; }
        .session-node { color: var(--_secondary-text); font-size: 12px; }
        .session-time { color: var(--_secondary-text); font-size: 11px; }
        .empty {
          color: var(--_secondary-text);
          font-size: 13px;
          padding: 8px;
        }
      </style>
      <div class="card">
        <div class="header">
          <div class="title">LoRemote</div>
          <div class="badge ${this._data.status || 'offline'}">${this._data.status || 'offline'}</div>
        </div>
        <div class="metrics">
          <div class="metric">Node: <span class="metric-value">${this._data.nodeId || '—'}</span></div>
          <div class="metric">Devices: <span class="metric-value">${this._data.devices || '0'}</span></div>
          <div class="metric">Uptime 24h: <span class="metric-value">${this._data.uptime || '0'}%</span></div>
        </div>
        <div class="uptime-bar" id="uptime-bar"></div>
        <div class="section-title">ИСТОРИЯ ПОДКЛЮЧЕНИЙ</div>
        <div id="conn-table"></div>
        <div class="section-title">ФИЛЬТРЫ</div>
        <div class="filters" id="filters"></div>
        <div class="section-title">ЛОГ ПАКЕТОВ</div>
        <div id="packet-list"></div>
        <div class="section-title">СЕССИИ</div>
        <div id="session-list"></div>
      </div>
    `;
    this._renderUptimeBar();
    this._renderConnTable();
    this._renderFilters();
    this._renderPackets();
    this._renderSessions();
  }

  _renderUptimeBar() {
    const bar = this._shadow.getElementById('uptime-bar');
    if (!bar) return;
    const data = this._data.connHistory || [];
    const segments = [];
    const now = Math.floor(Date.now() / 1000);
    // Отсортировать события по ts
    const sorted = [...data].filter(e => e.ts).sort((a, b) => a.ts - b.ts);
    for (let h = 23; h >= 0; h--) {
      const hourEnd = now - h * 3600;
      // Найти последнее событие ДО конца этого часа
      let lastEvent = null;
      for (const e of sorted) {
        if (e.ts < hourEnd) {
          lastEvent = e;
        } else {
          break;
        }
      }
      segments.push(lastEvent ? lastEvent.event.toLowerCase() : 'offline');
    }
    bar.innerHTML = segments.map(s => `<div class="uptime-seg ${s}"></div>`).join('');
  }

  _renderConnTable() {
    const el = this._shadow.getElementById('conn-table');
    if (!el) return;
    const data = this._data.connHistory || [];
    if (!data.length) { el.innerHTML = '<div class="empty">No connection data</div>'; return; }
    let html = '<table><thead><tr><th>Status</th><th>Time</th><th>Duration</th><th>Reason</th></tr></thead><tbody>';
    data.slice(-50).reverse().forEach(d => {
      html += `<tr>
        <td><span class="status-dot ${d.event ? d.event.toLowerCase() : 'offline'}">${d.event || 'offline'}</span></td>
        <td>${d.ts ? new Date(d.ts * 1000).toLocaleTimeString() : '—'}</td>
        <td>${d.duration_sec != null ? d.duration_sec + 'с' : '—'}</td>
        <td>${d.reason || '—'}</td>
      </tr>`;
    });
    html += '</tbody></table>';
    el.innerHTML = html;
  }

  _renderFilters() {
    const el = this._shadow.getElementById('filters');
    if (!el) return;
    const btns = ['all', 'in', 'out', 'undelivered'];
    const labels = { all: 'Все', in: 'Входящие ↓', out: 'Исходящие ↑', undelivered: 'Недоставленные ✗' };
    el.innerHTML = btns.map(b => `<button class="filter-btn ${this._filter === b ? 'active' : ''}" data-filter="${b}">${labels[b]}</button>`).join('');
    el.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._filter = btn.dataset.filter;
        this._render();
      });
    });
  }

  _renderPackets() {
    const el = this._shadow.getElementById('packet-list');
    if (!el) return;
    let data = this._data.packetLog || [];
    const f = this._filter;
    if (f === 'in') data = data.filter(p => p.dir === 'rx');
    else if (f === 'out') data = data.filter(p => p.dir === 'tx');
    else if (f === 'undelivered') data = data.filter(p => p.status === 'fail');

    if (!data.length) { el.innerHTML = '<div class="empty">No packets</div>'; return; }

    const renderStatusIcon = (status) => {
      const s = (status || '').toLowerCase();
      if (s === 'ok') return '<span style="color:var(--_success)">✓</span>';
      if (s === 'fail') return '<span style="color:var(--_error)">✗</span>';
      return '<span style="color:var(--_warning)">⏱</span>';
    };

    let html = '';
    data.forEach((p, i) => {
      const dir = (p.dir || '?');
      const status = p.status || 'wait';
      const expanded = this._expanded === i ? 'expanded' : '';
      const statusIcon = renderStatusIcon(status);
      html += `<div class="packet-row ${expanded}" data-idx="${i}">
        <span class="packet-dir ${dir}">${dir === 'rx' ? '↓' : '↑'}</span>
        <span class="packet-time">${p.ts ? new Date(p.ts * 1000).toLocaleTimeString() : '—'}</span>
        <span class="packet-node">${p.node || '—'}</span>
        <span class="packet-type">${p.ptype || '—'}</span>
        <span class="packet-size">${p.size != null ? p.size + 'B' : '—'}</span>
        <span class="status-dot ${status}">${statusIcon}</span>
      </div>`;
      if (this._expanded === i) {
        const json = p.payload_json || '';
        const hex = p.payload_hex || '';
        html += `<div class="packet-detail">
          <div class="detail-tags">
            <span class="detail-tag tag-dir">${dir}</span>
            <span class="detail-tag tag-status-${status}">${status}</span>
            <span class="detail-tag">${p.size != null ? p.size + 'B' : '—'}</span>
            <span class="detail-tag">hop=${p.hop != null ? p.hop : '—'}</span>
            <span class="detail-tag">rssi=${p.rssi != null ? p.rssi : '—'}</span>
            <span class="detail-tag">snr=${p.snr != null ? p.snr : '—'}</span>
          </div>
          ${json ? '<div class="json-block">' + this._highlightJson(json) + '</div>' : ''}
          ${hex ? '<div class="hex-block">' + hex + '</div>' : ''}
        </div>`;
      }
    });
    el.innerHTML = html;
    el.querySelectorAll('.packet-row').forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.idx);
        this._expanded = this._expanded === idx ? null : idx;
        this._render();
      });
    });
  }

  _highlightJson(obj) {
    try {
      const str = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
      return str.replace(/("(?:[^"\\]|\\.)*")(\s*:)?/g, (m, key, colon) =>
        `<span class="json-key">${key}</span>${colon || ''}`
      ).replace(/:\s*"((?:[^"\\]|\\.)*?)"/g, (m, val) =>
        `: <span class="json-string">"${val}"</span>`
      ).replace(/:\s*(\d+(?:\.\d+)?)/g, (m, val) =>
        `: <span class="json-number">${val}</span>`
      );
    } catch { return String(obj); }
  }

  _renderSessions() {
    const el = this._shadow.getElementById('session-list');
    if (!el) return;
    const data = this._data.sessions || [];
    if (!data.length) { el.innerHTML = '<div class="empty">No sessions</div>'; return; }
    const initials = (name) => {
      return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
    };
    el.innerHTML = `<div class="session-list">${data.map(s => `
      <div class="session-row">
        <div class="session-avatar">${initials(s.user_name)}</div>
        <span class="session-name">${s.user_name || '—'}</span>
        <span class="session-node">${s.node || '—'}</span>
        <span class="session-time">${s.ts ? new Date(s.ts * 1000).toLocaleTimeString() : '—'}</span>
      </div>
    `).join('')}</div>`;
  }

  _getState(id) {
    const sensor = this._hass?.states[id];
    if (sensor && sensor.state !== 'unknown' && sensor.state !== 'unavailable') {
      return sensor;
    }
    return null;
  }
}

customElements.define('loremote-card', LoRemoteCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'loremote-card',
  name: 'LoRemote Card',
  description: 'Monitoring card for LoRemote integration'
});
