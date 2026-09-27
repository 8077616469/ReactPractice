import React, { useState, useEffect } from 'react';
import { Users, Layers, GitBranch, Plus, Trash2, Check, ChevronRight, Trophy, RotateCcw, Shuffle, Copy } from 'lucide-react';

/* ============================== 主題色彩 ============================== */
const COLORS = {
  bg: '#14171C',
  panel: '#1B1F27',
  panelAlt: '#20242D',
  line: '#2B303B',
  text: '#ECEAE3',
  textDim: '#9098A6',
  textFaint: '#5C6270',
  accent: '#D9A63E',
  accentDim: '#8A6A28',
  win: '#5FA776',
  loss: '#C1584B',
};

const FONT_DISPLAY = "'Archivo Narrow', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

/* ============================== 本機儲存（localStorage） ============================== */
const localStore = {
  get(key) {
    try {
      const v = window.localStorage.getItem(key);
      return v === null ? null : { key, value: v };
    } catch (e) { return null; }
  },
  set(key, value) {
    try { window.localStorage.setItem(key, value); return { key, value }; } catch (e) { return null; }
  },
};

/* ============================== 工具函式 ============================== */
const genId = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;

const nextPow2 = (n) => { let p = 1; while (p < n) p *= 2; return p; };

function roundLabel(size) {
  if (size <= 2) return '決賽';
  if (size === 4) return '準決賽';
  if (size === 8) return '8強';
  return `${size}強`;
}

function defaultStageName(format, n) {
  const fmtName = format === 'single' ? '單淘汰' : format === 'swiss' ? '瑞士制' : '循環賽';
  return `${fmtName}（${n} 人）`;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- 單淘汰賽 ---------- */
function buildFirstEliminationRound(participants) {
  const n = participants.length;
  const size = nextPow2(n);
  const byes = size - n;
  const byePlayers = participants.slice(0, byes);
  const rest = participants.slice(byes);
  const matches = [];
  byePlayers.forEach((p) => {
    matches.push({ id: genId('m'), p1: p, p2: null, bye: true, winner: p.id, draw: false, score1: null, score2: null });
  });
  for (let i = 0; i < rest.length / 2; i++) {
    const a = rest[i];
    const b = rest[rest.length - 1 - i];
    matches.push({ id: genId('m'), p1: a, p2: b, bye: false, winner: null, draw: false, score1: null, score2: null });
  }
  return matches;
}

function buildNextEliminationRound(prevMatches) {
  const winners = prevMatches.map((m) => {
    if (m.bye) return m.p1;
    if (!m.winner) return null;
    return m.winner === m.p1.id ? m.p1 : m.p2;
  });
  if (winners.some((w) => w === null)) return null;
  const matches = [];
  for (let i = 0; i < winners.length; i += 2) {
    const a = winners[i];
    const b = winners[i + 1];
    if (b === undefined) {
      matches.push({ id: genId('m'), p1: a, p2: null, bye: true, winner: a.id, draw: false, score1: null, score2: null });
    } else {
      matches.push({ id: genId('m'), p1: a, p2: b, bye: false, winner: null, draw: false, score1: null, score2: null });
    }
  }
  return matches;
}

function computeEliminationRanking(stage) {
  const results = [];
  stage.rounds.forEach((r) => {
    r.matches.forEach((m) => {
      if (m.bye || !m.winner) return;
      const loser = m.winner === m.p1.id ? m.p2 : m.p1;
      if (loser) results.push({ player: loser, size: r.size || m.matches ? r.size : r.matches.length * 2 });
    });
  });
  results.forEach((r) => { if (!r.size) r.size = 999; });
  const lastRound = stage.rounds[stage.rounds.length - 1];
  let champion = null;
  if (lastRound && lastRound.matches.length === 1) {
    const fm = lastRound.matches[0];
    champion = fm.bye ? fm.p1 : (fm.winner === fm.p1.id ? fm.p1 : fm.p2);
  }
  results.sort((a, b) => a.size - b.size);
  const ranking = [];
  if (champion) ranking.push({ rank: 1, player: champion });
  let rank = 2;
  let i = 0;
  while (i < results.length) {
    let j = i;
    while (j < results.length && results[j].size === results[i].size) j++;
    const group = results.slice(i, j);
    group.forEach((g) => ranking.push({ rank, player: g.player }));
    rank += group.length;
    i = j;
  }
  return ranking;
}

/* ---------- 瑞士制 ---------- */
function generateSwissRound(players, prevRounds) {
  const scores = {}, oppo = {}, hadBye = {};
  players.forEach((p) => { scores[p.id] = 0; oppo[p.id] = new Set(); hadBye[p.id] = false; });
  prevRounds.forEach((r) => {
    r.matches.forEach((m) => {
      if (m.bye) { scores[m.p1.id] += 1; hadBye[m.p1.id] = true; return; }
      if (m.draw) { scores[m.p1.id] += 0.5; scores[m.p2.id] += 0.5; }
      else if (m.winner) { scores[m.winner] += 1; }
      oppo[m.p1.id].add(m.p2.id);
      oppo[m.p2.id].add(m.p1.id);
    });
  });
  let pool = [...players].sort((a, b) => (scores[b.id] - scores[a.id]) || (Math.random() - 0.5));
  const used = new Set();
  let byePlayer = null;
  const matches = [];
  if (pool.length % 2 === 1) {
    for (let i = pool.length - 1; i >= 0; i--) {
      if (!hadBye[pool[i].id]) { byePlayer = pool[i]; break; }
    }
    if (!byePlayer) byePlayer = pool[pool.length - 1];
    used.add(byePlayer.id);
  }
  for (let i = 0; i < pool.length; i++) {
    const p1 = pool[i];
    if (used.has(p1.id)) continue;
    let opp = null;
    for (let j = i + 1; j < pool.length; j++) {
      const p2 = pool[j];
      if (used.has(p2.id)) continue;
      if (!oppo[p1.id].has(p2.id)) { opp = p2; break; }
    }
    if (!opp) {
      for (let j = i + 1; j < pool.length; j++) {
        const p2 = pool[j];
        if (!used.has(p2.id)) { opp = p2; break; }
      }
    }
    if (opp) {
      used.add(p1.id); used.add(opp.id);
      matches.push({ id: genId('m'), p1, p2: opp, bye: false, winner: null, draw: false, score1: null, score2: null });
    }
  }
  if (byePlayer) {
    matches.push({ id: genId('m'), p1: byePlayer, p2: null, bye: true, winner: byePlayer.id, draw: false, score1: null, score2: null });
  }
  return matches;
}

/* ---------- 循環賽 ---------- */
function generateRoundRobinRounds(players, doubleRound) {
  let list = [...players];
  if (list.length % 2 === 1) list = [...list, null];
  const n = list.length;
  const roundsCount = n - 1;
  let arr = [...list];
  const rounds = [];
  for (let r = 0; r < roundsCount; r++) {
    const matches = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      if (a && b) matches.push({ id: genId('m'), p1: a, p2: b, bye: false, winner: null, draw: false, score1: null, score2: null });
      else if (a) matches.push({ id: genId('m'), p1: a, p2: null, bye: true, winner: a.id, draw: false, score1: null, score2: null });
      else if (b) matches.push({ id: genId('m'), p1: b, p2: null, bye: true, winner: b.id, draw: false, score1: null, score2: null });
    }
    rounds.push({ id: genId('r'), label: `第 ${r + 1} 輪`, matches });
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }
  if (doubleRound) {
    const leg2 = rounds.map((rnd, idx) => ({
      id: genId('r'),
      label: `第 ${roundsCount + idx + 1} 輪`,
      matches: rnd.matches.map((m) => (
        m.bye
          ? { id: genId('m'), p1: m.p1, p2: null, bye: true, winner: m.p1.id, draw: false, score1: null, score2: null }
          : { id: genId('m'), p1: m.p2, p2: m.p1, bye: false, winner: null, draw: false, score1: null, score2: null }
      )),
    }));
    return [...rounds, ...leg2];
  }
  return rounds;
}

