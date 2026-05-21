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
        .packet-node {
          width: 75px;
          font-family: monospace;
          font-size: 11px;
          color: var(--_secondary-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .packet-type {
          flex: 1;
          font-size: 12px;
          font-weight: 500;
        }
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
        #packet-list {
          max-height: 350px;
          overflow-y: auto;
          border: 1px solid var(--_divider);
          border-radius: 6px;
        }
        #packet-list.no-scroll {
          max-height: none;
          overflow-y: visible;
        }
        .empty {
          color: var(--_secondary-text);
          font-size: 13px;
          padding: 8px;
        }
      </style>
      <div class="card">
        <div class="header">
          <div class="title">
            <img
              src="data:image/png;base64,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"
              style="width:24px;height:24px;vertical-align:middle;margin-right:6px;border-radius:4px;"
              onerror="this.style.display='none'"
            />
            LoRemote
          </div>
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
        <span class="packet-node">!${(p.node||'').replace('!','')}</span>
        <span class="packet-type">${p.ptype || '—'}</span>
        <span class="packet-size">${p.size != null ? p.size + 'B' : '—'}</span>
        <span>${statusIcon}</span>
      </div>`;
      if (this._expanded === i) {
        const json = p.payload_json || '';
        const hex = p.payload_hex || '';
        const jsonObj = (() => { try { return typeof json === 'string' ? JSON.parse(json) : json; } catch { return null; } })();
        html += `<div class="packet-detail">
          <div class="detail-tags">
            <span class="detail-tag tag-dir">${dir}</span>
            <span class="detail-tag tag-status-${status}">${status}</span>
            <span class="detail-tag">${p.size != null ? p.size + 'B' : '—'}</span>
            <span class="detail-tag">hop=${p.hop != null ? p.hop : '—'}</span>
            <span class="detail-tag">rssi=${p.rssi != null ? p.rssi : '—'}</span>
            <span class="detail-tag">snr=${p.snr != null ? p.snr : '—'}</span>
          </div>
          ${jsonObj && jsonObj.text ? `<div style="padding:6px 8px;background:var(--_card-bg);border-radius:4px;font-size:13px;margin-bottom:6px;">💬 "${jsonObj.text}"</div>` : ''}
          ${json ? '<div class="json-block">' + this._highlightJson(json) + '</div>' : ''}
          ${hex ? '<div class="hex-block">' + hex + '</div>' : ''}
        </div>`;
      }
    });
    el.innerHTML = html;
    if (data.length > 10) {
      el.classList.remove('no-scroll');
    } else {
      el.classList.add('no-scroll');
    }
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
