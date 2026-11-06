import {profile,phase,cycleLength} from './reproductive-engine.js';
// Compatibility API. One cycle per explicitly selected carrier; no sex/role inference.
import {getPregnancyData} from './state.js';
import { getPhaseInfo } from './helpers.js';
export function isOmegaverse(s) { return false; }
export function carrierMode(s) {
    if (['user', 'char', 'both', 'none'].includes(s?.carrierMode)) return s.carrierMode;
    return ['user', 'char', 'both', 'none'].includes(s?.trackFor) ? s.trackFor : 'user';
}
export function canCarry(s, who) {
    if (who !== 'user' && who !== 'char') return false;
    const role = profile(s,who).reproductiveRole;
    if (role !== 'auto') return role === 'carry' || role === 'both';
    const m=carrierMode(s);
    return m==='both' || m===who;
}
export function canFertilize(s, who) {
    if (who !== 'user' && who !== 'char') return false;
    const role=profile(s,who).reproductiveRole;
    // 'auto' means old saves keep their previous conception behaviour.
    return role==='auto' || role==='fertilize' || role==='both';
}
export function hasMenstrualCycle(s, who) { return canCarry(s, who) && profile(s,who).cycleType === 'menstrual'; }
export function hasAnyTracking(s, who) { const mode = s?.trackFor || 'user'; return mode === 'both' || mode === who; }
// Legacy callers cannot reintroduce role-based fertility or independent clocks.
export function designationOf(s, who) {
    const role = who === 'char' ? s?.charDesignation : s?.userDesignation;
    return ['alpha','beta','omega'].includes(role) ? role : who === 'char' ? 'alpha' : 'omega';
}
export function hasCycle(s, who) { return hasAnyTracking(s,who) && profile(s,who).cycleType !== 'none'; }
export function roleLabel(s, who) { return {alpha:'Альфа',beta:'Бета',omega:'Омега'}[designationOf(s,who)]; }
export function cyclePhase(s,who,day,lang='ru') { return phase(s,who,day,getPregnancyData().rpDate,lang); }
export function sexOf(s, who) { return who === 'char' ? s?.charSex : s?.userSex; }
export function getCfg() { return { heatCycleLength: 28, heatDuration: 5, rutCycleLength: 28, rutDuration: 0 }; }
export function getHeatPhase(day) {
    const d = Math.max(1, Math.trunc(Number(day)) || 1);
    const info = getPhaseInfo(d, 'ru', true);
    const heat = d >= 12 && d <= 16;
    return { phase: heat ? 'heat' : d > 28 ? 'delayed' : 'normal', day: d, len: 28,
        label: info.name + (heat ? ` · ${d - 11}/5 дн.` : ''),
        sub: d > 28 ? `Задержка ${d - 28} дн.` : `день ${d} из 28`,
        labelEn: getPhaseInfo(d, 'en', true).name + ` (cycle day ${d}/28)`, fertility: 1 };
}
export function getRutPhase(day) { const phase = getHeatPhase(day); return { ...phase, phase: phase.phase === 'heat' ? 'rut' : phase.phase, inRut: phase.phase === 'heat', potency: phase.phase === 'heat' ? 1.5 : 1 }; }
export function carrierAboStatus(carrier, desig, s) {
    if (carrier?.isPregnant) return { kind:'cycle', phase:'paused', label:'Цикл приостановлен', labelEn:'cycle paused', fertility:0 };
    const day = Math.max(1, parseInt(carrier?.cycleDay) || 1), active = day >= 12 && day <= 16;
    const phase = desig === 'omega' && active ? 'heat' : desig === 'alpha' && active ? 'rut' : 'normal';
    return { kind:desig, phase, day, len:28, inRut:phase==='rut', fertility:1, label:phase==='heat'?'Течка':phase==='rut'?'Гон':desig==='alpha'?'Вне гона':desig==='omega'?'Между течками':'Бета' };
}
export function advanceAboCycles() { return []; }