/* ---------- 通用 ---------- */
function computeStandingsFromMatches(players, allMatches) {
  const stat = {};
  players.forEach((p) => { stat[p.id] = { player: p, w: 0, l: 0, d: 0, pts: 0 }; });
  allMatches.forEach((m) => {
    if (m.bye) {
      if (stat[m.p1.id]) { stat[m.p1.id].w += 1; stat[m.p1.id].pts += 1; }
      return;
    }
    if (!m.p2 || (!m.winner && !m.draw)) return;
    if (!stat[m.p1.id] || !stat[m.p2.id]) return;
    if (m.draw) {
      stat[m.p1.id].d += 1; stat[m.p2.id].d += 1;
      stat[m.p1.id].pts += 0.5; stat[m.p2.id].pts += 0.5;
    } else if (m.winner === m.p1.id) {
      stat[m.p1.id].w += 1; stat[m.p1.id].pts += 1; stat[m.p2.id].l += 1;
    } else if (m.winner === m.p2.id) {
      stat[m.p2.id].w += 1; stat[m.p2.id].pts += 1; stat[m.p1.id].l += 1;
    }
  });
  return Object.values(stat).sort((a, b) => b.pts - a.pts || b.w - a.w || a.player.name.localeCompare(b.player.name));
}

function getStageRanking(stage) {
  if (stage.format === 'single') {
    return computeEliminationRanking(stage);
  }
  const allMatches = stage.rounds.reduce((acc, r) => acc.concat(r.matches), []);
  const standings = computeStandingsFromMatches(stage.participants, allMatches);
  return standings.map((s, idx) => ({ rank: idx + 1, player: s.player, w: s.w, l: s.l, d: s.d }));
}

function formatMatchLine(m) {
  const n1 = m.p1.nickname || m.p1.name;
  if (m.bye) return `${n1}（輪空晉級）`;
  const n2 = m.p2.nickname || m.p2.name;
  const hasScore = m.score1 !== null && m.score1 !== undefined && m.score2 !== null && m.score2 !== undefined;
  const s1 = hasScore ? m.score1 : '-';
  const s2 = hasScore ? m.score2 : '-';
  let suffix = '';
  if (m.draw) suffix = '（平手）';
  else if (!hasScore && !m.winner) suffix = '（未完成）';
  return `${n1} : ${n2}   ${s1}:${s2}${suffix}`;
}

