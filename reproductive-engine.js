// Pure game rules. All durations use story days; no wall-clock advancement.
export const clamp = (v, lo, hi, fallback = lo) => Math.max(lo, Math.min(hi, Number.isFinite(Number(v)) ? Number(v) : fallback));
export const profileDefaults = () => ({race:'', cycleType:'menstrual', cycleLength:28, periodDays:5,
    compatible:true, health:'', humanComplications:true, customComplications:[], disabledComplications:[],
    heat:{enabled:false,mode:'cycle',start:12,duration:3,date:'',chance:90,outside:0,tags:[]},
    rut:{enabled:false,mode:'cycle',start:12,duration:3,date:'',chance:90,multiplier:2,chanceMode:'multiply',tags:[]}});
export function customComplicationId(name) {
    let hash = 2166136261;
    for (const letter of String(name).trim().toLowerCase()) hash = Math.imul(hash ^ letter.codePointAt(0), 16777619);
    return 'custom-' + (hash >>> 0).toString(16);
}
export function profile(s, who = 'user') {
    const d = profileDefaults(), raw = s.profiles?.[who] || {};
    const p = {...d, ...raw, heat:{...d.heat,...raw.heat}, rut:{...d.rut,...raw.rut}};
    if (!s.profiles && s.menstruationEnabled === false) p.cycleType = 'silent';
    if (!['menstrual','silent','heat','none'].includes(p.cycleType)) p.cycleType = 'menstrual';
    p.cycleLength = Math.round(clamp(p.cycleLength,2,10000,28));
    p.periodDays = Math.round(clamp(p.periodDays,0,p.cycleLength-1,5));
    p.race = typeof p.race === 'string' ? p.race.trim() : '';
    p.health = typeof p.health === 'string' ? p.health.trim() : '';
    p.disabledComplications = Array.isArray(p.disabledComplications) ? p.disabledComplications : [];
    const seen = new Set();
    p.customComplications = (Array.isArray(p.customComplications) ? p.customComplications : []).filter(item => item && typeof item.name==='string' && item.name.trim()).map(item => ({
        id: typeof item.id==='string' && item.id ? item.id : customComplicationId(item.name),
        name:item.name.trim(), description:typeof item.description==='string'?item.description:'',
        stages:Array.isArray(item.stages) ? [...new Set(item.stages.filter(n=>[1,2,3].includes(n)))] : [1,2,3],
    })).filter(item=>{ if(seen.has(item.id)) return false; seen.add(item.id); return true; });
    for (const k of ['heat','rut']) {
        const c = p[k];
        c.mode = c.mode==='seasonal'?'seasonal':'cycle';
        c.duration = Math.round(clamp(c.duration,1,c.mode==='seasonal'?364:p.cycleLength-1,3));
        c.start = Math.round(clamp(c.start,1,p.cycleLength,12));
        c.chance = clamp(c.chance,0,100,90);
        c.outside = clamp(c.outside,0,100,0);
        c.multiplier = clamp(c.multiplier,0,100,2);
        c.chanceMode = c.chanceMode==='fixed'?'fixed':'multiply';
        c.date = typeof c.date==='string'?c.date:'';
        const tags = new Set();
        c.tags = (Array.isArray(c.tags)?c.tags:[]).filter(t=>t && typeof t.name==='string' && t.name.trim()).map(t=>({name:t.name.trim(),description:typeof t.description==='string'?t.description:''})).filter(t=>{if(tags.has(t.name))return false;tags.add(t.name);return true;});
    }
    return p;
}
export const cycleLength = (s,who='user') => profile(s,who).cycleLength;
export function activePeriod(p, kind, day, rpDate) {
    const c = p[kind];
    if (!(c.enabled || (kind === 'heat' && p.cycleType === 'heat'))) return false;
    if (c.mode === 'seasonal') {
        if (!rpDate || !/^\d{2}-\d{2}$/.test(c.date)) return null;
        const now = new Date(rpDate), [m,d] = c.date.split('-').map(Number);
        if (!Number.isFinite(+now)) return null;
        const valid=new Date(Date.UTC(2000,m-1,d));
        if(valid.getUTCMonth()!==m-1 || valid.getUTCDate()!==d)return null;
        const year = now.getUTCFullYear();
        return [year-1,year].some(y => {
            const start = Date.UTC(y,m-1,d), dt = new Date(start);
            return dt.getUTCMonth()===m-1 && dt.getUTCDate()===d && +now>=start && +now<start+c.duration*86400000;
        });
    }
    if (p.cycleType === 'none' || day>p.cycleLength || day<1) return false;
    return ((day-c.start)%p.cycleLength+p.cycleLength)%p.cycleLength < c.duration;
}
export function phase(s,who,day,rpDate,lang='ru') {
    const p=profile(s,who), heat=activePeriod(p,'heat',day,rpDate), rut=activePeriod(p,'rut',day,rpDate), en=lang==='en';
    const scaled = (day-1)/p.cycleLength;
    const bleeding = p.cycleType==='menstrual' && day<=p.periodDays;
    const ovulation = p.cycleType!=='none' && day<=p.cycleLength && scaled>=11/28 && scaled<16/28;
    const name=heat ? (en?'Heat':'Течка') : rut ? (en?'Rut':'Гон') : p.cycleType==='none' ? (en?'No cycle':'Без цикла') : day>p.cycleLength ? (en?'Delayed':'Задержка') : bleeding ? (en?'Menstruation':'Менструация') : ovulation ? (en?'Ovulation':'Овуляция') : scaled<11/28 ? (en?'Follicular':'Фолликулярная') : (en?'Luteal':'Лютеиновая');
    return {name,heat,rut,bleeding,ovulation,icon:heat||rut?'fa-fire':bleeding?'fa-droplet':'fa-seedling',color:heat||rut?'#b77c65':bleeding?'#b06475':'#749487'};
}
export function conceptionChance(s,who,day,rpDate,partnerDay=1, partnerCycling=true) {
    const p=profile(s,who), other=profile(s,who==='user'?'char':'user');
    if (!p.compatible || !other.compatible) return 0;
    let chance;
    const h=activePeriod(p,'heat',day,rpDate), configured=p.heat.enabled||p.cycleType==='heat';
    if (configured) chance=h===true?p.heat.chance:p.heat.outside;
    else if (p.cycleType==='none') chance=20;
    else {
        const d=Math.floor((day-1)/p.cycleLength*28)+1;
        chance=20*(d<=5?.01:d<=8?.15:d<=11?.7:d<=16?1.65:d<=18?.2:.02);
    }
    if (partnerCycling && activePeriod(other,'rut',partnerDay,rpDate)) chance=other.rut.chanceMode==='fixed' ? other.rut.chance : chance*other.rut.multiplier;
    // A fixed rut chance never bypasses an explicit zero-fertility window.
    if (configured && h!==true && Number(p.heat.outside)===0) return 0;
    return clamp(chance,0,100);
}
// Narrative vocabulary, not medical incidence rates. Selection is context-based.
export const catalog = [
 ['hyperemesis','Сильный токсикоз',1,'тошнота, рвота, слабость'],
 ['hematoma','Гематома плодных оболочек',1,'находка на обследовании; возможны выделения'],
 ['threat','Угроза прерывания',1,'кровянистые выделения, тянущая боль; исход определяет шкала'],
 ['dehydration','Обезвоживание',1,'жажда, слабость на фоне рвоты'],
 ['thyroid','Нарушение функции щитовидной железы',1,'изменение самочувствия, лабораторное обследование'],
 ['anemia','Анемия',[1,2,3],'утомляемость, слабость, результаты анализов'],
 ['infection','Инфекция мочевых путей',[1,2,3],'дискомфорт или находка в анализе'],
 ['diabetes','Гестационный диабет',[2,3],'может не ощущаться, выявляется исследованием глюкозы'],
 ['cervix','Укорочение шейки матки',2,'выявляется при соответствующем обследовании'],
 ['placenta','Низкое расположение плаценты',[2,3],'данные обследования; возможно кровотечение'],
 ['pressure','Гестационная гипертензия',[2,3],'повышенное давление при измерении'],
 ['preeclampsia','Преэклампсия',[2,3],'повышение давления, возможны головная боль и нарушения зрения'],
 ['growth','Задержка роста плода',[2,3],'несоответствие роста по обследованию'],
 ['oligo','Маловодие',[2,3],'сниженное количество околоплодных вод'],
 ['poly','Многоводие',[2,3],'увеличенное количество околоплодных вод'],
 ['cholestasis','Холестаз',3,'зуд, данные анализов'],
 ['abruption','Отслойка плаценты',3,'боль, возможно кровотечение; срочное состояние'],
 ['preterm','Угроза преждевременных родов',[2,3],'схватки или изменения шейки; без автоматических родов'],
 ['membranes','Преждевременное излитие вод',[2,3],'подтекание жидкости'],
 ['breech','Неправильное положение плода',3,'находка обследования, влияет на план родов'],
 ['rh','Резус-сенсибилизация',[2,3],'только при установленной в мире совместимой биологии'],
 ['hellp','HELLP-синдром',3,'серьёзное состояние, выявляется по обследованиям'],
].map(([id,name,stages,description])=>({id,name,stages:Array.isArray(stages)?stages:[stages],description}));
export function care(c) {
    if (!c._care || typeof c._care!=='object' || Array.isArray(c._care)) c._care={};
    const a=c._care;
    for (const [key,value] of Object.entries({load:0,event:null,reasons:[],screenings:{},processed:[],nextVisit:'',doctor:'',result:''})) {
        if (a[key]===undefined) a[key]=value;
    }
    a.load=clamp(a.load,0,100);
    for(const key of ['reasons','processed']) if(!Array.isArray(a[key]))a[key]=[];
    if(!a.screenings || typeof a.screenings!=='object' || Array.isArray(a.screenings))a.screenings={};
    return a;
}
export const trimester = (c,s) => Math.min(3,Math.max(1,Math.floor((c.pregnancyWeeks||0)/(s.pregnancyDuration||40)*3)+1));
export function candidates(s,who,c) {
    const p=profile(s,who), stage=trimester(c,s), existing=new Set((c.complications||[]).map(x=>x.type));
    const seen=new Set(), names=new Set();
    return [...(p.humanComplications?catalog:[]),...p.customComplications].filter(x=>{
        if(!x.stages.includes(stage) || p.disabledComplications.includes(x.id) || existing.has(x.name) || seen.has(x.id) || names.has(x.name)) return false;
        seen.add(x.id);names.add(x.name);return true;
    });
}
export function pendingScreen(c) {
    return Object.entries(care(c).screenings).find(([,rec])=>rec && Array.isArray(rec.selected) && rec.selected.length<rec.count)?.[1] || null;
}
function availableForScreen(c,s,who,rec) {
    // Keep the meaning and stage of a completed examination if settings later change.
    const pool=Array.isArray(rec.candidates)?rec.candidates:candidates(s,who,c).filter(x=>rec.pool?.includes(x.id));
    const existing=new Set((c.complications||[]).map(x=>x.type));
    return pool.filter(x=>!rec.selected.includes(x.id) && !existing.has(x.name));
}
export function screen(c,s,who,rnd=Math.random) {
    const a=care(c), stage=trimester(c,s), key=String(stage);
    if (!c.isPregnant || a.event || a.maternalDeath || a.screenings[key] || pendingScreen(c)) return false;
    let count=0;
    const chances=Array.isArray(s.complicationChances)?s.complicationChances:[30,15,1];
    for (const chance of chances.slice(0,3)) { if (rnd()*100>=clamp(chance,0,100)) break; count++; }
    const pool=candidates(s,who,c);
    count=Math.min(count,pool.length);
    a.screenings[key]={count,selected:[],pool:pool.map(x=>x.id),candidates:structuredClone(pool)};
    a.result=count ? 'Обследование: результат уточняется' : 'Обследование: новых осложнений не выявлено';
    return true;
}
export function chooseDiagnoses(c,s,who,ids) {
    const a=care(c), rec=pendingScreen(c);
    if (a.event || a.maternalDeath || !c.isPregnant || !rec || !Array.isArray(ids)) return false;
    c.complications ||= [];
    let changed=false;
    for (const id of ids) {
        if (rec.selected.length>=rec.count) break;
        const item=availableForScreen(c,s,who,rec).find(x=>x.id===id);
        if (!item) continue;
        rec.selected.push(item.id);c.healthStatus='warning';changed=true;
        c.complications.push({type:item.name,id:item.id,description:item.description,severity:'warning',resolved:false,week:c.pregnancyWeeks||0});
    }
    if (rec.selected.length===rec.count && rec.count) a.result='Обследование: '+c.complications.filter(x=>!x.resolved).map(x=>x.type).join(', ');
    return changed;
}
export function resolveDiagnoses(c,ids) {
    if(!Array.isArray(ids))return false;
    let changed=false;
    for(const item of c.complications||[]) if(!item.resolved && ids.includes(item.id||item.type)){item.resolved=true;changed=true;}
    if(changed && !care(c).event) c.healthStatus=(c.complications||[]).some(x=>!x.resolved)?'warning':'normal';
    return changed;
}
export function changeLoad(c,delta,reason,rnd=Math.random) {
    const a=care(c);
    if (!c.isPregnant || a.event || a.maternalDeath || !Number.isFinite(delta)) return false;
    a.load=clamp(a.load+delta,0,100);
    if (reason) a.reasons=[...a.reasons,String(reason).slice(0,160)].slice(-3);
    if(a.load<70 && a.result.startsWith('Беременность сохранена'))a.result='Беременность сохранена.';
    if (a.load===100) {
        c._dynamic={}; c.healthStatus='critical'; a.event=rnd()<.5?'loss':'rescue';
        a.result=a.event==='loss'?'Потеря беременности подтверждена':'Кровотечение; возможна помощь и сохранение беременности';
        a.frozenWeeks=c.pregnancyWeeks||0;
    }
    return true;
}
export function completeCare(c) {
    const a=care(c);
    if (a.maternalDeath) return false;
    if (a.event==='rescue') {
        a.event=null;a.load=70;c.healthStatus='warning';a.result='Беременность сохранена. Риск всё ещё высокий.';
        return true;
    }
    if (['loss','frozen'].includes(a.event)) {
        c._lastPregnancyOutcome=a.event;c.isPregnant=false;c._userSetWeeksAt=Date.now();c._dynamic={};c.fetusCount=0;c.fetusSex=[];
        c.fetusSexRevealed=false;c.pregnancyKnown=false;c.healthStatus='normal';c.conceptionDate=null;c.pregnancyWeeks=0;
        c._plannedComplications=[];c._conceptionAnchored=false;c.lastTestResult=null;c.testTakenAt=null;c.complications=[];
        a.event=null;a.load=0;a.nextVisit='';a.recovery=true;a.result='Потеря беременности; восстановление по сюжету.';
        return true;
    }
    return false;
}
export function carePrompt(c,s,who) {
    const a=care(c), name=who==='user'?'{{user}}':'{{char}}', target=who==='user'?'care':'partner.care';
    if (a.maternalDeath) return `${name}: гибель подтверждена по сюжету.`;
    if (a.event==='frozen') return `Беременность ${name} замерла; плод погиб. Обнаружение — по контексту и способностям персонажей.`;
    if (a.event==='loss') return `${name}: потеря беременности подтверждена; событие ещё не завершено.`;
    if (a.event==='rescue') return `${name}: кровотечение; беременность можно сохранить с помощью, риск высокий.`;
    if (!c.isPregnant) return a.recovery?`${name}: восстановление после потери беременности.`:'';
    let text=`${name}: нагрузка ${a.load}/100${a.load>=70?', риск высокий':''}.`;
    if (a.nextVisit) text+=` Приём: ${JSON.stringify(a.nextVisit)}${a.doctor?' ('+JSON.stringify(a.doctor)+')':''}.`;
    const rec=pendingScreen(c), customIDs=new Set(profile(s,who).customComplications.map(x=>x.id));
    if (rec) text+=` Обследование: выбери ${rec.count-rec.selected.length} новых осложнений по известному здоровью и результатам осмотра из ${JSON.stringify(availableForScreen(c,s,who,rec).map(({id,name,description})=>customIDs.has(id)?{id,name,description}:{id,name}))}. Верни ID в ${target}.diagnoses.`;
    return text;
}

export function termInfo(c,rpDate) {
    if (['loss','frozen'].includes(care(c).event)) return {weeks:care(c).frozenWeeks||0,days:0};
    if (c.conceptionDate && rpDate) {
        const days=Math.floor((new Date(rpDate)-new Date(c.conceptionDate))/86400000);
        if(Number.isFinite(days)&&days>=0)return {weeks:Math.floor(days/7),days:days%7};
    }
    return {weeks:c.pregnancyWeeks||0,days:0};
}

export function bodyDay(s,who,day) {
    const p=profile(s,who);
    if(p.cycleType==='none')return 10;
    if(p.cycleType==='menstrual'&&day<=p.periodDays)return Math.max(1,Math.ceil(day/Math.max(1,p.periodDays)*5));
    const scaled=Math.max(1,Math.floor((day-1)/p.cycleLength*28)+1);
    return scaled<=5?6:scaled;
}
