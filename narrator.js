// Pure, serializable narrator/paternity rules. No SillyTavern dependencies.
// Possible contacts are fictional RP facts, not evidence about real-world parentage.
export const narratorRoles = Object.freeze(['carry', 'fertilize', 'both', 'none']);
export const gestationKinds = Object.freeze(['uterine', 'egg', 'other']);
export function normalizeParticipant(name) { return String(name || '').trim().replace(/\s+/g, ' ').slice(0, 80); }
export function cleanRole(role) { return narratorRoles.includes(role) ? role : 'none'; }
export function addParticipant(list, name, role = 'none') {
    const n = normalizeParticipant(name);
    const copy = Array.isArray(list) ? [...list] : [];
    if (!n || copy.some(x => x.name.toLocaleLowerCase() === n.toLocaleLowerCase())) return copy;
    if (copy.length < 40) copy.push({name:n, role:cleanRole(role)});
    return copy;
}
export function addContact(list, name, count = 1) {
    const n = normalizeParticipant(name);
    const copy = Array.isArray(list) ? list.map(x => ({name:normalizeParticipant(x.name), count:Math.max(1, Math.min(20, Number(x.count)||1))})) : [];
    if (!n) return copy;
    const found = copy.find(x => x.name.toLocaleLowerCase() === n.toLocaleLowerCase());
    if (found) found.count = Math.min(20, found.count + Math.max(1, Math.min(20, Number(count)||1)));
    else if (copy.length < 40) copy.push({name:n, count:Math.max(1,Math.min(20,Math.trunc(Number(count)||1)))});
    return copy;
}
// The roll happens only when the narrative DNA event is confirmed.
// Once assigned, a second reading never re-rolls it.
export function chooseGeneticParent(contacts, random = Math.random) {
    const valid = (Array.isArray(contacts) ? contacts : []).filter(x => normalizeParticipant(x.name)).map(x => ({name:normalizeParticipant(x.name), count:Math.max(1, Math.min(20, Number(x.count)||1))}));
    if (!valid.length) return null;
    const total = valid.reduce((n,x) => n+x.count,0);
    const r = Math.max(0,Math.min(0.999999999,Number(random()))) * total;
    let acc=0;
    for (const x of valid) { acc+=x.count; if(r<acc)return x.name; }
    return valid.at(-1).name;
}
// RPG narrative probabilities only; never label these as clinical estimates.
export function dnaProcedure(method = 'noninvasive', gestation = 'uterine', weeks = 0, born = false) {
    if (born) return {allowed:true, risk:0, label:'После рождения'};
    if (!['noninvasive','invasive'].includes(method)) return {allowed:false,risk:0,label:'Выбери метод теста'};
    const kind = gestationKinds.includes(gestation) ? gestation : 'uterine';
    if (method === 'noninvasive') {
        if (kind === 'uterine' && weeks < 10) return {allowed:false,risk:0,label:'Для условного анализа крови дождись 10-й недели'};
        return {allowed:true,risk:0,label:'Без вмешательства'};
    }
    if (kind === 'uterine' && weeks < 11) return {allowed:false,risk:0,label:'Внутриматочное инвазивное исследование недоступно до 11-й недели'};
    return {allowed:true, risk:kind==='egg'?0.01:kind==='uterine'?0.04:0.02, label:kind==='egg'?'Игровой риск ниже: обследование яйца':'Есть условный игровой риск вмешательства'};
}
export function performNarrativeDNA(target, {method='noninvasive',gestation='uterine',weeks=0,born=false,random=Math.random}={}) {
    if (!target) return {ok:false,reason:'Нет выбранного носителя или ребёнка'};
    if (target.dnaResult?.parent) return {ok:true,existing:true,result:target.dnaResult};
    const proc = dnaProcedure(method,gestation,weeks,born);
    if (!proc.allowed) return {ok:false,reason:proc.label};
    const fixed = target._secondParentManual && normalizeParticipant(target.fatherName);
    const parent = fixed || chooseGeneticParent(target.paternityCandidates,random);
    if (!parent) return {ok:false,reason:'Укажи возможных родителей или известного второго родителя'};
    const alert = proc.risk>0 && random() < proc.risk;
    target.fatherName = parent;
    target._secondParentManual = !!fixed;
    target.dnaResult = {parent, method:born?'afterBirth':method, gestation, procedureAlert: alert, source:fixed?'manual':'roll'};
    return {ok:true,existing:false,result:target.dnaResult};
}