function buildStageExportText(stage) {
  const lines = [];
  if (stage.competitionName) lines.push(`比賽名稱：${stage.competitionName}`);
  lines.push(`階段：${stage.name}`);
  lines.push(`匯出時間：${new Date().toLocaleString('zh-TW')}`);
  lines.push('');
  stage.rounds.forEach((round) => {
    lines.push(`【${round.label}】`);
    round.matches.forEach((m) => lines.push(formatMatchLine(m)));
    lines.push('');
  });
  if (stage.status === 'done') {
    lines.push('—— 最終結果 ——');
    if (stage.format === 'single') {
      const champ = stage.participants.find((p) => p.id === stage.championId);
      if (champ) lines.push(`冠軍：${champ.nickname || champ.name}`);
    } else {
      const ranking = getStageRanking(stage);
      ranking.forEach((r) => {
        const record = r.w !== undefined ? `（${r.w}勝 ${r.l}負 ${r.d}和）` : '';
        lines.push(`${r.rank}. ${r.player.nickname || r.player.name} ${record}`);
      });
    }
  }
  return lines.join('\n');
}

function withCompletionCheck(stage, rounds) {
  let status = 'active';
  let championId = null;
  if (stage.format === 'single') {
    const lastRound = rounds[rounds.length - 1];
    const allDone = lastRound.matches.every((m) => m.bye || m.winner);
    if (allDone && lastRound.matches.length === 1) {
      status = 'done';
      const fm = lastRound.matches[0];
      championId = fm.bye ? fm.p1.id : fm.winner;
    }
  } else if (stage.format === 'swiss') {
    const lastRound = rounds[rounds.length - 1];
    const allDone = lastRound.matches.every((m) => m.bye || m.winner || m.draw);
    status = (allDone && rounds.length >= stage.swissRounds) ? 'done' : 'active';
  } else if (stage.format === 'roundrobin') {
    const allDone = rounds.every((r) => r.matches.every((m) => m.bye || m.winner || m.draw));
    status = allDone ? 'done' : 'active';
  }
  return { status, championId };
}

function rebuildEliminationRounds(rounds, editedRoundId) {
  const idx = rounds.findIndex((r) => r.id === editedRoundId);
  if (idx === -1) return rounds;
  let result = rounds.slice(0, idx + 1);
  while (true) {
    const last = result[result.length - 1];
    if (last.matches.length <= 1) break;
    const allDone = last.matches.every((m) => m.bye || m.winner);
    if (!allDone) break;
    const nextMatches = buildNextEliminationRound(last.matches);
    if (!nextMatches) break;
    result.push({ id: genId('r'), label: roundLabel(last.matches.length), size: last.matches.length, matches: nextMatches });
  }
  return result;
}

/* ============================== 基礎元件 ============================== */
const inputBase = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1px solid ${COLORS.line}`, background: COLORS.panelAlt,
  color: COLORS.text, fontSize: 14, outline: 'none', fontFamily: 'inherit',
};

function FieldLabel({ children }) {
  return <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 6 }}>{children}</div>;
}
function TextInput({ value, onChange, placeholder }) {
  return <input style={inputBase} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}
function NumberInput({ value, onChange, min, max }) {
  return <input type="number" style={inputBase} value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)} />;
}
function RadioRow({ checked, onClick, label }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      border: `1px solid ${checked ? COLORS.accent : COLORS.line}`, borderRadius: 8, cursor: 'pointer',
      background: checked ? 'rgba(217,166,62,0.08)' : 'transparent',
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%', border: `2px solid ${checked ? COLORS.accent : COLORS.textFaint}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {checked ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.accent }} /> : null}
      </div>
      <span style={{ fontSize: 13, color: checked ? COLORS.text : COLORS.textDim }}>{label}</span>
    </div>
  );
}
function Button({ children, onClick, variant = 'primary', icon: Icon, disabled }) {
  const styles = {
    primary: { background: disabled ? COLORS.accentDim : COLORS.accent, color: '#14171C', border: 'none' },
    secondary: { background: 'transparent', color: COLORS.text, border: `1px solid ${COLORS.line}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
      ...styles[variant],
    }}>
      {Icon ? <Icon size={15} /> : null}
      {children}
    </button>
  );
}
function EmptyState({ text, hint }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', color: COLORS.textDim }}>
      <div style={{ fontSize: 14, marginBottom: 6 }}>{text}</div>
      {hint ? <div style={{ fontSize: 12, color: COLORS.textFaint }}>{hint}</div> : null}
    </div>
  );
}

/* ============================== 對戰卡片 ============================== */
function PlayerSlot({ player, isWinner, isBye, editable, onClick, showScore, score, onScoreChange }) {
  return (
    <div
      onClick={editable && player ? onClick : undefined}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px',
        background: isWinner ? 'rgba(217,166,62,0.12)' : 'transparent',
        borderLeft: isWinner ? `3px solid ${COLORS.accent}` : '3px solid transparent',
        cursor: editable && player ? 'pointer' : 'default',
        opacity: isBye ? 0.4 : 1,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{
          fontSize: 14, fontWeight: isWinner ? 600 : 500,
          color: isWinner ? COLORS.accent : COLORS.text,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {player ? (player.nickname || player.name) : 'BYE'}
        </span>
        {player && player.nickname ? (
          <span style={{ fontSize: 11, color: COLORS.textFaint }}>{player.name}</span>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {showScore ? (
          editable ? (
            <input
              type="number"
              value={score === null || score === undefined ? '' : score}
              placeholder="-"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onScoreChange(e.target.value)}
              style={{
                width: 42, padding: '4px 6px', borderRadius: 6, textAlign: 'center',
                border: `1px solid ${COLORS.line}`, background: COLORS.panelAlt,
                color: COLORS.text, fontSize: 13, fontFamily: FONT_MONO, outline: 'none',
              }}
            />
          ) : (
            <span style={{ width: 24, textAlign: 'center', fontSize: 13, fontFamily: FONT_MONO, color: COLORS.textDim }}>
              {score === null || score === undefined ? '—' : score}
            </span>
          )
        ) : null}
        {isWinner ? <Check size={15} color={COLORS.accent} /> : null}
      </div>
    </div>
  );
}

function MatchCard({ match, editable, onSetWinner, onSetDraw, onSetScore, showDraw, fullWidth }) {
  const p1Winner = !match.bye && match.winner === match.p1.id;
  const p2Winner = !match.bye && match.p2 && match.winner === match.p2.id;
  return (
    <div style={{
      background: COLORS.panel,
      border: `1px solid ${COLORS.line}`,
      borderRadius: 8,
      overflow: 'hidden',
      width: fullWidth ? '100%' : 220,
      flexShrink: 0,
    }}>
      <PlayerSlot player={match.p1} isWinner={match.bye || p1Winner} isBye={false}
        editable={editable && !match.bye} onClick={() => onSetWinner(match.id, match.p1.id)}
        showScore={!match.bye} score={match.score1} onScoreChange={(v) => onSetScore(match.id, 'score1', v)} />
      <div style={{ height: 1, background: COLORS.line }} />
      <PlayerSlot player={match.p2} isWinner={p2Winner} isBye={match.bye}
        editable={editable && !match.bye} onClick={() => match.p2 && onSetWinner(match.id, match.p2.id)}
        showScore={!match.bye} score={match.score2} onScoreChange={(v) => onSetScore(match.id, 'score2', v)} />
      {showDraw && !match.bye && match.p2 && editable ? (
        <button onClick={() => onSetDraw(match.id)} style={{
          width: '100%', padding: '6px', fontSize: 11, color: match.draw ? COLORS.accent : COLORS.textDim,
          background: 'transparent', border: 'none', borderTop: `1px solid ${COLORS.line}`, cursor: 'pointer',
        }}>
          {match.draw ? '✓ 平手' : '標記平手'}
        </button>
      ) : null}
    </div>
  );
}

function StandingsTable({ ranking }) {
  return (
    <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', padding: '8px 12px', background: COLORS.panelAlt, fontSize: 11, color: COLORS.textDim }}>
        <span style={{ width: 28 }}>#</span>
        <span style={{ flex: 1 }}>選手</span>
        <span style={{ width: 70, textAlign: 'right', fontFamily: FONT_MONO }}>勝-負-和</span>
      </div>
      {ranking.map((r) => (
        <div key={r.player.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderTop: `1px solid ${COLORS.line}` }}>
          <span style={{ width: 28, fontFamily: FONT_MONO, color: r.rank <= 3 ? COLORS.accent : COLORS.textDim, fontWeight: 600 }}>{r.rank}</span>
          <span style={{ flex: 1, fontSize: 14 }}>{r.player.nickname || r.player.name}</span>
          <span style={{ width: 70, textAlign: 'right', fontSize: 12, fontFamily: FONT_MONO, color: COLORS.textDim }}>
            {r.w !== undefined ? `${r.w}-${r.l}-${r.d}` : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ============================== 賽程檢視 ============================== */
function EliminationView({ stage, onSetWinner, onSetScore }) {
  const baseHeight = stage.rounds[0].matches.length * 76;
  return (
    <div>
      <div style={{ fontSize: 11, color: COLORS.textFaint, marginBottom: 10 }}>
        任何一輪的比分／獲勝方都可以隨時修改，修改後系統會自動重新計算後續輪次。
      </div>
      <div style={{ display: 'flex', gap: 28, overflowX: 'auto', paddingBottom: 12 }}>
        {stage.rounds.map((round) => (
          <div key={round.id} style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: COLORS.textDim, marginBottom: 10 }}>
              {round.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', height: baseHeight }}>
              {round.matches.map((m) => (
                <MatchCard key={m.id} match={m} editable
                  onSetWinner={(matchId, winnerId) => onSetWinner(stage.id, round.id, matchId, winnerId)}
                  onSetScore={(matchId, side, value) => onSetScore(stage.id, round.id, matchId, side, value)}
                  onSetDraw={() => {}} showDraw={false} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {stage.status === 'done' && stage.championId ? (
        <div style={{ marginTop: 20, padding: 16, border: `1px solid ${COLORS.accent}`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(217,166,62,0.08)' }}>
          <Trophy size={22} color={COLORS.accent} />
          <div>
            <div style={{ fontSize: 11, color: COLORS.textDim }}>冠軍</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.accent }}>
              {(() => {
                const champ = stage.participants.find((p) => p.id === stage.championId);
                return champ ? (champ.nickname || champ.name) : '';
              })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SwissView({ stage, onSetWinner, onSetDraw, onSetScore, onNextRound }) {
  const lastRound = stage.rounds[stage.rounds.length - 1];
  const roundComplete = lastRound.matches.every((m) => m.bye || m.winner || m.draw);
  const canAdvance = roundComplete && stage.rounds.length < stage.swissRounds && stage.status !== 'done';
  const allMatches = stage.rounds.reduce((acc, r) => acc.concat(r.matches), []);
  const ranking = computeStandingsFromMatches(stage.participants, allMatches).map((s, idx) => ({ rank: idx + 1, player: s.player, w: s.w, l: s.l, d: s.d }));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14, color: COLORS.textDim }}>
          {lastRound.label}（共 {stage.swissRounds} 輪）
        </div>
        {canAdvance ? <Button variant="primary" onClick={() => onNextRound(stage.id)}>產生下一輪</Button> : null}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {lastRound.matches.map((m) => (
          <MatchCard key={m.id} match={m} editable={stage.status !== 'done'} fullWidth showDraw
            onSetWinner={(matchId, winnerId) => onSetWinner(stage.id, lastRound.id, matchId, winnerId)}
            onSetScore={(matchId, side, value) => onSetScore(stage.id, lastRound.id, matchId, side, value)}
            onSetDraw={(matchId) => onSetDraw(stage.id, lastRound.id, matchId)} />
        ))}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>排名</div>
      <StandingsTable ranking={ranking} />
    </div>
  );
}

function RoundRobinView({ stage, onSetWinner, onSetDraw, onSetScore }) {
  const allMatches = stage.rounds.reduce((acc, r) => acc.concat(r.matches), []);
  const ranking = computeStandingsFromMatches(stage.participants, allMatches).map((s, idx) => ({ rank: idx + 1, player: s.player, w: s.w, l: s.l, d: s.d }));
  return (
    <div>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 10 }}>排名</div>
      <div style={{ marginBottom: 24 }}><StandingsTable ranking={ranking} /></div>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 10 }}>賽程</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {stage.rounds.map((round) => (
          <div key={round.id}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: COLORS.textDim, marginBottom: 8 }}>{round.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {round.matches.map((m) => (
                <MatchCard key={m.id} match={m} editable fullWidth showDraw
                  onSetWinner={(matchId, winnerId) => onSetWinner(stage.id, round.id, matchId, winnerId)}
                  onSetScore={(matchId, side, value) => onSetScore(stage.id, round.id, matchId, side, value)}
                  onSetDraw={(matchId) => onSetDraw(stage.id, round.id, matchId)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketTab({ stages, activeStageId, setActiveStageId, onSetWinner, onSetDraw, onSetScore, onNextSwissRound, onAdvanceFromStage }) {
  const [exportOpen, setExportOpen] = useState(false);
  const [exportText, setExportText] = useState('');
  const [copied, setCopied] = useState(false);

  if (stages.length === 0) {
    return <EmptyState text="尚未建立任何賽事階段" hint="請先到「賽制」頁籤建立第一個階段" />;
  }
  const stage = stages.find((s) => s.id === activeStageId) || stages[stages.length - 1];

  const handleShowExport = () => {
    setExportText(buildStageExportText(stage));
    setExportOpen(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(false);
    }
  };

  return (
    <div>
      {stage.competitionName ? (
        <div style={{ fontSize: 11, color: COLORS.accent, marginBottom: 6 }}>{stage.competitionName}</div>
      ) : null}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 8 }}>
        {stages.map((s) => (
          <button key={s.id} title={s.competitionName || ''} onClick={() => { setActiveStageId(s.id); setExportOpen(false); }} style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: 20, fontSize: 13,
            border: `1px solid ${s.id === stage.id ? COLORS.accent : COLORS.line}`,
            background: s.id === stage.id ? 'rgba(217,166,62,0.12)' : 'transparent',
            color: s.id === stage.id ? COLORS.accent : COLORS.textDim,
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {s.status === 'done' ? <Check size={12} /> : null}
            {s.name}
          </button>
        ))}
      </div>
      {stage.format === 'single' ? (
        <EliminationView stage={stage} onSetWinner={onSetWinner} onSetScore={onSetScore} />
      ) : stage.format === 'swiss' ? (
        <SwissView stage={stage} onSetWinner={onSetWinner} onSetDraw={onSetDraw} onSetScore={onSetScore} onNextRound={onNextSwissRound} />
      ) : (
        <RoundRobinView stage={stage} onSetWinner={onSetWinner} onSetDraw={onSetDraw} onSetScore={onSetScore} />
      )}
      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button variant="secondary" icon={Copy} onClick={handleShowExport}>顯示可複製的賽程結果文字</Button>
        {stage.status === 'done' && stage.format !== 'single' ? (
          <Button variant="secondary" icon={ChevronRight} onClick={() => onAdvanceFromStage(stage)}>以此排名建立下一階段</Button>
        ) : null}
      </div>

      {exportOpen ? (
        <div style={{ marginTop: 14, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: COLORS.textDim }}>點文字框可全選，或直接按下方按鈕複製</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="primary" icon={Copy} onClick={handleCopy}>{copied ? '已複製 ✓' : '複製'}</Button>
              <Button variant="secondary" onClick={() => setExportOpen(false)}>關閉</Button>
            </div>
          </div>
          <textarea
            readOnly
            value={exportText}
            onClick={(e) => e.target.select()}
            style={{
              width: '100%', minHeight: 220, padding: 10, borderRadius: 8,
              border: `1px solid ${COLORS.line}`, background: COLORS.panelAlt, color: COLORS.text,
              fontSize: 13, fontFamily: FONT_MONO, resize: 'vertical', outline: 'none', lineHeight: 1.6,
            }}
          />
        </div>
      ) : null}

      {stage.status === 'done' && stage.format === 'single' ? (
        <div style={{ marginTop: 12, fontSize: 12, color: COLORS.textDim }}>此階段已產生冠軍。如需繼續賽事，請至「賽制」建立下一階段。</div>
      ) : null}
    </div>
  );
}

/* ============================== 選手頁籤 ============================== */
function PlayersTab({ players, onAdd, onRemove, onUpdate, onShuffle }) {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name, nickname);
    setName(''); setNickname('');
  };
  const startEdit = (p) => { setEditingId(p.id); setEditName(p.name); setEditNickname(p.nickname || ''); };
  const saveEdit = () => { onUpdate(editingId, { name: editName.trim(), nickname: editNickname.trim() }); setEditingId(null); };

  return (
    <div>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 10 }}>新增選手</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16 }}>
        <div><FieldLabel>姓名</FieldLabel><TextInput value={name} onChange={setName} placeholder="王小明" /></div>
        <div><FieldLabel>識別名（顯示於賽程，選填）</FieldLabel><TextInput value={nickname} onChange={setNickname} placeholder="例如：隊長 / 選手代號" /></div>
        <Button variant="primary" icon={Plus} onClick={submit}>加入選手</Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: COLORS.textDim }}>選手名單（順序將作為賽制種子順序）</span>
        <span style={{ fontSize: 12, color: COLORS.textFaint, fontFamily: FONT_MONO }}>{players.length} 人</span>
      </div>

      {players.length > 1 ? (
        <div style={{ marginBottom: 14 }}>
          <Button variant="secondary" icon={Shuffle} onClick={onShuffle}>選手排序（隨機亂數）</Button>
        </div>
      ) : null}

      {players.length === 0 ? (
        <EmptyState text="尚未加入任何選手" hint="請在上方輸入姓名並加入" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {players.map((p, idx) => (
            <div key={p.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '10px 12px' }}>
              {editingId === p.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <TextInput value={editName} onChange={setEditName} placeholder="姓名" />
                  <TextInput value={editNickname} onChange={setEditNickname} placeholder="識別名" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="primary" onClick={saveEdit}>儲存</Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)}>取消</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div onClick={() => startEdit(p)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.textFaint, width: 18, flexShrink: 0 }}>{idx + 1}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{p.nickname || p.name}</div>
                      {p.nickname ? <div style={{ fontSize: 11, color: COLORS.textFaint }}>{p.name}</div> : null}
                    </div>
                  </div>
                  <button onClick={() => onRemove(p.id)} style={{ background: 'transparent', border: 'none', color: COLORS.textFaint, cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================== 賽制頁籤 ============================== */
function StagesTab({ players, stages, onCreateStage, onDeleteStage, prefillSourceStageId, clearPrefill }) {
  const [showForm, setShowForm] = useState(stages.length === 0);
  const [competitionName, setCompetitionName] = useState('');
  const [name, setName] = useState('');
  const [format, setFormat] = useState('single');
  const [source, setSource] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [sourceStageId, setSourceStageId] = useState('');
  const [topN, setTopN] = useState(8);
  const [swissRounds, setSwissRounds] = useState(() => Math.max(3, Math.ceil(Math.log2(Math.max(players.length, 2)))));
  const [doubleRound, setDoubleRound] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  const doneStages = stages.filter((s) => s.status === 'done');

  useEffect(() => {
    if (prefillSourceStageId) {
      setShowForm(true);
      setSource('stage');
      setSourceStageId(prefillSourceStageId);
      clearPrefill();
    }
    // eslint-disable-next-line
  }, [prefillSourceStageId]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = () => {
    let participantIds = [];
    if (source === 'all') participantIds = players.map((p) => p.id);
    else if (source === 'manual') participantIds = selectedIds;
    else if (source === 'stage') {
      const srcStage = stages.find((s) => s.id === sourceStageId);
      if (srcStage) {
        const ranking = getStageRanking(srcStage);
        participantIds = ranking.slice(0, Number(topN)).map((r) => r.player.id);
      }
    }
    if (shuffle) participantIds = shuffleArray(participantIds);
    if (participantIds.length < 2) return;
    onCreateStage({ name, competitionName, format, participantIds, swissRounds: Number(swissRounds), doubleRound });
    setName(''); setSelectedIds([]); setShowForm(false);
  };

  const srcStageObj = stages.find((s) => s.id === sourceStageId);
  const srcMax = srcStageObj ? srcStageObj.participants.length : 64;

  return (
    <div>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 10 }}>賽事階段</div>
      {stages.length === 0 ? (
        <EmptyState text="尚未建立任何階段" hint="設定賽制並選擇參賽者以產生賽程" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {stages.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1px solid ${COLORS.line}`, borderRadius: 8 }}>
              <div>
                {s.competitionName ? <div style={{ fontSize: 11, color: COLORS.accent, marginBottom: 2 }}>{s.competitionName}</div> : null}
                <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim }}>{s.participants.length} 位選手・{s.status === 'done' ? '已完成' : '進行中'}</div>
              </div>
              <button onClick={() => onDeleteStage(s.id)} style={{ background: 'transparent', border: 'none', color: COLORS.textFaint, cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>新增賽事階段</Button>
      ) : (
        <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <FieldLabel>比賽名稱（選填，用於區別不同賽事的資料）</FieldLabel>
            <TextInput value={competitionName} onChange={setCompetitionName} placeholder="例如：2026 校慶排球賽" />
          </div>
          <div>
            <FieldLabel>階段名稱（選填）</FieldLabel>
            <TextInput value={name} onChange={setName} placeholder={defaultStageName(format, players.length)} />
          </div>
          <div>
            <FieldLabel>賽制</FieldLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['single', '單淘汰'], ['swiss', '瑞士制'], ['roundrobin', '循環賽']].map(([val, label]) => (
                <button key={val} onClick={() => setFormat(val)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 13,
                  border: `1px solid ${format === val ? COLORS.accent : COLORS.line}`,
                  background: format === val ? 'rgba(217,166,62,0.12)' : 'transparent',
                  color: format === val ? COLORS.accent : COLORS.textDim, cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>
          </div>

          {format === 'swiss' ? (
            <div><FieldLabel>輪數</FieldLabel><NumberInput value={swissRounds} onChange={setSwissRounds} min={1} max={20} /></div>
          ) : null}
          {format === 'roundrobin' ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: COLORS.textDim, cursor: 'pointer' }}>
              <input type="checkbox" checked={doubleRound} onChange={(e) => setDoubleRound(e.target.checked)} />
              雙循環（主客兩回合）
            </label>
          ) : null}

          <div>
            <FieldLabel>參賽者來源</FieldLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <RadioRow checked={source === 'all'} onClick={() => setSource('all')} label={`所有選手（${players.length} 人）`} />
              <RadioRow checked={source === 'manual'} onClick={() => setSource('manual')} label="手動選擇選手" />
              {doneStages.length > 0 ? (
                <RadioRow checked={source === 'stage'} onClick={() => setSource('stage')} label="從已完成的階段晉級" />
              ) : null}
            </div>
          </div>

          {source === 'manual' ? (
            <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {players.map((p) => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} />
                  {p.nickname || p.name}
                </label>
              ))}
            </div>
          ) : null}

          {source === 'stage' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select value={sourceStageId} onChange={(e) => setSourceStageId(e.target.value)} style={inputBase}>
                <option value="">選擇階段</option>
                {doneStages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div><FieldLabel>晉級人數</FieldLabel><NumberInput value={topN} onChange={setTopN} min={2} max={srcMax} /></div>
            </div>
          ) : null}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: COLORS.textDim, cursor: 'pointer' }}>
            <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} />
            隨機排序種子
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button variant="primary" onClick={handleSubmit}>產生賽程</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>取消</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== 主程式 ============================== */
export default function App() {
  const [players, setPlayers] = useState([]);
  const [stages, setStages] = useState([]);
  const [activeTab, setActiveTab] = useState('players');
  const [activeStageId, setActiveStageId] = useState(null);
  const [tournamentName, setTournamentName] = useState('我的錦標賽');
  const [loaded, setLoaded] = useState(false);
  const [prefillSourceStageId, setPrefillSourceStageId] = useState(null);

  useEffect(() => {
    try { const r = localStore.get('tj_players_v1'); if (r) setPlayers(JSON.parse(r.value)); } catch (e) {}
    try { const r = localStore.get('tj_stages_v1'); if (r) setStages(JSON.parse(r.value)); } catch (e) {}
    try {
      const r = localStore.get('tj_meta_v1');
      if (r) {
        const meta = JSON.parse(r.value);
        if (meta.activeStageId) setActiveStageId(meta.activeStageId);
        if (meta.tournamentName) setTournamentName(meta.tournamentName);
      }
    } catch (e) {}
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) localStore.set('tj_players_v1', JSON.stringify(players)); }, [players, loaded]);
  useEffect(() => { if (loaded) localStore.set('tj_stages_v1', JSON.stringify(stages)); }, [stages, loaded]);
  useEffect(() => { if (loaded) localStore.set('tj_meta_v1', JSON.stringify({ activeStageId, tournamentName })); }, [activeStageId, tournamentName, loaded]);

  const addPlayer = (name, nickname) => setPlayers((prev) => [...prev, { id: genId('p'), name: name.trim(), nickname: nickname.trim() }]);
  const removePlayer = (id) => setPlayers((prev) => prev.filter((p) => p.id !== id));
  const updatePlayer = (id, patch) => setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const shufflePlayers = () => setPlayers((prev) => shuffleArray(prev));

  const createStage = ({ name, competitionName, format, participantIds, swissRounds, doubleRound }) => {
    const participants = participantIds.map((id) => players.find((p) => p.id === id)).filter(Boolean);
    if (participants.length < 2) return;
    let rounds = [];
    if (format === 'single') {
      const size = nextPow2(participants.length);
      rounds = [{ id: genId('r'), label: roundLabel(size), size, matches: buildFirstEliminationRound(participants) }];
    } else if (format === 'roundrobin') {
      rounds = generateRoundRobinRounds(participants, doubleRound);
    } else {
      rounds = [{ id: genId('r'), label: '第 1 輪', matches: generateSwissRound(participants, []) }];
    }
    const stage = {
      id: genId('s'),
      competitionName: competitionName && competitionName.trim() ? competitionName.trim() : '',
      name: name && name.trim() ? name.trim() : defaultStageName(format, participants.length),
      format, participants, rounds,
      swissRounds: format === 'swiss' ? swissRounds : null,
      doubleRound: format === 'roundrobin' ? doubleRound : false,
      status: 'active', championId: null,
    };
    setStages((prev) => [...prev, stage]);
    setActiveStageId(stage.id);
    setActiveTab('bracket');
  };

  const deleteStage = (id) => {
    setStages((prev) => prev.filter((s) => s.id !== id));
    setActiveStageId((prev) => (prev === id ? null : prev));
  };

  const handleSetWinner = (stageId, roundId, matchId, winnerId) => {
    setStages((prev) => prev.map((stage) => {
      if (stage.id !== stageId) return stage;
      let rounds = stage.rounds.map((r) => (r.id !== roundId ? r : { ...r, matches: r.matches.map((m) => (m.id === matchId ? { ...m, winner: winnerId, draw: false } : m)) }));
      if (stage.format === 'single') {
        rounds = rebuildEliminationRounds(rounds, roundId);
      }
      const { status, championId } = withCompletionCheck(stage, rounds);
      return { ...stage, rounds, status, championId };
    }));
  };

  const handleSetDraw = (stageId, roundId, matchId) => {
    setStages((prev) => prev.map((stage) => {
      if (stage.id !== stageId) return stage;
      const rounds = stage.rounds.map((r) => (r.id !== roundId ? r : { ...r, matches: r.matches.map((m) => (m.id === matchId ? { ...m, draw: !m.draw, winner: null } : m)) }));
      const { status, championId } = withCompletionCheck(stage, rounds);
      return { ...stage, rounds, status, championId };
    }));
  };

  const handleSetScore = (stageId, roundId, matchId, side, rawValue) => {
    const parsed = rawValue === '' ? null : Number(rawValue);
    const value = (parsed === null || isNaN(parsed)) ? null : parsed;
    setStages((prev) => prev.map((stage) => {
      if (stage.id !== stageId) return stage;
      let rounds = stage.rounds.map((r) => {
        if (r.id !== roundId) return r;
        return {
          ...r,
          matches: r.matches.map((m) => {
            if (m.id !== matchId || m.bye) return m;
            const next = { ...m, [side]: value };
            const s1 = next.score1, s2 = next.score2;
            if (s1 !== null && s1 !== undefined && s2 !== null && s2 !== undefined) {
              if (s1 > s2) { next.winner = next.p1.id; next.draw = false; }
              else if (s2 > s1) { next.winner = next.p2.id; next.draw = false; }
              else if (stage.format !== 'single') { next.winner = null; next.draw = true; }
            }
            return next;
          }),
        };
      });
      if (stage.format === 'single') {
        rounds = rebuildEliminationRounds(rounds, roundId);
      }
      const { status, championId } = withCompletionCheck(stage, rounds);
      return { ...stage, rounds, status, championId };
    }));
  };

  const handleNextSwissRound = (stageId) => {
    setStages((prev) => prev.map((stage) => {
      if (stage.id !== stageId || stage.format !== 'swiss') return stage;
      const roundNum = stage.rounds.length;
      if (roundNum >= stage.swissRounds) return stage;
      const newMatches = generateSwissRound(stage.participants, stage.rounds);
      const rounds = [...stage.rounds, { id: genId('r'), label: `第 ${roundNum + 1} 輪`, matches: newMatches }];
      return { ...stage, rounds };
    }));
  };

  const handleAdvanceFromStage = (stage) => {
    setPrefillSourceStageId(stage.id);
    setActiveTab('format');
  };

  const handleResetAll = () => {
    if (!window.confirm('確定要清除所有選手與賽程資料嗎？此動作無法復原。')) return;
    setPlayers([]); setStages([]); setActiveStageId(null); setTournamentName('我的錦標賽');
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, display: 'flex', justifyContent: 'center' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
      `}</style>
      <div style={{ width: '100%', maxWidth: 430, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", color: COLORS.text }}>
        <div style={{ padding: '22px 20px 16px', borderBottom: `1px solid ${COLORS.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none', color: COLORS.text,
                fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22, padding: 0,
              }}
            />
            <button onClick={handleResetAll} title="重設所有資料" style={{ background: 'transparent', border: 'none', color: COLORS.textFaint, cursor: 'pointer', marginLeft: 8 }}>
              <RotateCcw size={16} />
            </button>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textFaint, marginTop: 4 }}>
            {players.length} 位選手・{stages.length} 個賽事階段
          </div>
        </div>

        <div style={{ flex: 1, padding: '18px 20px 100px', overflowY: 'auto' }}>
          {activeTab === 'players' ? (
            <PlayersTab players={players} onAdd={addPlayer} onRemove={removePlayer} onUpdate={updatePlayer} onShuffle={shufflePlayers} />
          ) : activeTab === 'format' ? (
            <StagesTab players={players} stages={stages} onCreateStage={createStage} onDeleteStage={deleteStage}
              prefillSourceStageId={prefillSourceStageId} clearPrefill={() => setPrefillSourceStageId(null)} />
          ) : (
            <BracketTab stages={stages} activeStageId={activeStageId} setActiveStageId={setActiveStageId}
              onSetWinner={handleSetWinner} onSetDraw={handleSetDraw} onSetScore={handleSetScore}
              onNextSwissRound={handleNextSwissRound} onAdvanceFromStage={handleAdvanceFromStage} />
          )}
        </div>

        <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, display: 'flex', borderTop: `1px solid ${COLORS.line}`, background: COLORS.bg }}>
          {[['players', Users, '選手'], ['format', Layers, '賽制'], ['bracket', GitBranch, '賽程']].map(([key, Icon, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              flex: 1, padding: '14px 0', background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              color: activeTab === key ? COLORS.accent : COLORS.textFaint,
            }}>
              <Icon size={19} />
              <span style={{ fontSize: 11 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
